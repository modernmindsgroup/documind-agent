import { MediaProviderFactory } from './media/MediaProviderFactory.js';
import { Room, Participant, CreateRoomOptions, TokenOptions, UpdateParticipantOptions } from './media/MediaProvider.js';

export class MediaService {
  private getProvider() {
    return MediaProviderFactory.getProvider();
  }

  // Room Management
  async createRoom(options: CreateRoomOptions): Promise<Room> {
    return await this.getProvider().createRoom(options);
  }

  async listRooms(): Promise<Room[]> {
    return await this.getProvider().listRooms();
  }

  async getRoom(roomName: string): Promise<Room | null> {
    return await this.getProvider().getRoom(roomName);
  }

  async deleteRoom(roomName: string): Promise<void> {
    await this.getProvider().deleteRoom(roomName);
  }

  // Participant Management
  async listParticipants(roomName: string): Promise<Participant[]> {
    return await this.getProvider().listParticipants(roomName);
  }

  async getParticipant(roomName: string, identity: string): Promise<Participant | null> {
    return await this.getProvider().getParticipant(roomName, identity);
  }

  async removeParticipant(roomName: string, identity: string): Promise<void> {
    await this.getProvider().removeParticipant(roomName, identity);
  }

  async updateParticipant(roomName: string, identity: string, options: UpdateParticipantOptions): Promise<Participant> {
    return await this.getProvider().updateParticipant(roomName, identity, options);
  }

  // Track Management
  async muteParticipantTrack(roomName: string, identity: string, trackSid: string, muted: boolean): Promise<void> {
    await this.getProvider().muteParticipantTrack(roomName, identity, trackSid, muted);
  }

  // Token Generation
  async generateToken(options: TokenOptions): Promise<string> {
    return await this.getProvider().generateToken(options);
  }

  // Utility
  async isHealthy(): Promise<boolean> {
    try {
      return await this.getProvider().isHealthy();
    } catch {
      return false;
    }
  }

  /**
   * Generate unique room name for tenant isolation
   */
  static generateRoomName(tenantId: string, roomId: string): string {
    return `room_${tenantId}_${roomId}`;
  }
}

export const mediaService = new MediaService();