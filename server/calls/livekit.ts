import { AccessToken, RoomServiceClient, Room as LiveKitRoom } from 'livekit-server-sdk';
import type { 
  ICallPlatform, 
  CallConnectionInfo, 
  PlatformEvent, 
  PlatformEventHandler 
} from './platform';
import type { Agent, Call, Room } from '@shared/schema';
import { storage } from '../storage';

/**
 * LiveKit platform adapter for voice calls.
 * Provides real-time voice communication using LiveKit's infrastructure
 * with automatic agent spawning and advanced voice features.
 */
export class LiveKitCallPlatform implements ICallPlatform {
  public readonly name = 'LiveKit Platform';
  public readonly type = 'livekit' as const;
  
  private eventHandlers: PlatformEventHandler[] = [];
  private activeCalls = new Map<string, { call: Call; room: Room; agent: Agent; livekitRoom: string }>();
  private roomService: RoomServiceClient | null = null;
  private config: {
    url: string;
    apiKey: string;
    apiSecret: string;
  };

  constructor() {
    console.log(`🔧 Initializing ${this.name}`);
    
    // Validate required environment variables
    this.config = {
      url: process.env.LIVEKIT_URL || '',
      apiKey: process.env.LIVEKIT_API_KEY || '',
      apiSecret: process.env.LIVEKIT_API_SECRET || '',
    };

    if (!this.config.url || !this.config.apiKey || !this.config.apiSecret) {
      console.warn('⚠️ LiveKit configuration incomplete. Ensure LIVEKIT_URL, LIVEKIT_API_KEY, and LIVEKIT_API_SECRET are set.');
    }
  }

  /**
   * Start a new call using LiveKit infrastructure
   */
  async startCall(call: Call, room: Room, agent: Agent): Promise<CallConnectionInfo> {
    try {
      console.log(`🚀 Starting call ${call.id} on ${this.name} for room ${room.id}`);

      // Validate configuration
      this.validateConfig();

      // Create LiveKit room name (ensure uniqueness and compliance)
      const livekitRoomName = this.generateLiveKitRoomName(room.id, call.id);

      // Create or get LiveKit room
      await this.createLiveKitRoom(livekitRoomName);

      // Generate LiveKit access token for the user
      const accessToken = this.generateAccessToken(livekitRoomName, call.id, {
        identity: `user_${call.contactId || 'anonymous'}`,
        name: 'User',
        metadata: JSON.stringify({
          callId: call.id,
          roomId: room.id,
          agentId: agent.id,
          tenantId: call.tenantId,
        }),
      });

      // Store call information for tracking
      this.activeCalls.set(call.id, { 
        call, 
        room, 
        agent, 
        livekitRoom: livekitRoomName 
      });

      // Schedule agent spawning (after a brief delay to allow user to connect)
      setTimeout(() => {
        this.spawnAgent(call.id, livekitRoomName, agent);
      }, 2000);

      // Emit platform event
      await this.emitEvent({
        type: 'call_started',
        callId: call.id,
        roomId: room.id,
        data: { 
          agent: agent.id, 
          tenant: call.tenantId,
          livekitRoom: livekitRoomName,
        },
        timestamp: new Date(),
      });

      return {
        roomId: room.id,
        connectionToken: accessToken,
        livekitUrl: this.config.url,
        livekitToken: accessToken,
        additionalData: {
          callId: call.id,
          agentId: agent.id,
          tenantId: call.tenantId,
          platform: 'livekit',
          livekitRoom: livekitRoomName,
        },
      };
    } catch (error) {
      console.error(`❌ Failed to start call ${call.id} on LiveKit:`, error);
      
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

      const callInfo = this.activeCalls.get(callId);
      if (!callInfo) {
        console.warn(`⚠️ Call ${callId} not found in active calls`);
        return;
      }

      // End the LiveKit room
      if (this.roomService) {
        try {
          await this.roomService.deleteRoom(callInfo.livekitRoom);
          console.log(`🗑️ LiveKit room ${callInfo.livekitRoom} deleted`);
        } catch (error) {
          console.warn(`⚠️ Failed to delete LiveKit room ${callInfo.livekitRoom}:`, error);
        }
      }

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
        data: { 
          reason: 'manual_end',
          livekitRoom: callInfo.livekitRoom,
        },
        timestamp: new Date(),
      });

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
      
      // Generate fresh access token
      const accessToken = this.generateAccessToken(callInfo.livekitRoom, call.id, {
        identity: `user_${call.contactId || 'anonymous'}`,
        name: 'User',
        metadata: JSON.stringify({
          callId: call.id,
          roomId: room.id,
          agentId: agent.id,
          tenantId: call.tenantId,
        }),
      });

      return {
        roomId: room.id,
        connectionToken: accessToken,
        livekitUrl: this.config.url,
        livekitToken: accessToken,
        additionalData: {
          callId: call.id,
          agentId: agent.id,
          tenantId: call.tenantId,
          platform: 'livekit',
          livekitRoom: callInfo.livekitRoom,
        },
      };
    } catch (error) {
      console.error(`❌ Failed to get connection info for call ${callId}:`, error);
      return null;
    }
  }

  /**
   * Attach an agent to a call
   */
  async attachAgent(callId: string, roomId: string, agent: Agent): Promise<void> {
    try {
      console.log(`🤖 Attaching agent ${agent.id} to call ${callId} on ${this.name}`);

      const callInfo = this.activeCalls.get(callId);
      if (!callInfo) {
        throw new Error(`Call ${callId} not found`);
      }

      // Spawn the agent in the LiveKit room
      await this.spawnAgent(callId, callInfo.livekitRoom, agent);

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

      const callInfo = this.activeCalls.get(callId);
      if (!callInfo) {
        console.warn(`⚠️ Call ${callId} not found for agent detachment`);
        return;
      }

      // Remove agent participant from LiveKit room
      if (this.roomService) {
        const agentIdentity = `agent_${agentId}`;
        try {
          await this.roomService.removeParticipant(callInfo.livekitRoom, agentIdentity);
          console.log(`🗑️ Agent ${agentId} removed from LiveKit room ${callInfo.livekitRoom}`);
        } catch (error) {
          console.warn(`⚠️ Failed to remove agent from LiveKit room:`, error);
        }
      }

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
   * Initialize the LiveKit platform
   */
  async initialize(): Promise<void> {
    console.log(`🚀 Initializing ${this.name}`);
    
    try {
      this.validateConfig();
      
      // Initialize room service client
      this.roomService = new RoomServiceClient(
        this.config.url,
        this.config.apiKey,
        this.config.apiSecret
      );

      // Test connection by listing rooms
      await this.roomService.listRooms();
      
      console.log(`✅ ${this.name} initialized successfully`);
    } catch (error) {
      console.error(`❌ Failed to initialize ${this.name}:`, error);
      throw error;
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
    this.roomService = null;
    
    console.log(`✅ ${this.name} shutdown complete`);
  }

  /**
   * Check platform health
   */
  async isHealthy(): Promise<boolean> {
    try {
      this.validateConfig();
      
      if (!this.roomService) {
        return false;
      }

      // Test connection by listing rooms
      await this.roomService.listRooms();
      return true;
    } catch (error) {
      console.error(`❌ Health check failed for ${this.name}:`, error);
      return false;
    }
  }

  /**
   * Validate configuration
   */
  private validateConfig(): void {
    if (!this.config.url || !this.config.apiKey || !this.config.apiSecret) {
      throw new Error('LiveKit configuration incomplete. Ensure LIVEKIT_URL, LIVEKIT_API_KEY, and LIVEKIT_API_SECRET are set.');
    }
  }

  /**
   * Generate LiveKit room name
   */
  private generateLiveKitRoomName(roomId: string, callId: string): string {
    // Ensure room name is compliant with LiveKit naming requirements
    const sanitized = `room_${roomId}_call_${callId}`.replace(/[^a-zA-Z0-9_-]/g, '_');
    return sanitized;
  }

  /**
   * Create or ensure LiveKit room exists
   */
  private async createLiveKitRoom(roomName: string): Promise<void> {
    if (!this.roomService) {
      throw new Error('Room service not initialized');
    }

    try {
      // Check if room exists
      const rooms = await this.roomService.listRooms([roomName]);
      
      if (rooms.length === 0) {
        // Create room if it doesn't exist
        await this.roomService.createRoom({
          name: roomName,
          emptyTimeout: 300, // 5 minutes
          maxParticipants: 10,
        });
        console.log(`✅ Created LiveKit room: ${roomName}`);
      } else {
        console.log(`♻️ Using existing LiveKit room: ${roomName}`);
      }
    } catch (error) {
      console.error(`❌ Failed to create/verify LiveKit room ${roomName}:`, error);
      throw error;
    }
  }

  /**
   * Generate LiveKit access token
   */
  private generateAccessToken(roomName: string, callId: string, participant: {
    identity: string;
    name: string;
    metadata?: string;
  }): string {
    const token = new AccessToken(
      this.config.apiKey,
      this.config.apiSecret,
      {
        identity: participant.identity,
        name: participant.name,
        metadata: participant.metadata,
      }
    );

    // Grant permissions for voice communication
    token.addGrant({
      room: roomName,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    });

    return token.toJwt();
  }

  /**
   * Spawn an agent in the LiveKit room
   */
  private async spawnAgent(callId: string, livekitRoomName: string, agent: Agent): Promise<void> {
    try {
      console.log(`🤖 Spawning agent ${agent.id} in LiveKit room ${livekitRoomName}`);

      // Generate agent access token
      const agentToken = this.generateAccessToken(livekitRoomName, callId, {
        identity: `agent_${agent.id}`,
        name: agent.name || 'AI Agent',
        metadata: JSON.stringify({
          type: 'agent',
          agentId: agent.id,
          callId,
        }),
      });

      // The actual agent spawning will be handled by the LiveKit agent worker
      // For now, we'll just log that the token is ready
      console.log(`🎫 Agent token generated for ${agent.id} in room ${livekitRoomName}`);
      
      // TODO: Trigger the LiveKit agent worker to join the room
      // This will be implemented in the agentWorker.ts file
      
    } catch (error) {
      console.error(`❌ Failed to spawn agent ${agent.id}:`, error);
      throw error;
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