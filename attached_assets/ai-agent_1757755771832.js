const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
require('dotenv').config();

// API configurations
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY;
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;

class VoiceAgent {
  constructor(roomId, websocketUrl = 'wss://test-2d4c7fqx.livekit.cloud') {
    this.roomId = roomId;
    this.websocketUrl = `${websocketUrl}/ws/${roomId}/agent`;
    this.ws = null;
    this.running = false;
    this.conversationHistory = [];
    
    // Default ElevenLabs voice ID (Rachel)
    this.voiceId = '21m00Tcm4TlvDq8ikWAM';
    
    this.validateApiKeys();
  }

  validateApiKeys() {
    if (!OPENAI_API_KEY) throw new Error('OPENAI_API_KEY not found in environment variables');
    if (!DEEPGRAM_API_KEY) throw new Error('DEEPGRAM_API_KEY not found in environment variables');
    if (!ELEVENLABS_API_KEY) throw new Error('ELEVENLABS_API_KEY not found in environment variables');
    
    console.log('✅ API keys validated');
  }

  async connect() {
    try {
      console.log(`🔌 Connecting to ${this.websocketUrl}`);
      this.ws = new WebSocket(this.websocketUrl);
      
      this.ws.on('open', () => {
        console.log(`✅ Connected to room: ${this.roomId}`);
        this.running = true;
      });

      this.ws.on('message', async (message) => {
        try {
          console.log('📥 Raw message received:', message.toString().substring(0, 100) + '...');
          const data = JSON.parse(message);
          console.log('📦 Parsed message:', JSON.stringify(data, null, 2));
          await this.handleMessage(data);
        } catch (error) {
          console.error('❌ Error handling message:', error);
          console.error('Message that caused error:', message);
        }
      });

      this.ws.on('close', () => {
        console.log('🔌 WebSocket connection closed');
        this.running = false;
      });

      this.ws.on('error', (error) => {
        console.error('❌ WebSocket error:', error);
        this.running = false;
      });

    } catch (error) {
      console.error('❌ Connection error:', error);
      throw error;
    }
  }

  async handleMessage(data) {
    console.log(`📨 Received message type: ${data.type}`);

    switch (data.type) {
      case 'connected':
        console.log(`✅ Agent connected with ID: ${data.clientId}`);
        await this.sendMessage({
          type: 'agent_response',
          text: 'Hello! I\'m your AI assistant. I can hear and respond to your voice.'
        });
        break;

      case 'human_audio':
        console.log('🎤 Processing human audio...');
        // Check for different possible properties where the audio data might be
        const audioData = data.audio_data || data.audio || data.data;
        if (!audioData) {
          console.error('❌ No audio data found in message:', data);
          return;
        }
        console.log('Audio data type:', typeof audioData);
        if (typeof audioData === 'string') {
          console.log('Audio data length:', audioData.length);
        }
        await this.processAudioFromHuman(audioData);
        break;

      case 'human_joined':
        console.log('👤 Human joined the room');
        await this.sendMessage({
          type: 'agent_response',
          text: 'Welcome! I\'m ready to chat with you using voice.'
        });
        break;

      case 'ping':
        await this.sendMessage({ type: 'pong' });
        break;

      default:
        console.log(`ℹ️ Unhandled message type: ${data.type}`);
    }
  }

  async processAudioFromHuman(audioData) {
    try {
      if (!audioData) {
        console.error('❌ No audio data received');
        return;
      }

      console.log('🔤 Transcribing audio...');
      console.log('Audio data type:', typeof audioData);
      console.log('Audio data length:', audioData.length);
      
      // Step 1: Transcribe audio using Deepgram
      const transcription = await this.transcribeAudio(audioData);
      
      if (!transcription || transcription.trim() === '') {
        console.log('❌ Empty transcription, skipping...');
        await this.sendMessage({
          type: 'agent_response',
          text: "I couldn't hear anything. Could you please speak again?"
        });
        return;
      }

      console.log(`💭 Transcribed: "${transcription}"`);
      
      // Send transcription back to human
      await this.sendMessage({
        type: 'transcription',
        text: transcription
      });

      try {
        // Step 2: Generate AI response using OpenAI
        console.log('🤖 Generating AI response...');
        const aiResponse = await this.generateAIResponse(transcription);
        console.log(`💬 AI Response: "${aiResponse}"`);

        // Send text response
        await this.sendMessage({
          type: 'agent_response',
          text: aiResponse
        });

        try {
          // Step 3: Convert response to speech using ElevenLabs
          console.log('🔊 Converting to speech...');
          const audioResponse = await this.textToSpeech(aiResponse);

          // Send audio response if successful
          if (audioResponse) {
            await this.sendMessage({
              type: 'audio_response',
              audio: audioResponse
            });
          }
        } catch (ttsError) {
          console.error('❌ Error in text-to-speech:', ttsError);
          // Continue without audio if TTS fails
        }
      } catch (aiError) {
        console.error('❌ Error generating AI response:', aiError);
        await this.sendMessage({
          type: 'agent_response',
          text: 'I had trouble understanding that. Could you rephrase?'
        });
      }
    } catch (error) {
      console.error('❌ Error in processAudioFromHuman:', error);
      await this.sendMessage({
        type: 'agent_response',
        text: 'Sorry, I encountered an error processing your message.'
      });
    }
  }

  async transcribeAudio(audioBase64) {
    try {
      if (!audioBase64) {
        console.error('No audio data received for transcription');
        return '';
      }

      // Remove data URL prefix if present
      const base64Data = audioBase64.split(';base64,').pop() || audioBase64;
      
      // Convert base64 to buffer
      const audioBuffer = Buffer.from(base64Data, 'base64');
      
      // Save temporarily (Deepgram needs a file)
      const tempFile = path.join(__dirname, 'temp_audio.webm');
      fs.writeFileSync(tempFile, audioBuffer);

      const response = await axios({
        method: 'post',
        url: 'https://api.deepgram.com/v1/listen',
        data: fs.createReadStream(tempFile),
        headers: {
          'Authorization': `Token ${DEEPGRAM_API_KEY}`,
          'Content-Type': 'audio/webm'
        },
        params: {
          model: 'nova-2',
          language: 'en-US',
          punctuate: true,
          diarize: false
        },
        responseType: 'json'
      });

      // Clean up temp file
      fs.unlink(tempFile, (err) => {
        if (err) console.error('Error deleting temp file:', err);
      });

      const transcript = response.data?.results?.channels?.[0]?.alternatives?.[0]?.transcript;
      return transcript || '';

    } catch (error) {
      console.error('❌ Deepgram transcription error:', error.response?.data || error.message);
      return '';
    }
  }

  async generateAIResponse(userMessage) {
    try {
      // Add to conversation history
      this.conversationHistory.push({ role: 'user', content: userMessage });

      // Keep conversation history manageable
      if (this.conversationHistory.length > 10) {
        this.conversationHistory = this.conversationHistory.slice(-8);
      }

      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are a helpful AI assistant in a voice conversation. Keep responses conversational, friendly, and concise (1-2 sentences usually). Respond naturally as if speaking.'
            },
            ...this.conversationHistory
          ],
          max_tokens: 150,
          temperature: 0.7
        },
        {
          headers: {
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const aiResponse = response.data.choices[0].message.content.trim();
      
      // Add to conversation history
      this.conversationHistory.push({ role: 'assistant', content: aiResponse });

      return aiResponse;

    } catch (error) {
      console.error('❌ OpenAI API error:', error.response?.data || error.message);
      return 'I apologize, but I\'m having trouble generating a response right now.';
    }
  }

  async textToSpeech(text) {
    try {
      console.log(`🔊 Sending to ElevenLabs (${text.length} chars)...`);
      
      const response = await axios({
        method: 'post',
        url: `https://api.elevenlabs.io/v1/text-to-speech/${this.voiceId}`,
        headers: {
          'Accept': 'audio/mpeg',
          'xi-api-key': ELEVENLABS_API_KEY,
          'Content-Type': 'application/json',
        },
        data: {
          text: text,
          model_id: 'eleven_monolingual_v1',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.5,
            style: 0.0,
            use_speaker_boost: true
          }
        },
        responseType: 'arraybuffer',
        timeout: 30000 // 30 second timeout
      });

      console.log('✅ ElevenLabs response received');
      
      // Convert to base64
      const audioBase64 = Buffer.from(response.data).toString('base64');
      return audioBase64;

    } catch (error) {
      console.error('❌ ElevenLabs TTS error:');
      if (error.response) {
        // The request was made and the server responded with a status code
        console.error('Status:', error.response.status);
        console.error('Headers:', error.response.headers);
        console.error('Data:', error.response.data?.toString()?.substring(0, 200));
      } else if (error.request) {
        // The request was made but no response was received
        console.error('No response received:', error.request);
      } else {
        // Something happened in setting up the request
        console.error('Error:', error.message);
      }
      console.error('Config:', {
        url: error.config?.url,
        method: error.config?.method,
        headers: error.config?.headers ? {
          ...error.config.headers,
          'xi-api-key': error.config.headers['xi-api-key'] ? '***' : 'missing'
        } : 'none'
      });
      
      // Don't crash the app, just log the error
      return null;
    }
  }

  async sendMessage(message) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.error('❌ WebSocket not connected');
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
    }
    this.running = false;
    console.log('🔌 Agent disconnected');
  }
}

// CLI usage
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Usage: node ai-agent.js <room_id> [websocket_url]');
    console.log('Example: node ai-agent.js room_123');
    console.log('Example: node ai-agent.js room_123 wss://your-server.com');
    process.exit(1);
  }

  const roomId = args[0];
  const websocketUrl = args[1] || 'ws://localhost:8080';

  console.log(`🚀 Starting AI Voice Agent for room: ${roomId}`);

  const agent = new VoiceAgent(roomId, websocketUrl);

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down agent...');
    agent.disconnect();
    process.exit(0);
  });

  try {
    await agent.connect();
    
    // Keep the process running
    while (agent.running) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  } catch (error) {
    console.error('❌ Agent error:', error);
    process.exit(1);
  }
}

// Run if this file is executed directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = VoiceAgent;