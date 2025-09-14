import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CreditCard, Plus, History, DollarSign, BarChart3 } from 'lucide-react';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

export default function BillingPage() {
  const [topupAmount, setTopupAmount] = useState('25');
  const { toast } = useToast();

  // Handle payment status from URL parameters (when redirected from Paystack)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get('payment');
    const reason = urlParams.get('reason');
    
    if (paymentStatus) {
      // Clear URL parameters after processing
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
      
      switch (paymentStatus) {
        case 'success':
          toast({
            title: "Payment Successful!",
            description: "Your credits have been added to your account.",
            duration: 5000,
          });
          // Refresh balance and transactions
          queryClient.invalidateQueries({ queryKey: ['/api/billing/balance'] });
          queryClient.invalidateQueries({ queryKey: ['/api/billing/transactions'] });
          break;
          
        case 'failed':
          toast({
            title: "Payment Failed",
            description: "Your payment could not be processed. Please try again.",
            variant: "destructive",
            duration: 7000,
          });
          break;
          
        case 'pending':
          toast({
            title: "Payment Pending",
            description: "Your payment is being processed. Please wait a few moments.",
            duration: 5000,
          });
          break;
          
        case 'error':
        default:
          let errorMessage = 'An error occurred during payment processing.';
          if (reason === 'invalid_reference') {
            errorMessage = 'Invalid payment reference provided.';
          } else if (reason === 'session_not_found') {
            errorMessage = 'Payment session not found.';
          } else if (reason === 'service_unavailable') {
            errorMessage = 'Payment service is temporarily unavailable. Please contact support.';
          } else if (reason === 'verification_failed') {
            errorMessage = 'Payment verification failed. Please try again.';
          }
          toast({
            title: "Payment Error",
            description: errorMessage + " Please contact support if this continues.",
            variant: "destructive",
            duration: 8000,
          });
          break;
      }
    }
  }, [toast, queryClient]);

  // Fetch credit balance
  const { data: balance, isLoading: balanceLoading } = useQuery({
    queryKey: ['/api/billing/balance'],
  });

  // Fetch transaction history
  const { data: transactions } = useQuery({
    queryKey: ['/api/billing/transactions'],
  });

  // Top-up mutation
  const topupMutation = useMutation({
    mutationFn: async (amount: number) => {
      const response = await apiRequest('POST', '/api/billing/topup', { amount });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || errorData.error || 'Payment initialization failed');
      }
      return await response.json();
    },
    onSuccess: (data) => {
      console.log('Payment initialized:', data);
      // Redirect to Paystack payment page
      window.location.href = data.authorization_url;
    },
    onError: (error) => {
      console.error('Payment initialization error:', error);
      toast({
        title: "Payment Error",
        description: error instanceof Error ? error.message : "Failed to initialize payment. Please try again.",
        variant: "destructive",
        duration: 6000,
      });
    },
  });

  const handleTopup = () => {
    const amount = parseFloat(topupAmount);
    if (amount >= 1) {
      topupMutation.mutate(amount);
    } else {
      toast({
        title: "Invalid Amount",
        description: "Minimum top-up amount is $1.",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'topup':
      case 'bonus':
        return 'text-green-600';
      case 'deduction':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getTransactionSign = (type: string) => {
    return type === 'deduction' ? '-' : '+';
  };

  const getBadgeVariant = (type: string) => {
    switch (type) {
      case 'topup':
        return 'default';
      case 'bonus':
        return 'secondary';
      case 'deduction':
        return 'outline';
      default:
        return 'outline';
    }
  };

  return (
    <div className="space-y-6 p-6" data-testid="billing-page">
      <div>
        <h1 className="text-3xl font-bold" data-testid="text-page-title">Billing & Credits</h1>
        <p className="text-muted-foreground">
          Manage your credits and payment history
        </p>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview" data-testid="tab-overview">
            <BarChart3 className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="transactions" data-testid="tab-transactions">
            <History className="h-4 w-4 mr-2" />
            Transaction History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">
          {/* Credit Balance */}
          <Card data-testid="card-credit-balance">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Credit Balance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold" data-testid="text-credit-balance">
                {balanceLoading ? '...' : `$${balance?.balance?.toFixed(3) || '0.000'}`}
              </div>
              <p className="text-sm text-muted-foreground">
                1 Credit = $1 USD • Typical message ≈ $0.007
              </p>
              
              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="p-3 bg-muted rounded-lg">
                  <div className="font-semibold text-blue-600">Platform Fee</div>
                  <div>$0.002 per message</div>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <div className="font-semibold text-green-600">Short Messages</div>
                  <div>$0.005 (≤500 tokens)</div>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <div className="font-semibold text-orange-600">Long Messages</div>
                  <div>$0.010 (≤1500 tokens)</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Top-up Credits */}
          <Card data-testid="card-topup">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Top-up Credits
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Amount (USD)"
                  value={topupAmount}
                  onChange={(e) => setTopupAmount(e.target.value)}
                  min="1"
                  step="1"
                  className="w-32"
                  data-testid="input-topup-amount"
                />
                <Button 
                  onClick={handleTopup}
                  disabled={topupMutation.isPending}
                  data-testid="button-pay-paystack"
                >
                  {topupMutation.isPending ? 'Processing...' : 'Pay with Paystack'}
                </Button>
              </div>
              <div className="flex gap-2">
                {[10, 25, 50, 100].map((amount) => (
                  <Button
                    key={amount}
                    variant="outline"
                    size="sm"
                    onClick={() => setTopupAmount(amount.toString())}
                    data-testid={`button-preset-${amount}`}
                  >
                    ${amount}
                  </Button>
                ))}
              </div>
              <div className="text-sm text-muted-foreground">
                <p>🔐 Secure payments powered by Paystack</p>
                <p>💳 Supports all major credit/debit cards</p>
              </div>
            </CardContent>
          </Card>

          {/* Pricing Information */}
          <Card data-testid="card-pricing-info">
            <CardHeader>
              <CardTitle>Pricing Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Chat Conversations</h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Platform fee: $0.002 per message</li>
                    <li>• Short message (≤500 tokens): $0.005</li>
                    <li>• Long message (≤1500 tokens): $0.010</li>
                    <li>• Additional features: $0.002 each</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Examples</h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Typical short message: ~$0.007</li>
                    <li>• Typical long message: ~$0.012</li>
                    <li>• 100 messages: ~$0.70-$1.20</li>
                    <li>• $10 credit: ~800-1400 messages</li>
                  </ul>
                </div>
              </div>
              
              <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <p className="text-sm">
                  <strong>💡 Tip:</strong> You'll receive a $10 signup bonus to get started! 
                  Credits never expire and can be used for all platform features.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-6 mt-6">
          {/* Transaction History */}
          <Card data-testid="card-transaction-history">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Transaction History Report
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {!transactions || !transactions.transactions || transactions.transactions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No transactions yet</p>
                    <p className="text-sm">Your transaction history will appear here</p>
                  </div>
                ) : (
                  transactions.transactions.map((tx: any) => (
                    <div 
                      key={tx.id} 
                      className="flex items-center justify-between py-3 border-b last:border-b-0"
                      data-testid={`transaction-${tx.id}`}
                    >
                      <div className="flex-1">
                        <p className="font-medium" data-testid={`text-description-${tx.id}`}>
                          {tx.description}
                        </p>
                        <p className="text-sm text-muted-foreground" data-testid={`text-date-${tx.id}`}>
                          {formatDate(tx.createdAt)}
                        </p>
                        {tx.reference && (
                          <p className="text-xs text-muted-foreground">
                            Ref: {tx.reference}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <div 
                          className={`font-bold ${getTransactionColor(tx.type)}`}
                          data-testid={`text-amount-${tx.id}`}
                        >
                          {getTransactionSign(tx.type)}${parseFloat(tx.amount).toFixed(3)}
                        </div>
                        <Badge 
                          variant={getBadgeVariant(tx.type) as any}
                          data-testid={`badge-type-${tx.id}`}
                        >
                          {tx.type}
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
              
              {transactions && transactions.total > transactions.transactions?.length && (
                <div className="mt-4 text-center">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      // TODO: Implement pagination
                      toast({
                        title: "Coming Soon",
                        description: "Pagination will be available in a future update.",
                      });
                    }}
                    data-testid="button-load-more-transactions"
                  >
                    Load More Transactions ({transactions.transactions?.length || 0} of {transactions.total})
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}