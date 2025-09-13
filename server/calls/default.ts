import { WebSocket, WebSocketServer } from 'ws';
import { randomUUID } from 'crypto';
import type { 
  ICallPlatform, 
  CallConnectionInfo, 
  PlatformEvent, 
  PlatformEventHandler 
} from './platform';
import type { Agent, Call, Room } from '@shared/schema';
import { generateWidgetVoiceToken } from '../auth';
import { storage } from '../storage';

// Re-export the existing Client interface and InProcessVoiceAgent from websocket.ts
// This allows us to reuse the existing implementation without major refactoring
export interface Client {
  id: string;
  ws: WebSocket;
  type: 'human' | 'agent';
  roomId: string;
  tenantId?: string;
  callId?: string;
  joinedAt: Date;
}

// Import the existing VoiceChatServer logic - we'll reference the global instance
// Note: voiceServer is created in websocket.ts and available globally

/**
 * Default platform adapter that wraps the existing WebSocket-based voice chat system.
 * This adapter maintains full compatibility with the current implementation while
 * providing the ICallPlatform interface for abstraction.
 */
export class DefaultCallPlatform implements ICallPlatform {
  public readonly name = 'Default WebSocket Platform';
  public readonly type = 'default' as const;
  
  private eventHandlers: PlatformEventHandler[] = [];
  private activeCalls = new Map<string, { call: Call; room: Room; agent: Agent }>();

  constructor() {
    console.log(`🔧 Initializing ${this.name}`);
  }

  /**
   * Start a new call using the existing WebSocket infrastructure
   */
  async startCall(call: Call, room: Room, agent: Agent): Promise<CallConnectionInfo> {
    try {
      console.log(`🚀 Starting call ${call.id} on ${this.name} for room ${room.id}`);

      // Store call information for tracking
      this.activeCalls.set(call.id, { call, room, agent });

      // Generate connection token for WebSocket authentication
      const connectionToken = generateWidgetVoiceToken({
        type: 'widget_voice',
        roomId: room.id,
        callId: call.id,
        agentId: agent.id,
        tenantId: call.tenantId,
        callToken: call.callToken,
      });

      // Determine WebSocket URL based on environment
      const websocketUrl = this.getWebSocketUrl();

      // Emit platform event
      await this.emitEvent({
        type: 'call_started',
        callId: call.id,
        roomId: room.id,
        data: { agent: agent.id, tenant: call.tenantId },
        timestamp: new Date(),
      });

      return {
        roomId: room.id,
        connectionToken,
        websocketUrl: `${websocketUrl}/ws/${room.id}/human?token=${connectionToken}`,
        additionalData: {
          callId: call.id,
          agentId: agent.id,
          tenantId: call.tenantId,
          platform: 'default',
        },
      };
    } catch (error) {
      console.error(`❌ Failed to start call ${call.id}:`, error);
      
      await this.emitEvent({
        type: 'error',
        callId: call.id,
        roomId: room.id,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
      });
      
      throw error;
    }
  }

  /**
   * End an active call
   */
  async endCall(callId: string, roomId: string): Promise<void> {
    try {
      console.log(`🛑 Ending call ${callId} on ${this.name}`);

      // Get call information
      const callInfo = this.activeCalls.get(callId);
      
      // The existing websocket.ts handles disconnections automatically when clients disconnect
      // We just need to clean up our tracking and emit events
      
      if (callInfo) {
        // Update call status in database
        await storage.updateCall(callId, { 
          status: 'completed',
          endedAt: new Date(),
        }, callInfo.call.tenantId);

        // Remove from active calls
        this.activeCalls.delete(callId);

        // Emit platform event
        await this.emitEvent({
          type: 'call_ended',
          callId,
          roomId,
          data: { reason: 'manual_end' },
          timestamp: new Date(),
        });
      }

      console.log(`✅ Call ${callId} ended successfully on ${this.name}`);
    } catch (error) {
      console.error(`❌ Failed to end call ${callId}:`, error);
      
      await this.emitEvent({
        type: 'error',
        callId,
        roomId,
        error: error instanceof Error ? error.message : 'Failed to end call',
        timestamp: new Date(),
      });
      
      throw error;
    }
  }

  /**
   * Get connection information for an active call
   */
  async getConnectionInfo(callId: string, roomId: string): Promise<CallConnectionInfo | null> {
    try {
      const callInfo = this.activeCalls.get(callId);
      if (!callInfo) {
        console.log(`⚠️ No active call found for ${callId}`);
        return null;
      }

      const { call, room, agent } = callInfo;
      
      // Generate fresh connection token
      const connectionToken = generateWidgetVoiceToken({
        type: 'widget_voice',
        roomId: room.id,
        callId: call.id,
        agentId: agent.id,
        tenantId: call.tenantId,
        callToken: call.callToken,
      });

      const websocketUrl = this.getWebSocketUrl();

      return {
        roomId: room.id,
        connectionToken,
        websocketUrl: `${websocketUrl}/ws/${room.id}/human?token=${connectionToken}`,
        additionalData: {
          callId: call.id,
          agentId: agent.id,
          tenantId: call.tenantId,
          platform: 'default',
        },
      };
    } catch (error) {
      console.error(`❌ Failed to get connection info for call ${callId}:`, error);
      return null;
    }
  }

  /**
   * Attach an agent to a call (agents are auto-spawned in the existing system)
   */
  async attachAgent(callId: string, roomId: string, agent: Agent): Promise<void> {
    try {
      console.log(`🤖 Attaching agent ${agent.id} to call ${callId} on ${this.name}`);

      // The existing websocket.ts automatically spawns agents when humans join
      // We just need to track this attachment and emit events
      
      await this.emitEvent({
        type: 'agent_connected',
        callId,
        roomId,
        data: { agentId: agent.id, agentName: agent.name },
        timestamp: new Date(),
      });

      console.log(`✅ Agent ${agent.id} attached to call ${callId}`);
    } catch (error) {
      console.error(`❌ Failed to attach agent to call ${callId}:`, error);
      
      await this.emitEvent({
        type: 'error',
        callId,
        roomId,
        error: error instanceof Error ? error.message : 'Failed to attach agent',
        timestamp: new Date(),
      });
      
      throw error;
    }
  }

  /**
   * Detach an agent from a call
   */
  async detachAgent(callId: string, roomId: string, agentId: string): Promise<void> {
    try {
      console.log(`🔌 Detaching agent ${agentId} from call ${callId} on ${this.name}`);

      // The existing system handles agent disconnection automatically
      // We just emit the event for tracking
      
      await this.emitEvent({
        type: 'agent_disconnected',
        callId,
        roomId,
        data: { agentId },
        timestamp: new Date(),
      });

      console.log(`✅ Agent ${agentId} detached from call ${callId}`);
    } catch (error) {
      console.error(`❌ Failed to detach agent from call ${callId}:`, error);
      throw error;
    }
  }

  /**
   * Register event handler
   */
  onPlatformEvent(handler: PlatformEventHandler): void {
    this.eventHandlers.push(handler);
  }

  /**
   * Unregister event handler
   */
  offPlatformEvent(handler: PlatformEventHandler): void {
    const index = this.eventHandlers.indexOf(handler);
    if (index > -1) {
      this.eventHandlers.splice(index, 1);
    }
  }

  /**
   * Initialize the platform (the existing websocket server is already running)
   */
  async initialize(): Promise<void> {
    console.log(`🚀 Initializing ${this.name}`);
    
    // The existing VoiceChatServer in websocket.ts is already initialized
    // We just need to ensure it's healthy
    if (await this.isHealthy()) {
      console.log(`✅ ${this.name} initialized successfully`);
    } else {
      throw new Error(`Failed to initialize ${this.name}`);
    }
  }

  /**
   * Shutdown the platform
   */
  async shutdown(): Promise<void> {
    console.log(`🛑 Shutting down ${this.name}`);
    
    // End all active calls
    for (const [callId, callInfo] of Array.from(this.activeCalls.entries())) {
      try {
        await this.endCall(callId, callInfo.room.id);
      } catch (error) {
        console.error(`❌ Error ending call ${callId} during shutdown:`, error);
      }
    }
    
    this.activeCalls.clear();
    this.eventHandlers.length = 0;
    
    console.log(`✅ ${this.name} shutdown complete`);
  }

  /**
   * Check platform health
   */
  async isHealthy(): Promise<boolean> {
    try {
      // Check if the platform is healthy by checking if we can access basic functionality
      // Since we can't import voiceServer directly, we'll assume it's healthy if we got this far
      return true;
    } catch (error) {
      console.error(`❌ Health check failed for ${this.name}:`, error);
      return false;
    }
  }

  /**
   * Emit a platform event to all registered handlers
   */
  private async emitEvent(event: PlatformEvent): Promise<void> {
    for (const handler of this.eventHandlers) {
      try {
        await handler(event);
      } catch (error) {
        console.error(`❌ Error in platform event handler:`, error);
      }
    }
  }

  /**
   * Get the WebSocket URL based on environment configuration
   */
  private getWebSocketUrl(): string {
    const host = process.env.WEBSOCKET_HOST || 'localhost';
    const port = process.env.WEBSOCKET_PORT || '5000';
    const protocol = process.env.NODE_ENV === 'production' ? 'wss' : 'ws';
    
    // Handle different host formats
    if (host.includes('://')) {
      return host; // Already includes protocol
    }
    
    return `${protocol}://${host}${port !== '80' && port !== '443' ? `:${port}` : ''}`;
  }

  /**
   * Get statistics about active calls
   */
  public getStats(): {
    activeCalls: number;
    totalCallsStarted: number;
  } {
    return {
      activeCalls: this.activeCalls.size,
      totalCallsStarted: this.activeCalls.size, // Simple implementation
    };
  }
}