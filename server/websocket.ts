import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { randomUUID } from 'crypto';
import { storage } from './storage';
import { verifyToken, verifyWidgetVoiceToken } from './auth';

interface Client {
  id: string;
  ws: WebSocket;
  type: 'human' | 'agent';
  roomId: string;
  tenantId?: string;
  callId?: string;
  joinedAt: Date;
}

export class VoiceChatServer {
  private rooms = new Map<string, Set<Client>>();
  private clients = new Map<WebSocket, Client>();

  registerClient(ws: WebSocket, roomId: string, clientType: 'human' | 'agent' = 'human', callId?: string, tenantId?: string): Client {
    const clientId = randomUUID();
    const client: Client = {
      id: clientId,
      ws: ws,
      type: clientType,
      roomId: roomId,
      tenantId: tenantId,
      callId: callId,
      joinedAt: new Date()
    };

    // Add to room
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, new Set());
    }
    this.rooms.get(roomId)!.add(client);
    this.clients.set(ws, client);

    console.log(`${clientType} client ${clientId} joined room ${roomId}${callId ? ` for call ${callId}` : ''}`);

    // Notify other clients
    this.broadcastToRoom(roomId, {
      type: `${clientType}_joined`,
      clientId: clientId,
      timestamp: new Date().toISOString()
    }, client);

    return client;
  }

  unregisterClient(ws: WebSocket): void {
    const client = this.clients.get(ws);
    if (!client) return;

    const { roomId, type, id } = client;
    
    // Remove from room
    if (this.rooms.has(roomId)) {
      this.rooms.get(roomId)!.delete(client);
      
      // Clean up empty rooms
      if (this.rooms.get(roomId)!.size === 0) {
        this.rooms.delete(roomId);
      } else {
        // Notify other clients
        this.broadcastToRoom(roomId, {
          type: `${type}_left`,
          clientId: id,
          timestamp: new Date().toISOString()
        });
      }
    }

    this.clients.delete(ws);
    console.log(`${type} client ${id} left room ${roomId}`);
  }

  broadcastToRoom(roomId: string, message: any, excludeClient?: Client): void {
    const room = this.rooms.get(roomId);
    if (!room) return;

    const messageStr = JSON.stringify(message);
    
    room.forEach(client => {
      if (client !== excludeClient && client.ws.readyState === WebSocket.OPEN) {
        try {
          client.ws.send(messageStr);
        } catch (error) {
          console.error('Error sending message to client:', error);
        }
      }
    });
  }

  sendToAgentsInRoom(roomId: string, message: any): void {
    const room = this.rooms.get(roomId);
    if (!room) return;

    const messageStr = JSON.stringify(message);
    
    room.forEach(client => {
      if (client.type === 'agent' && client.ws.readyState === WebSocket.OPEN) {
        try {
          client.ws.send(messageStr);
        } catch (error) {
          console.error('Error sending message to agent:', error);
        }
      }
    });
  }

  sendToHumansInRoom(roomId: string, message: any): void {
    const room = this.rooms.get(roomId);
    if (!room) return;

    const messageStr = JSON.stringify(message);
    
    room.forEach(client => {
      if (client.type === 'human' && client.ws.readyState === WebSocket.OPEN) {
        try {
          client.ws.send(messageStr);
        } catch (error) {
          console.error('Error sending message to human:', error);
        }
      }
    });
  }

  async handleMessage(ws: WebSocket, data: any): Promise<void> {
    const client = this.clients.get(ws);
    if (!client) return;

    const { roomId, type, callId } = client;
    
    console.log(`Received ${data.type} from ${type} in room ${roomId}`);

    switch (data.type) {
      case 'audio':
      case 'audio_message':
        // Audio from human -> forward to agents
        if (type === 'human') {
          const audioData = data.audio || data.audioData || data.data;
          if (!audioData) {
            console.error('No audio data found in message:', data);
            return;
          }
          
          this.sendToAgentsInRoom(roomId, {
            type: 'human_audio',
            audio_data: audioData,
            audio: audioData,
            timestamp: data.timestamp || new Date().toISOString(),
            clientId: client.id,
            callId: callId
          });

          // Update call status to 'connected' if it's the first audio
          if (callId) {
            try {
              // Security: Get tenant ID from client context to prevent cross-tenant access
              const tenantId = client.tenantId;
              if (!tenantId) {
                console.error('No tenant ID available for call update - security violation prevented');
                return;
              }
              
              // Get the call with proper tenant scoping
              const call = await storage.getCall(callId, tenantId);
              
              if (call && call.status === 'initiated') {
                await storage.updateCall(callId, {
                  status: 'connected'
                }, tenantId);
              }
            } catch (error) {
              console.error('Error updating call status:', error);
            }
          }
        }
        break;

      case 'transcription':
        // Transcription from agent -> send to humans
        if (type === 'agent') {
          this.sendToHumansInRoom(roomId, {
            type: 'transcription',
            text: data.text,
            timestamp: new Date().toISOString()
          });
        }
        break;

      case 'agent_response':
        // Text response from agent -> send to humans
        if (type === 'agent') {
          // Send both message types for compatibility
          this.sendToHumansInRoom(roomId, {
            type: 'ai_response',
            text: data.text,
            timestamp: new Date().toISOString()
          });
          this.sendToHumansInRoom(roomId, {
            type: 'agent_response',
            text: data.text,
            timestamp: new Date().toISOString()
          });
        }
        break;

      case 'audio_response':
        // Audio response from agent -> send to humans
        if (type === 'agent') {
          this.sendToHumansInRoom(roomId, {
            type: 'audio_response',
            audio: data.audio,
            audioData: data.audio || data.audioData,
            timestamp: new Date().toISOString()
          });
        }
        break;

      case 'call_end':
        // End call event
        if (callId) {
          try {
            // Security: Get tenant ID from client context
            const tenantId = client.tenantId;
            if (!tenantId) {
              console.error('No tenant ID available for call end - security violation prevented');
              return;
            }
            
            // Update call status to 'completed' with proper tenant scoping
            const call = await storage.getCall(callId, tenantId);
            
            if (call) {
              const endedAt = new Date();
              const duration = call.startedAt ? 
                Math.floor((endedAt.getTime() - new Date(call.startedAt).getTime()) / 1000) : 0;
              
              await storage.updateCall(callId, {
                status: 'completed',
                endedAt: endedAt,
                durationSeconds: duration
              }, tenantId);
              
              // Notify all clients in room that call ended
              this.broadcastToRoom(roomId, {
                type: 'call_status',
                status: 'ended',
                callId: callId,
                duration: duration,
                timestamp: endedAt.toISOString()
              });
            }
          } catch (error) {
            console.error('Error ending call:', error);
          }
        }
        break;

      case 'ping':
        // Health check
        ws.send(JSON.stringify({ type: 'pong' }));
        break;

      default:
        console.warn(`Unknown message type: ${data.type}`);
    }
  }
}

export function setupWebSocketServer(server: Server): VoiceChatServer {
  const voiceServer = new VoiceChatServer();
  const wss = new WebSocketServer({ 
    noServer: true,
    maxPayload: 1024 * 1024 // 1MB limit for audio frames
  });

  // Handle WebSocket upgrade events manually to filter voice calls vs Vite HMR
  server.on('upgrade', (request, socket, head) => {
    const url = request.url || '';
    
    // Only handle WebSocket upgrades for voice calls (/ws/*)
    if (url === '/ws' || url.startsWith('/ws/')) {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    }
    // Let other WebSocket connections (like Vite HMR) be handled by other servers
  });

  wss.on('connection', async (ws, req) => {
    console.log('New WebSocket connection');
    
    // Parse path to get room ID and client type
    // Expected: /ws/roomId or /ws/roomId/clientType or /ws/roomId/clientType/callId
    // SECURITY: Both agent and widget connections now require JWT authentication
    const pathParts = req.url?.split('/').filter(part => part) || [];
    
    // Check if this is a WebSocket connection for voice calls
    if (pathParts.length < 2 || pathParts[0] !== 'ws') {
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Invalid path format. Expected: /ws/{roomId} or /ws/{roomId}/{clientType} or /ws/{roomId}/{clientType}/{callId}'
      }));
      ws.close();
      return;
    }

    const roomId = pathParts[1];
    const clientType = pathParts[2] === 'agent' ? 'agent' : 'human';
    const callId = pathParts[3];

    // Browser-compatible JWT extraction
    // 1. Try Sec-WebSocket-Protocol header (standard for browser WS auth)
    // 2. Try query string (fallback)
    // 3. Try Authorization header (for non-browser clients)
    let token: string | undefined;
    
    // Extract token from Sec-WebSocket-Protocol header (browser-compatible)
    const protocols = req.headers['sec-websocket-protocol'];
    if (protocols) {
      const protocolList = protocols.split(',').map(p => p.trim());
      // Look for protocol with format: 'auth.{JWT_TOKEN}'
      const authProtocol = protocolList.find(p => p.startsWith('auth.'));
      if (authProtocol) {
        token = authProtocol.substring(5); // Remove 'auth.' prefix
      }
    }
    
    // Fallback: Extract token from query string
    if (!token && req.url) {
      const url = new URL(req.url, 'http://localhost');
      token = url.searchParams.get('token') || undefined;
    }
    
    // Fallback: Extract token from Authorization header (non-browser clients)
    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
      }
    }

    // Security: Verify JWT token and room access with proper tenant scoping
    let tenantId: string | undefined;
    let room: any;
    
    try {
      // Require JWT token for all connections (browser-compatible)
      if (!token) {
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Authentication required. Provide JWT token via Sec-WebSocket-Protocol, query string, or Authorization header'
        }));
        ws.close();
        return;
      }
      
      // Try to verify as regular JWT token first
      let authData = verifyToken(token);
      let widgetVoiceAuth = null;
      
      // If regular JWT verification fails, try widget voice token
      if (!authData) {
        widgetVoiceAuth = verifyWidgetVoiceToken(token);
        if (!widgetVoiceAuth) {
          ws.send(JSON.stringify({
            type: 'error',
            message: 'Invalid or expired JWT token'
          }));
          ws.close();
          return;
        }
      }
      
      // Extract tenantId from verified JWT (either regular or widget voice)
      tenantId = authData?.tenantId || widgetVoiceAuth?.tenantId;
      if (!tenantId) {
        ws.send(JSON.stringify({
          type: 'error',
          message: 'JWT token missing required tenantId claim'
        }));
        ws.close();
        return;
      }
      
      if (clientType === 'agent') {
        // For agents, verify room exists within their tenant
        room = await storage.getRoom(roomId, tenantId);
        
        if (!room) {
          ws.send(JSON.stringify({
            type: 'error',
            message: 'Room not found or access denied for your tenant'
          }));
          ws.close();
          return;
        }
      } else {
        // For widget (human) connections, validate room-specific token claims
        
        // Verify room exists within the authenticated tenant
        room = await storage.getRoom(roomId, tenantId);
        if (!room) {
          ws.send(JSON.stringify({
            type: 'error',
            message: 'Room not found or access denied for this widget'
          }));
          ws.close();
          return;
        }
        
        // Additional security: Verify token was issued for this specific room
        // Widget voice tokens should include roomId for additional validation
        const tokenRoomId = widgetVoiceAuth?.roomId;
        if (tokenRoomId && tokenRoomId !== roomId) {
          console.warn(`⚠️  Widget token issued for different room: token.roomId=${tokenRoomId}, requested=${roomId}`);
          ws.send(JSON.stringify({
            type: 'error',
            message: 'Widget token not valid for this room'
          }));
          ws.close();
          return;
        }
        
        // If callId provided in path, verify it matches token claim
        const tokenCallId = widgetVoiceAuth?.callId;
        if (callId && tokenCallId && tokenCallId !== callId) {
          console.warn(`⚠️  Widget token issued for different call: token.callId=${tokenCallId}, requested=${callId}`);
          ws.send(JSON.stringify({
            type: 'error',
            message: 'Widget token not valid for this call'
          }));
          ws.close();
          return;
        }
        
        // For widget voice tokens, verify callToken matches if available
        if (widgetVoiceAuth?.callToken && callId) {
          try {
            const call = await storage.getCall(callId, tenantId);
            if (!call || call.callToken !== widgetVoiceAuth.callToken) {
              console.warn(`⚠️  Widget voice token callToken mismatch for call ${callId}`);
              ws.send(JSON.stringify({
                type: 'error',
                message: 'Widget voice token not valid for this call'
              }));
              ws.close();
              return;
            }
          } catch (error) {
            console.error('Error verifying widget voice token callToken:', error);
            ws.send(JSON.stringify({
              type: 'error',
              message: 'Error validating widget voice token'
            }));
            ws.close();
            return;
          }
        }
      }
      
      // If callId provided, verify it exists with proper tenant scoping
      if (callId && tenantId) {
        const call = await storage.getCall(callId, tenantId);
        if (!call) {
          ws.send(JSON.stringify({
            type: 'error',
            message: 'Call not found or access denied'
          }));
          ws.close();
          return;
        }
      }
    } catch (error) {
      console.error('Error verifying room/call:', error);
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Internal server error'
      }));
      ws.close();
      return;
    }

    // Register client with tenant ID for security
    const client = voiceServer.registerClient(ws, roomId, clientType, callId, tenantId);

    // Send confirmation
    ws.send(JSON.stringify({
      type: 'connected',
      clientId: client.id,
      roomId: roomId,
      clientType: clientType,
      callId: callId
    }));
    
    // Set up heartbeat to detect disconnected clients
    let heartbeatInterval: NodeJS.Timeout;
    const setupHeartbeat = () => {
      heartbeatInterval = setInterval(() => {
        if (ws.readyState === ws.OPEN) {
          ws.ping();
        } else {
          clearInterval(heartbeatInterval);
        }
      }, 30000); // 30 second heartbeat
    };
    
    setupHeartbeat();
    
    // Handle pong responses
    ws.on('pong', () => {
      // Client is alive, reset heartbeat
    });

    // Handle messages with size limits and rate limiting
    ws.on('message', async (message) => {
      try {
        let messageBuffer: Buffer;
        let messageSize: number;
        
        // Handle different message types (Buffer, Buffer[], ArrayBuffer, string)
        if (Buffer.isBuffer(message)) {
          messageBuffer = message;
          messageSize = message.length;
        } else if (Array.isArray(message)) {
          // Handle Buffer[] case by concatenating buffers
          messageBuffer = Buffer.concat(message);
          messageSize = messageBuffer.length;
        } else if (message instanceof ArrayBuffer) {
          messageBuffer = Buffer.from(message);
          messageSize = message.byteLength;
        } else {
          // String or other types - handle as string
          const messageStr = typeof message === 'string' ? message : String(message);
          messageBuffer = Buffer.from(messageStr);
          messageSize = messageBuffer.length;
        }
        
        // Check message size limit (1MB for audio frames)
        if (messageSize > 1024 * 1024) {
          ws.send(JSON.stringify({
            type: 'error',
            message: 'Message too large. Maximum size is 1MB.'
          }));
          return;
        }
        
        const data = JSON.parse(messageBuffer.toString());
        await voiceServer.handleMessage(ws, data);
      } catch (error) {
        console.error('Error parsing message:', error);
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Invalid JSON format'
        }));
      }
    });

    // Handle disconnect
    ws.on('close', () => {
      if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
      }
      voiceServer.unregisterClient(ws);
    });

    // Handle errors
    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
      }
      voiceServer.unregisterClient(ws);
    });
  });

  return voiceServer;
}