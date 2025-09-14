import { RoomServiceClient, Room } from 'livekit-server-sdk';

// Get LiveKit credentials from environment variables
const LIVEKIT_HOST = process.env.LIVEKIT_HOST || 'wss://your-livekit-server.com';
const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY || 'default-api-key';
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET || 'default-secret';

// Initialize RoomServiceClient
export const roomService = new RoomServiceClient(LIVEKIT_HOST, LIVEKIT_API_KEY, LIVEKIT_API_SECRET);

export interface LiveKitRoomOptions {
  name: string;
  emptyTimeout?: number;
  maxParticipants?: number;
  metadata?: string;
}

export class LiveKitService {
  /**
   * Create a new LiveKit room
   */
  async createRoom(options: LiveKitRoomOptions): Promise<Room> {
    const roomOptions = {
      name: options.name,
      emptyTimeout: options.emptyTimeout || 10 * 60, // 10 minutes default
      maxParticipants: options.maxParticipants || 20,
      metadata: options.metadata,
    };

    return await roomService.createRoom(roomOptions);
  }

  /**
   * List all rooms
   */
  async listRooms(): Promise<Room[]> {
    return await roomService.listRooms();
  }

  /**
   * Delete a room (disconnects all participants)
   */
  async deleteRoom(roomName: string): Promise<void> {
    await roomService.deleteRoom(roomName);
  }

  /**
   * Get room info
   */
  async getRoom(roomName: string): Promise<Room | undefined> {
    try {
      const rooms = await roomService.listRooms();
      return rooms.find(room => room.name === roomName);
    } catch (error) {
      console.error('Error getting room:', error);
      return undefined;
    }
  }

  /**
   * Generate unique room name for tenant isolation
   */
  static generateRoomName(tenantId: string, roomId: string): string {
    return `room_${tenantId}_${roomId}`;
  }
}

export const liveKitService = new LiveKitService();