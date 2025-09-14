import { RoomServiceClient, AccessToken, Room as LiveKitRoom, ParticipantInfo } from 'livekit-server-sdk';
import { 
  MediaProvider, 
  Room, 
  Participant, 
  Track, 
  CreateRoomOptions, 
  TokenOptions, 
  UpdateParticipantOptions 
} from './MediaProvider.js';

export class LiveKitProvider extends MediaProvider {
  readonly providerName = 'livekit';
  private roomService: RoomServiceClient;
  private apiKey: string;
  private apiSecret: string;
  private serverUrl: string;

  constructor() {
    super();
    this.serverUrl = process.env.LIVEKIT_URL || 'wss://your-livekit-host';
    this.apiKey = process.env.LIVEKIT_API_KEY || '';
    this.apiSecret = process.env.LIVEKIT_API_SECRET || '';
    
    if (!this.apiKey || !this.apiSecret) {
      console.warn('⚠️  LiveKit credentials not found. Set LIVEKIT_API_KEY and LIVEKIT_API_SECRET environment variables.');
    }

    this.roomService = new RoomServiceClient(this.serverUrl, this.apiKey, this.apiSecret);
  }

  // Room Management
  async createRoom(options: CreateRoomOptions): Promise<Room> {
    try {
      const liveKitRoom = await this.roomService.createRoom({
        name: options.name,
        emptyTimeout: options.emptyTimeout || 10 * 60, // 10 minutes default
        maxParticipants: options.maxParticipants || 50,
        metadata: options.metadata,
      });

      return this.mapLiveKitRoom(liveKitRoom);
    } catch (error) {
      throw new Error(`Failed to create room: ${error}`);
    }
  }

  async listRooms(): Promise<Room[]> {
    try {
      const liveKitRooms = await this.roomService.listRooms();
      return liveKitRooms.map(room => this.mapLiveKitRoom(room));
    } catch (error) {
      throw new Error(`Failed to list rooms: ${error}`);
    }
  }

  async getRoom(roomName: string): Promise<Room | null> {
    try {
      const rooms = await this.roomService.listRooms();
      const liveKitRoom = rooms.find(room => room.name === roomName);
      return liveKitRoom ? this.mapLiveKitRoom(liveKitRoom) : null;
    } catch (error) {
      console.error(`Failed to get room ${roomName}:`, error);
      return null;
    }
  }

  async deleteRoom(roomName: string): Promise<void> {
    try {
      await this.roomService.deleteRoom(roomName);
    } catch (error) {
      throw new Error(`Failed to delete room: ${error}`);
    }
  }

  // Participant Management
  async listParticipants(roomName: string): Promise<Participant[]> {
    try {
      const liveKitParticipants = await this.roomService.listParticipants(roomName);
      return liveKitParticipants.map(participant => this.mapLiveKitParticipant(participant));
    } catch (error) {
      throw new Error(`Failed to list participants: ${error}`);
    }
  }

  async getParticipant(roomName: string, identity: string): Promise<Participant | null> {
    try {
      const liveKitParticipant = await this.roomService.getParticipant(roomName, identity);
      return this.mapLiveKitParticipant(liveKitParticipant);
    } catch (error) {
      console.error(`Failed to get participant ${identity}:`, error);
      return null;
    }
  }

  async removeParticipant(roomName: string, identity: string): Promise<void> {
    try {
      await this.roomService.removeParticipant(roomName, identity);
    } catch (error) {
      throw new Error(`Failed to remove participant: ${error}`);
    }
  }

  async updateParticipant(
    roomName: string, 
    identity: string, 
    options: UpdateParticipantOptions
  ): Promise<Participant> {
    try {
      const liveKitParticipant = await this.roomService.updateParticipant(
        roomName, 
        identity, 
        options.metadata, 
        options.permissions
      );
      return this.mapLiveKitParticipant(liveKitParticipant);
    } catch (error) {
      throw new Error(`Failed to update participant: ${error}`);
    }
  }

  // Track Management
  async muteParticipantTrack(
    roomName: string, 
    identity: string, 
    trackSid: string, 
    muted: boolean
  ): Promise<void> {
    try {
      await this.roomService.mutePublishedTrack(roomName, identity, trackSid, muted);
    } catch (error) {
      throw new Error(`Failed to ${muted ? 'mute' : 'unmute'} track: ${error}`);
    }
  }

  // Token Generation
  async generateToken(options: TokenOptions): Promise<string> {
    try {
      const accessToken = new AccessToken(this.apiKey, this.apiSecret, {
        identity: options.identity,
        ttl: options.ttl || '10m',
      });

      const permissions = options.permissions || {};
      accessToken.addGrant({
        room: options.room,
        roomJoin: true,
        canPublish: permissions.canPublish ?? true,
        canSubscribe: permissions.canSubscribe ?? true,
        canPublishData: permissions.canPublishData ?? true,
        canUpdateOwnMetadata: permissions.canUpdateOwnMetadata ?? true,
      });

      if (options.metadata) {
        accessToken.metadata = options.metadata;
      }

      return await accessToken.toJwt();
    } catch (error) {
      throw new Error(`Failed to generate token: ${error}`);
    }
  }

  // Health Check
  async isHealthy(): Promise<boolean> {
    try {
      // Try to list rooms as a health check
      await this.roomService.listRooms();
      return true;
    } catch (error) {
      console.error('LiveKit health check failed:', error);
      return false;
    }
  }

  // Mapping helpers
  private mapLiveKitRoom(liveKitRoom: LiveKitRoom): Room {
    return {
      sid: liveKitRoom.sid,
      name: liveKitRoom.name,
      numParticipants: liveKitRoom.numParticipants,
      creationTime: new Date(Number(liveKitRoom.creationTime) * 1000), // Convert bigint seconds to milliseconds
      emptyTimeout: liveKitRoom.emptyTimeout,
      maxParticipants: liveKitRoom.maxParticipants,
      metadata: liveKitRoom.metadata,
    };
  }

  private mapLiveKitParticipant(liveKitParticipant: ParticipantInfo): Participant {
    return {
      sid: liveKitParticipant.sid,
      identity: liveKitParticipant.identity,
      name: liveKitParticipant.name,
      metadata: liveKitParticipant.metadata,
      joinedAt: new Date(Number(liveKitParticipant.joinedAt) * 1000), // Convert bigint seconds to milliseconds
      permissions: {
        canPublish: liveKitParticipant.permission?.canPublish,
        canSubscribe: liveKitParticipant.permission?.canSubscribe,
        canPublishData: liveKitParticipant.permission?.canPublishData,
      },
      tracks: liveKitParticipant.tracks?.map((track: any) => ({
        sid: track.sid,
        name: track.name,
        kind: track.type as 'audio' | 'video' | 'data',
        source: track.source as any,
        muted: track.muted,
      })) || [],
    };
  }
}