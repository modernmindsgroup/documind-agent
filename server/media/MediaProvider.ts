// Abstract interface for media providers (LiveKit, Agora, etc.)
export interface Room {
  sid: string;
  name: string;
  numParticipants: number;
  creationTime: Date;
  emptyTimeout: number;
  maxParticipants: number;
  metadata?: string;
}

export interface Participant {
  sid: string;
  identity: string;
  name?: string;
  metadata?: string;
  joinedAt: Date;
  permissions?: {
    canPublish?: boolean;
    canSubscribe?: boolean;
    canPublishData?: boolean;
  };
  tracks?: Track[];
}

export interface Track {
  sid: string;
  name?: string;
  kind: 'audio' | 'video' | 'data';
  source: 'camera' | 'microphone' | 'screen_share' | 'screen_share_audio' | 'unknown';
  muted: boolean;
}

export interface CreateRoomOptions {
  name: string;
  emptyTimeout?: number;
  maxParticipants?: number;
  metadata?: string;
}

export interface TokenOptions {
  identity: string;
  room: string;
  ttl?: string;
  metadata?: string;
  permissions?: {
    canPublish?: boolean;
    canSubscribe?: boolean;
    canPublishData?: boolean;
    canUpdateOwnMetadata?: boolean;
  };
}

export interface UpdateParticipantOptions {
  metadata?: string;
  permissions?: {
    canPublish?: boolean;
    canSubscribe?: boolean;
    canPublishData?: boolean;
  };
}

export abstract class MediaProvider {
  abstract readonly providerName: string;

  // Room Management
  abstract createRoom(options: CreateRoomOptions): Promise<Room>;
  abstract listRooms(): Promise<Room[]>;
  abstract getRoom(roomName: string): Promise<Room | null>;
  abstract deleteRoom(roomName: string): Promise<void>;

  // Participant Management
  abstract listParticipants(roomName: string): Promise<Participant[]>;
  abstract getParticipant(roomName: string, identity: string): Promise<Participant | null>;
  abstract removeParticipant(roomName: string, identity: string): Promise<void>;
  abstract updateParticipant(
    roomName: string, 
    identity: string, 
    options: UpdateParticipantOptions
  ): Promise<Participant>;

  // Track Management
  abstract muteParticipantTrack(
    roomName: string, 
    identity: string, 
    trackSid: string, 
    muted: boolean
  ): Promise<void>;

  // Token Generation
  abstract generateToken(options: TokenOptions): Promise<string>;

  // Utility methods
  abstract isHealthy(): Promise<boolean>;
}