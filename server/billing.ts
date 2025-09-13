import Paystack from 'paystack-sdk';
import { db } from './db';
import { userCredits, transactions, paymentSessions } from '@shared/schema';
import { eq, and, sql } from 'drizzle-orm';

// Pricing constants from specifications
const PLATFORM_FEE = 0.002;
const LLM_FEE_SHORT = 0.005; // ≤500 tokens
const LLM_FEE_LONG = 0.01;   // ≤1500 tokens
const ADDON_FEE = 0.002;
const SIGNUP_BONUS = 10.0;

export class BillingService {
  private paystack?: Paystack;
  private initialized = false;

  constructor() {
    // No initialization at constructor time - use lazy loading
  }

  private ensureInitialized(): void {
    if (this.initialized) return;
    
    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!secretKey) {
      throw new Error('Paystack secret key not configured. Please set PAYSTACK_SECRET_KEY environment variable.');
    }
    
    try {
      this.paystack = new Paystack(secretKey);
      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize Paystack:', error);
      throw new Error('Paystack initialization failed - check API key configuration');
    }
  }

  // Calculate message cost based on token count
  calculateMessageCost(tokensUsed: number, addons: number = 0): number {
    const llmFee = tokensUsed <= 500 ? LLM_FEE_SHORT : LLM_FEE_LONG;
    const addonCost = addons * ADDON_FEE;
    const totalCost = PLATFORM_FEE + llmFee + addonCost;
    
    // Round up to nearest 0.001 credit
    return Math.ceil(totalCost * 1000) / 1000;
  }

  // Estimate tokens for a message (simple approximation)
  estimateTokens(message: string): number {
    // Rough approximation: 1 token ≈ 4 characters
    // This is a simplified version, in production you'd use tiktoken or similar
    return Math.ceil(message.length / 4);
  }

  // Deduct credits for chat message with atomic race-condition protection
  async deductCredits(userId: string, tenantId: string, tokensUsed: number, conversationId: string, messageId?: string): Promise<number> {
    const cost = this.calculateMessageCost(tokensUsed);
    
    // ATOMIC TRANSACTION: Balance check and deduction in single operation
    const result = await db.transaction(async (tx) => {
      // If messageId provided, check for duplicate processing (idempotency protection)
      if (messageId) {
        const [existingTransaction] = await tx
          .select()
          .from(transactions)
          .where(and(
            eq(transactions.userId, userId),
            eq(transactions.tenantId, tenantId),
            eq(transactions.type, 'deduction'),
            eq(transactions.messageId, messageId)
          ));
        
        if (existingTransaction) {
          throw new Error('Message already processed');
        }
      }

      // CRITICAL FIX: Atomic balance deduction with sufficient funds check
      // This prevents race conditions by including balance check in WHERE clause
      const updateResult = await tx
        .update(userCredits)
        .set({ 
          balance: sql`balance - ${cost}`,
          updatedAt: new Date()
        })
        .where(and(
          eq(userCredits.userId, userId), 
          eq(userCredits.tenantId, tenantId),
          sql`balance >= ${cost}` // Only update if sufficient balance exists
        ))
        .returning({ newBalance: userCredits.balance });

      // Check if update actually occurred (means sufficient balance existed)
      if (updateResult.length === 0) {
        // No rows updated = insufficient balance - this prevents overdrafts
        throw new Error('Insufficient credits');
      }

      // Record transaction with optional messageId for idempotency
      await tx.insert(transactions).values({
        userId,
        tenantId,
        type: 'deduction',
        amount: cost.toString(),
        description: `Chat message (${tokensUsed} tokens)`,
        messageId,
        metadata: { conversationId, tokensUsed }
      });

      return cost;
    });

    return result;
  }

  // Initialize Paystack payment
  async initializePayment(userId: string, tenantId: string, amount: number, email: string) {
    this.ensureInitialized();
    
    // Validate inputs
    if (!userId || !tenantId || !email || amount < 1 || amount > 1000) {
      throw new Error('Invalid payment parameters');
    }

    const response = await this.paystack!.transaction.initialize({
      email,
      amount: amount * 100, // Convert to kobo
      currency: 'USD', // CRITICAL: Specify currency explicitly
      metadata: {
        userId,
        tenantId,
        credits: amount
      },
      callback_url: `${process.env.BASE_URL || 'http://localhost:5000'}/api/billing/verify`
    });

    // Save payment session
    await db.insert(paymentSessions).values({
      userId,
      tenantId,
      amount: amount.toString(),
      paystackReference: response.data.reference,
      authorizationUrl: response.data.authorization_url,
      status: 'pending'
    });

    return response.data;
  }

  // Verify and complete payment with atomic processing
  async verifyPayment(reference: string) {
    this.ensureInitialized();
    
    if (!reference) {
      throw new Error('Payment reference is required');
    }

    // ATOMIC TRANSACTION to prevent race conditions and double-processing
    const result = await db.transaction(async (tx) => {
      // First, try to atomically update status from pending to processing
      const updateResult = await tx
        .update(paymentSessions)
        .set({ 
          status: 'processing',
          updatedAt: new Date()
        })
        .where(and(
          eq(paymentSessions.paystackReference, reference),
          eq(paymentSessions.status, 'pending')
        ))
        .returning();

      // If no rows were updated, check the current status
      if (updateResult.length === 0) {
        const [existingSession] = await tx
          .select()
          .from(paymentSessions)
          .where(eq(paymentSessions.paystackReference, reference));
        
        if (!existingSession) {
          throw new Error('Payment session not found');
        }
        
        if (existingSession.status === 'completed') {
          return { status: 'success', message: 'Payment already processed', alreadyProcessed: true };
        }
        
        if (existingSession.status === 'failed') {
          return { status: 'failed', message: 'Payment session failed' };
        }
        
        throw new Error('Payment session is being processed or in invalid state');
      }

      const session = updateResult[0];
      
      try {
        // Verify with Paystack
        const verification = await this.paystack!.transaction.verify(reference);
        
        if (verification.data.status === 'success') {
          const { userId, tenantId, credits } = verification.data.metadata;
          
          // Validate metadata
          if (!userId || !tenantId || !credits) {
            throw new Error('Invalid payment metadata');
          }
          
          const creditsAmount = parseFloat(credits.toString());
          
          // Update payment session to completed
          await tx
            .update(paymentSessions)
            .set({ 
              status: 'completed',
              completedAt: new Date()
            })
            .where(eq(paymentSessions.id, session.id));

          // Add credits to user balance using upsert
          await tx
            .insert(userCredits)
            .values({
              userId,
              tenantId,
              balance: creditsAmount.toString()
            })
            .onConflictDoUpdate({
              target: [userCredits.userId, userCredits.tenantId],
              set: {
                balance: sql`${userCredits.balance} + ${creditsAmount}`,
                updatedAt: new Date()
              }
            });

          // Record transaction
          await tx.insert(transactions).values({
            userId,
            tenantId,
            type: 'topup',
            amount: creditsAmount.toString(),
            description: 'Credit top-up via Paystack',
            reference,
            metadata: verification.data
          });
          
          console.log(`Payment ${reference} processed successfully: $${creditsAmount} credits added to user ${userId}`);
          return { status: 'success', message: 'Payment processed successfully', data: verification.data };
          
        } else if (verification.data.status === 'failed') {
          // Mark payment session as failed
          await tx
            .update(paymentSessions)
            .set({ 
              status: 'failed',
              completedAt: new Date()
            })
            .where(eq(paymentSessions.id, session.id));
            
          return { status: 'failed', message: 'Payment failed', data: verification.data };
        } else {
          // Payment still pending - revert to pending status
          await tx
            .update(paymentSessions)
            .set({ 
              status: 'pending',
              updatedAt: new Date()
            })
            .where(eq(paymentSessions.id, session.id));
            
          return { status: 'pending', message: 'Payment still pending', data: verification.data };
        }
        
      } catch (verificationError) {
        // Revert status to pending on error
        await tx
          .update(paymentSessions)
          .set({ 
            status: 'pending',
            updatedAt: new Date()
          })
          .where(eq(paymentSessions.id, session.id));
          
        throw verificationError;
      }
    });
    
    return result;
  }

  // Grant signup bonus
  async grantSignupBonus(userId: string, tenantId: string) {
    await db.transaction(async (tx) => {
      // Check if user already has credits record
      const existingCredits = await tx
        .select()
        .from(userCredits)
        .where(and(eq(userCredits.userId, userId), eq(userCredits.tenantId, tenantId)))
        .limit(1);

      if (existingCredits.length > 0) {
        await tx
          .update(userCredits)
          .set({
            balance: sql`balance + ${SIGNUP_BONUS}`,
            updatedAt: new Date()
          })
          .where(and(eq(userCredits.userId, userId), eq(userCredits.tenantId, tenantId)));
      } else {
        await tx.insert(userCredits).values({
          userId,
          tenantId,
          balance: SIGNUP_BONUS.toString()
        });
      }

      await tx.insert(transactions).values({
        userId,
        tenantId,
        type: 'bonus',
        amount: SIGNUP_BONUS.toString(),
        description: 'Signup bonus'
      });
    });
  }

  // Get user credit balance
  async getUserBalance(userId: string, tenantId: string): Promise<number> {
    const [userCredit] = await db
      .select()
      .from(userCredits)
      .where(and(eq(userCredits.userId, userId), eq(userCredits.tenantId, tenantId)));

    return userCredit ? parseFloat(userCredit.balance) : 0;
  }

  // Check if user has sufficient credits
  async hasSufficientCredits(userId: string, tenantId: string, tokensUsed: number): Promise<boolean> {
    const cost = this.calculateMessageCost(tokensUsed);
    const balance = await this.getUserBalance(userId, tenantId);
    return balance >= cost;
  }

  // Get payment session by reference
  async getPaymentSession(reference: string) {
    const [session] = await db
      .select()
      .from(paymentSessions)
      .where(eq(paymentSessions.paystackReference, reference));
    
    return session;
  }
}

// Lazy billing service creation to avoid initialization errors
let billingServiceInstance: BillingService | null = null;

export function getBillingService(): BillingService {
  if (!billingServiceInstance) {
    billingServiceInstance = new BillingService();
  }
  return billingServiceInstance;
}