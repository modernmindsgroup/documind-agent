// Provider-agnostic media endpoints for participant management and tokens
import { Router } from 'express';
import { z } from 'zod';
import { requireTenantAccess, AuthRequest } from './auth.js';
import { storage } from './storage.js';
import { mediaService, MediaService } from './livekit.js';

const router = Router();

// Health check endpoint
router.get('/health', async (req, res) => {
  try {
    const isHealthy = await mediaService.isHealthy();
    const providerName = process.env.ACTIVE_MEDIA_PROVIDER || 'livekit';
    
    res.json({
      status: isHealthy ? 'healthy' : 'unhealthy',
      provider: providerName,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: 'Health check failed',
      timestamp: new Date().toISOString(),
    });
  }
});

// Validation schemas
const updateParticipantSchema = z.object({
  metadata: z.string().optional(),
  permissions: z.object({
    canPublish: z.boolean().optional(),
    canSubscribe: z.boolean().optional(),
    canPublishData: z.boolean().optional(),
  }).optional(),
});

const muteTrackSchema = z.object({
  trackSid: z.string(),
  muted: z.boolean(),
});

const generateTokenSchema = z.object({
  identity: z.string(),
  ttl: z.string().optional().default('10m'),
  metadata: z.string().optional(),
  permissions: z.object({
    canPublish: z.boolean().optional().default(true),
    canSubscribe: z.boolean().optional().default(true),
    canPublishData: z.boolean().optional().default(true),
    canUpdateOwnMetadata: z.boolean().optional().default(true),
  }).optional().default({}),
});

// GET /api/media/rooms/:id/participants - List participants in a room
router.get('/rooms/:id/participants', requireTenantAccess, async (req: AuthRequest, res) => {
  try {
    // Verify room exists and belongs to tenant
    const room = await storage.getRoom(req.params.id, req.user!.tenantId);
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    const roomName = MediaService.generateRoomName(req.user!.tenantId, room.id);
    const participants = await mediaService.listParticipants(roomName);

    // Return provider-agnostic participant data
    const mappedParticipants = participants.map(p => ({
      identity: p.identity,
      name: p.name,
      metadata: p.metadata,
      joinedAt: p.joinedAt,
      permissions: p.permissions,
      tracks: p.tracks?.map(t => ({
        sid: t.sid,
        name: t.name,
        kind: t.kind,
        source: t.source,
        muted: t.muted,
      })) || [],
    }));

    res.json({ participants: mappedParticipants });
  } catch (error) {
    console.error('List participants error:', error);
    res.status(500).json({ error: 'Failed to list participants' });
  }
});

// DELETE /api/media/rooms/:id/participants/:identity - Remove participant from room
router.delete('/rooms/:id/participants/:identity', requireTenantAccess, async (req: AuthRequest, res) => {
  try {
    // Verify room exists and belongs to tenant
    const room = await storage.getRoom(req.params.id, req.user!.tenantId);
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    const roomName = MediaService.generateRoomName(req.user!.tenantId, room.id);
    await mediaService.removeParticipant(roomName, req.params.identity);

    res.status(204).send();
  } catch (error) {
    console.error('Remove participant error:', error);
    res.status(500).json({ error: 'Failed to remove participant' });
  }
});

// PATCH /api/media/rooms/:id/participants/:identity - Update participant
router.patch('/rooms/:id/participants/:identity', requireTenantAccess, async (req: AuthRequest, res) => {
  try {
    // Verify room exists and belongs to tenant
    const room = await storage.getRoom(req.params.id, req.user!.tenantId);
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    const validatedData = updateParticipantSchema.parse(req.body);
    const roomName = MediaService.generateRoomName(req.user!.tenantId, room.id);
    
    const updatedParticipant = await mediaService.updateParticipant(
      roomName, 
      req.params.identity, 
      validatedData
    );

    // Return provider-agnostic participant data
    const mappedParticipant = {
      identity: updatedParticipant.identity,
      name: updatedParticipant.name,
      metadata: updatedParticipant.metadata,
      joinedAt: updatedParticipant.joinedAt,
      permissions: updatedParticipant.permissions,
      tracks: updatedParticipant.tracks?.map(t => ({
        sid: t.sid,
        name: t.name,
        kind: t.kind,
        source: t.source,
        muted: t.muted,
      })) || [],
    };

    res.json(mappedParticipant);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Update participant error:', error);
    res.status(500).json({ error: 'Failed to update participant' });
  }
});

// POST /api/media/rooms/:id/participants/:identity/mute - Mute/unmute participant track
router.post('/rooms/:id/participants/:identity/mute', requireTenantAccess, async (req: AuthRequest, res) => {
  try {
    // Verify room exists and belongs to tenant
    const room = await storage.getRoom(req.params.id, req.user!.tenantId);
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    const validatedData = muteTrackSchema.parse(req.body);
    const roomName = MediaService.generateRoomName(req.user!.tenantId, room.id);
    
    await mediaService.muteParticipantTrack(
      roomName, 
      req.params.identity, 
      validatedData.trackSid,
      validatedData.muted
    );

    res.status(204).send();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Mute track error:', error);
    res.status(500).json({ error: 'Failed to mute/unmute track' });
  }
});

// POST /api/media/rooms/:id/token - Generate access token for room
router.post('/rooms/:id/token', requireTenantAccess, async (req: AuthRequest, res) => {
  try {
    // Verify room exists and belongs to tenant
    const room = await storage.getRoom(req.params.id, req.user!.tenantId);
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    const validatedData = generateTokenSchema.parse(req.body);
    const roomName = MediaService.generateRoomName(req.user!.tenantId, room.id);
    
    const token = await mediaService.generateToken({
      identity: validatedData.identity,
      room: roomName,
      ttl: validatedData.ttl,
      metadata: validatedData.metadata,
      permissions: validatedData.permissions,
    });

    res.json({ token });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Generate token error:', error);
    res.status(500).json({ error: 'Failed to generate token' });
  }
});

export { router as mediaRoutes };