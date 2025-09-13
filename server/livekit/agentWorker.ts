/**
 * LiveKit Voice Agent Worker
 * 
 * This worker creates AI agents that can participate in LiveKit voice calls.
 * It uses LiveKit Agents framework with STT/LLM/TTS pipeline or OpenAI realtime model.
 */

import {
  type JobContext,
  type JobProcess,
  WorkerOptions,
  cli,
  defineAgent,
  voice,
} from '@livekit/agents';
import { fileURLToPath } from 'url';
import * as deepgram from '@livekit/agents-plugin-deepgram';
import * as livekit from '@livekit/agents-plugin-livekit';
import * as openai from '@livekit/agents-plugin-openai';
import * as silero from '@livekit/agents-plugin-silero';
import { BackgroundVoiceCancellation } from '@livekit/noise-cancellation-node';
import { storage } from '../storage';

// Agent configuration interface
export interface AgentConfig {
  agentId: string;
  tenantId: string;
  agentName: string;
  systemPrompt: string;
  voiceSettings: {
    provider: string;
    voice: string;
    model: string;
  };
  useRealtimeModel?: boolean;
}

/**
 * Custom Assistant class that extends voice.Agent
 */
class CustomAssistant extends voice.Agent {
  private agentConfig: AgentConfig;

  constructor(config: AgentConfig) {
    super({
      instructions: config.systemPrompt,
    });
    this.agentConfig = config;
  }

  // Override methods as needed for custom behavior
  async onConnected(ctx: JobContext): Promise<void> {
    console.log(`🤖 Agent ${this.agentConfig.agentName} connected to room ${ctx.room.name}`);
    
    // Log agent connection to database
    try {
      const roomName = ctx.room.name;
      if (roomName) {
        const callInfo = await this.extractCallInfoFromRoom(roomName);
        if (callInfo && callInfo.callId) {
          await storage.updateCall(callInfo.callId, {
            metadata: {
              agentConnected: true,
              agentId: this.agentConfig.agentId,
              connectedAt: new Date().toISOString(),
            },
          }, this.agentConfig.tenantId);
        }
      }
    } catch (error) {
      console.warn(`⚠️ Failed to log agent connection:`, error);
    }
  }

  async onDisconnected(ctx: JobContext): Promise<void> {
    console.log(`🔌 Agent ${this.agentConfig.agentName} disconnected from room ${ctx.room.name}`);
    
    // Log agent disconnection to database
    try {
      const roomName = ctx.room.name;
      if (roomName) {
        const callInfo = await this.extractCallInfoFromRoom(roomName);
        if (callInfo && callInfo.callId) {
          await storage.updateCall(callInfo.callId, {
            metadata: {
              agentDisconnected: true,
              agentId: this.agentConfig.agentId,
              disconnectedAt: new Date().toISOString(),
            },
          }, this.agentConfig.tenantId);
        }
      }
    } catch (error) {
      console.warn(`⚠️ Failed to log agent disconnection:`, error);
    }
  }

  private async extractCallInfoFromRoom(roomName: string): Promise<{ callId: string; roomId: string } | null> {
    try {
      const roomMatch = roomName.match(/room_([^_]+)_call_([^_]+)/);
      if (!roomMatch) {
        return null;
      }
      return {
        roomId: roomMatch[1],
        callId: roomMatch[2],
      };
    } catch {
      return null;
    }
  }
}

/**
 * Main LiveKit Voice Agent implementation using @livekit/agents v1.x
 */
export const livekitVoiceAgent = defineAgent({
  prewarm: async (proc: JobProcess) => {
    // Preload VAD model for better performance
    console.log('🔥 Prewarming LiveKit Voice Agent...');
    proc.userData.vad = await silero.VAD.load();
    console.log('✅ VAD model loaded and ready');
  },
  
  entry: async (ctx: JobContext) => {
    try {
      console.log(`🤖 LiveKit Voice Agent starting for room: ${ctx.room.name}`);

      // Extract agent configuration from room metadata or database
      const agentConfig = await extractAgentConfig(ctx);
      console.log(`🔧 Agent config loaded for: ${agentConfig.agentName}`);
      
      // Get preloaded VAD
      const vad = ctx.proc.userData.vad! as silero.VAD;
      
      // Create custom assistant instance
      const assistant = new CustomAssistant(agentConfig);
      
      let session: voice.AgentSession;
      
      if (agentConfig.useRealtimeModel) {
        // Use OpenAI Realtime Model for more natural conversations
        console.log('🎯 Using OpenAI Realtime Model');
        session = new voice.AgentSession({
          llm: new openai.realtime.RealtimeModel({
            voice: agentConfig.voiceSettings.voice as any,
          }),
        });
      } else {
        // Use traditional STT-LLM-TTS pipeline for more control
        console.log('🔄 Using STT-LLM-TTS pipeline');
        session = new voice.AgentSession({
          vad,
          stt: new deepgram.STT({ 
            model: 'nova-3',
            language: 'en',
          }),
          llm: new openai.LLM({ 
            model: 'gpt-4o-mini',
            temperature: 0.7,
          }),
          tts: new openai.TTS({ 
            voice: agentConfig.voiceSettings.voice as any,
            model: agentConfig.voiceSettings.model || 'tts-1',
          }),
          // Turn detection will be handled automatically by LiveKit
          // turnDetection: new livekit.turnDetector.EOUModel(),
        });
      }

      // Connect to the room first (required before session.start())
      await ctx.connect();

      // Start the agent session
      await session.start({
        agent: assistant,
        room: ctx.room,
        inputOptions: {
          noiseCancellation: BackgroundVoiceCancellation(),
        },
      });
      
      console.log(`✅ Agent ${agentConfig.agentName} connected to room: ${ctx.room.name}`);
      
      // Generate initial greeting
      const greetingHandle = session.generateReply({
        instructions: `Greet the user as ${agentConfig.agentName}. Keep it brief and ask how you can help them today.`,
      });
      
      // Wait for greeting to complete
      await greetingHandle.waitForPlayout();
      
      console.log(`🎤 Voice assistant ${agentConfig.agentName} is now active and waiting for user input`);
      
      // The agent will continue running until the room is closed or the process is terminated
      // LiveKit handles the lifecycle automatically

    } catch (error) {
      console.error(`❌ Error in LiveKit Voice Agent:`, error);
      throw error;
    }
  },
});

/**
 * Extract agent configuration from room metadata or database
 */
export async function extractAgentConfig(ctx: JobContext): Promise<AgentConfig> {
  try {
    // Extract from room metadata first for tenant isolation
    const roomName = ctx.room.name;
    if (!roomName) {
      throw new Error('Room name is required but not provided');
    }
    console.log(`🔍 Extracting agent config from room: ${roomName}`);
    
    // Try to extract from room metadata if available
    let tenantId: string | null = null;
    if (ctx.room.metadata) {
      try {
        const metadata = JSON.parse(ctx.room.metadata);
        tenantId = metadata.tenantId;
        console.log(`📊 Found tenantId from room metadata: ${tenantId}`);
      } catch (error) {
        console.warn(`⚠️ Failed to parse room metadata: ${error}`);
      }
    }
    
    // Parse room name to extract IDs (format: tenant_${tenantId}_room_${roomId}_call_${callId})
    const roomMatch = roomName.match(/tenant_([^_]+)_room_([^_]+)_call_([^_]+)/);
    if (!roomMatch) {
      throw new Error(`Invalid room name format: ${roomName}. Expected: tenant_<tenantId>_room_<roomId>_call_<callId>`);
    }

    const [, roomTenantId, roomId, callId] = roomMatch;
    
    // Use tenantId from room metadata if available, otherwise from room name
    const finalTenantId = tenantId || roomTenantId;
    console.log(`🏠 Room ID: ${roomId}, Call ID: ${callId}, Tenant ID: ${finalTenantId}`);
    
    // Use tenant-scoped lookup for security (no more '*' bypass)
    const calls = await storage.getCallsByTenant(finalTenantId, {
      roomId,
      limit: 1,
    });

    if (calls.calls.length === 0) {
      throw new Error(`Call not found for room ${roomId} in tenant ${finalTenantId}`);
    }

    const call = calls.calls[0];
    console.log(`📞 Found call: ${call.id} for agent: ${call.agentId}`);
    
    // Get agent information
    const agent = await storage.getAgentById(call.agentId);
    if (!agent) {
      throw new Error(`Agent ${call.agentId} not found`);
    }

    console.log(`🤖 Found agent: ${agent.name} (${agent.id})`);
    
    // Get agent configuration (if available)
    const agentPrefs = await storage.getAgentPreferences(agent.id, agent.tenantId);
    
    // Determine if we should use realtime model based on agent preferences
    const useRealtimeModel = agentPrefs?.realtimeVoicePlatform === 'OpenAI' || 
                            agent.callPlatform === 'livekit';

    const config: AgentConfig = {
      agentId: agent.id,
      tenantId: agent.tenantId,
      agentName: agentPrefs?.displayName || agent.name || 'AI Assistant',
      systemPrompt: getSystemPrompt(agent, agentPrefs),
      voiceSettings: {
        provider: 'openai',
        voice: determineVoice(agentPrefs),
        model: 'tts-1',
      },
      useRealtimeModel,
    };
    
    console.log(`✅ Agent config loaded: ${config.agentName} (realtime: ${config.useRealtimeModel})`);
    return config;

  } catch (error) {
    console.error(`❌ Failed to extract agent config:`, error);
    
    // Fallback configuration
    const fallbackConfig: AgentConfig = {
      agentId: 'unknown',
      tenantId: 'unknown',
      agentName: 'AI Assistant',
      systemPrompt: 'You are a helpful AI assistant participating in a voice conversation. Keep your responses concise, natural, and conversational. Be helpful and engaging.',
      voiceSettings: {
        provider: 'openai',
        voice: 'alloy',
        model: 'tts-1',
      },
      useRealtimeModel: false,
    };
    
    console.log(`⚠️ Using fallback agent configuration`);
    return fallbackConfig;
  }
}

/**
 * Generate appropriate system prompt based on agent configuration
 */
function getSystemPrompt(agent: any, preferences: any): string {
  if (preferences?.systemPrompt) {
    return preferences.systemPrompt;
  }
  
  const agentName = preferences?.displayName || agent.name || 'AI Assistant';
  return `You are ${agentName}, a helpful voice AI assistant. You are participating in a real-time voice conversation. Keep your responses:
- Concise and conversational (2-3 sentences max)
- Natural and engaging
- Helpful and relevant to the user's needs
- Professional but friendly in tone

You can hear the user speak and respond naturally. Avoid mentioning that you're an AI unless specifically asked.`;
}

/**
 * Determine the best voice for the agent based on preferences
 */
function determineVoice(preferences: any): string {
  if (preferences?.voice) {
    return preferences.voice;
  }
  
  // Default to alloy for a balanced, professional voice
  return 'alloy';
}

// Global worker instance for management
let workerInstance: any = null;
let workerPromise: Promise<void> | null = null;

/**
 * Start the LiveKit agent worker
 */
export async function startLiveKitWorker(): Promise<void> {
  try {
    // If worker is already starting or running, don't start another
    if (workerInstance !== null || workerPromise !== null) {
      console.log('🔄 LiveKit Agent Worker already running or starting...');
      if (workerPromise) {
        await workerPromise;
      }
      return;
    }

    console.log('🚀 Starting LiveKit Agent Worker...');
    
    // Validate required environment variables
    if (!process.env.LIVEKIT_URL || !process.env.LIVEKIT_API_KEY || !process.env.LIVEKIT_API_SECRET) {
      throw new Error('LiveKit configuration missing. Ensure LIVEKIT_URL, LIVEKIT_API_KEY, and LIVEKIT_API_SECRET are set.');
    }

    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is required for LiveKit agents');
    }

    if (!process.env.DEEPGRAM_API_KEY) {
      console.warn('⚠️ DEEPGRAM_API_KEY not found. STT-LLM-TTS pipeline will be limited to OpenAI models only.');
    }

    // Start the LiveKit agent worker using CLI approach for v1.x
    console.log('🔧 Starting LiveKit Agent Worker using CLI...');
    
    // Get the current file path for the agent
    const agentPath = fileURLToPath(new URL(import.meta.url));
    console.log(`📁 Agent file path: ${agentPath}`);
    
    // Create worker promise to track startup
    workerPromise = Promise.resolve(cli.runApp(new WorkerOptions({ 
      agent: agentPath
    })));
    
    // Start the worker in background and track it
    workerPromise?.then(() => {
      console.log('✅ LiveKit Agent Worker started successfully');
      workerInstance = true;
      workerPromise = null;
    }).catch((error) => {
      console.error('❌ LiveKit Agent Worker failed:', error);
      workerInstance = null;
      workerPromise = null;
      throw error;
    });
    
    // Give the worker a moment to initialize
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('🏃 LiveKit Agent Worker starting in background...');
    
  } catch (error) {
    console.error('❌ Failed to start LiveKit Agent Worker:', error);
    workerInstance = null;
    workerPromise = null;
    throw error;
  }
}

/**
 * Stop the LiveKit agent worker gracefully
 */
export async function stopLiveKitWorker(): Promise<void> {
  console.log('🛑 Stopping LiveKit Agent Worker...');
  
  if (workerInstance || workerPromise) {
    try {
      // Note: LiveKit CLI workers typically handle graceful shutdown automatically
      // when the main process exits. For programmatic control, we mark as stopped.
      console.log('✅ LiveKit Agent Worker marked for shutdown');
    } catch (error) {
      console.error('❌ Error stopping LiveKit Agent Worker:', error);
    } finally {
      workerInstance = null;
      workerPromise = null;
    }
  } else {
    console.log('ℹ️ LiveKit Agent Worker was not running');
  }
}

/**
 * Check if the LiveKit agent worker is running
 */
export function isWorkerRunning(): boolean {
  return workerInstance !== null || workerPromise !== null;
}

/**
 * Get worker health status
 */
export async function getWorkerHealth(): Promise<{ healthy: boolean; message: string }> {
  try {
    // Check if worker is starting
    if (workerPromise && !workerInstance) {
      return { healthy: true, message: 'Worker starting up' };
    }
    
    // Check if worker is running
    if (!workerInstance && !workerPromise) {
      return { healthy: false, message: 'Worker not started' };
    }
    
    // Basic health check - ensure environment variables are still available
    if (!process.env.LIVEKIT_URL || !process.env.LIVEKIT_API_KEY || !process.env.LIVEKIT_API_SECRET) {
      return { healthy: false, message: 'LiveKit configuration missing' };
    }
    
    if (!process.env.OPENAI_API_KEY) {
      return { healthy: false, message: 'OpenAI API key missing' };
    }
    
    return { healthy: true, message: 'Worker running and healthy' };
    
  } catch (error) {
    return { healthy: false, message: `Health check failed: ${error instanceof Error ? error.message : 'Unknown error'}` };
  }
}

// Export the agent for CLI usage
export default livekitVoiceAgent;