const WebSocket = require('ws');
const express = require('express');
const http = require('http');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);

// Serve static files (frontend)
app.use(express.static('public'));

// Room management
class VoiceChatServer {
  constructor() {
    this.rooms = new Map(); // roomId -> Set of clients
    this.clients = new Map(); // WebSocket -> Client info
  }

  registerClient(ws, roomId, clientType = 'human') {
    const clientId = uuidv4();
    const client = {
      id: clientId,
      ws: ws,
      type: clientType,
      roomId: roomId,
      joinedAt: new Date()
    };

    // Add to room
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, new Set());
    }
    this.rooms.get(roomId).add(client);
    this.clients.set(ws, client);

    console.log(`${clientType} client ${clientId} joined room ${roomId}`);

    // Notify other clients
    this.broadcastToRoom(roomId, {
      type: `${clientType}_joined`,
      clientId: clientId,
      timestamp: new Date().toISOString()
    }, client);

    return client;
  }

  unregisterClient(ws) {
    const client = this.clients.get(ws);
    if (!client) return;

    const { roomId, type, id } = client;
    
    // Remove from room
    if (this.rooms.has(roomId)) {
      this.rooms.get(roomId).delete(client);
      
      // Clean up empty rooms
      if (this.rooms.get(roomId).size === 0) {
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

  broadcastToRoom(roomId, message, excludeClient = null) {
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

  sendToAgentsInRoom(roomId, message) {
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

  sendToHumansInRoom(roomId, message) {
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

  handleMessage(ws, data) {
    const client = this.clients.get(ws);
    if (!client) return;

    const { roomId, type } = client;
    
    console.log(`Received ${data.type} from ${type} in room ${roomId}`);

    switch (data.type) {
      case 'audio':
        // Audio from human -> forward to agents
        if (type === 'human') {
          // Support both data.audio and data.data for backward compatibility
          const audioData = data.audio || data.data;
          if (!audioData) {
            console.error('No audio data found in message:', data);
            return;
          }
          
          this.sendToAgentsInRoom(roomId, {
            type: 'human_audio',
            audio_data: audioData,  // Standardize on audio_data
            audio: audioData,       // Keep both for backward compatibility
            timestamp: data.timestamp || new Date().toISOString(),
            clientId: client.id
          });
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
            timestamp: new Date().toISOString()
          });
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

// Create server instance
const voiceServer = new VoiceChatServer();

// WebSocket server
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws, req) => {
  console.log('New WebSocket connection');
  
  // Parse path to get room ID and client type
  // Expected: /ws/roomId or /ws/roomId/clientType
  const pathParts = req.url.split('/').filter(part => part);
  
  if (pathParts.length < 2) {
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Invalid path format. Expected: /ws/{roomId} or /ws/{roomId}/{clientType}'
    }));
    ws.close();
    return;
  }

  const roomId = pathParts[1];
  const clientType = pathParts[2] === 'agent' ? 'agent' : 'human';

  // Register client
  const client = voiceServer.registerClient(ws, roomId, clientType);

  // Send confirmation
  ws.send(JSON.stringify({
    type: 'connected',
    clientId: client.id,
    roomId: roomId,
    clientType: clientType
  }));

  // Handle messages
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      voiceServer.handleMessage(ws, data);
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
    voiceServer.unregisterClient(ws);
  });

  // Handle errors
  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
    voiceServer.unregisterClient(ws);
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    rooms: voiceServer.rooms.size,
    clients: voiceServer.clients.size,
    timestamp: new Date().toISOString()
  });
});

// Get room info
app.get('/api/room/:roomId', (req, res) => {
  const roomId = req.params.roomId;
  const room = voiceServer.rooms.get(roomId);
  
  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }

  const clients = Array.from(room).map(client => ({
    id: client.id,
    type: client.type,
    joinedAt: client.joinedAt
  }));

  res.json({
    roomId,
    clientCount: room.size,
    clients
  });
});

// Start server
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`Voice Chat Server running on port ${PORT}`);
  console.log(`WebSocket endpoint: ws://localhost:${PORT}/ws/{roomId}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down server...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

module.exports = { VoiceChatServer };