import type { Agent, Call, Room } from "@shared/schema";

// Platform-agnostic call information
export interface CallConnectionInfo {
  roomId: string;
  connectionToken: string;
  websocketUrl?: string;
  livekitUrl?: string;
  livekitToken?: string;
  additionalData?: Record<string, any>;
}

// Platform event types
export interface PlatformEvent {
  type: 'call_started' | 'call_ended' | 'agent_connected' | 'agent_disconnected' | 'error';
  callId: string;
  roomId: string;
  data?: any;
  error?: string;
  timestamp: Date;
}

// Platform event handler
export type PlatformEventHandler = (event: PlatformEvent) => Promise<void> | void;

// Core platform interface
export interface ICallPlatform {
  // Platform identification
  readonly name: string;
  readonly type: 'default' | 'livekit';

  // Core call management
  startCall(call: Call, room: Room, agent: Agent): Promise<CallConnectionInfo>;
  endCall(callId: string, roomId: string): Promise<void>;
  getConnectionInfo(callId: string, roomId: string): Promise<CallConnectionInfo | null>;

  // Agent management
  attachAgent(callId: string, roomId: string, agent: Agent): Promise<void>;
  detachAgent(callId: string, roomId: string, agentId: string): Promise<void>;

  // Event handling
  onPlatformEvent(handler: PlatformEventHandler): void;
  offPlatformEvent(handler: PlatformEventHandler): void;

  // Platform lifecycle
  initialize?(): Promise<void>;
  shutdown?(): Promise<void>;
  
  // Health checks
  isHealthy(): Promise<boolean>;
}

// Platform configuration
export interface PlatformConfig {
  default: {
    websocketHost?: string;
    websocketPort?: number;
  };
  livekit: {
    url?: string;
    apiKey?: string;
    apiSecret?: string;
    region?: string;
  };
}

// Platform registry class
export class CallPlatformRegistry {
  private platforms = new Map<string, ICallPlatform>();
  private defaultPlatform: string;
  private eventHandlers: PlatformEventHandler[] = [];

  constructor(defaultPlatform: string = 'default') {
    this.defaultPlatform = defaultPlatform;
  }

  // Register a platform
  register(platform: ICallPlatform): void {
    this.platforms.set(platform.type, platform);
    console.log(`📡 Registered call platform: ${platform.name} (${platform.type})`);

    // Forward platform events to registry handlers
    platform.onPlatformEvent((event) => {
      this.eventHandlers.forEach(handler => {
        try {
          handler(event);
        } catch (error) {
          console.error('Platform event handler error:', error);
        }
      });
    });
  }

  // Get platform by type
  getPlatform(type: string): ICallPlatform | null {
    return this.platforms.get(type) || null;
  }

  // Get platform for agent (with fallback logic)
  getPlatformForAgent(agent: Agent): ICallPlatform {
    // First try agent's preferred platform
    if (agent.callPlatform && this.platforms.has(agent.callPlatform)) {
      const platform = this.platforms.get(agent.callPlatform)!;
      console.log(`📡 Using configured platform for agent ${agent.id}: ${platform.name}`);
      return platform;
    }

    // Fall back to default platform
    const defaultPlatform = this.platforms.get(this.defaultPlatform);
    if (defaultPlatform) {
      console.log(`📡 Using default platform for agent ${agent.id}: ${defaultPlatform.name}`);
      return defaultPlatform;
    }

    // Emergency fallback - use any available platform
    const availablePlatform = Array.from(this.platforms.values())[0];
    if (availablePlatform) {
      console.warn(`⚠️ No default platform found, using fallback for agent ${agent.id}: ${availablePlatform.name}`);
      return availablePlatform;
    }

    throw new Error('No call platforms available');
  }

  // Get all registered platforms
  getAllPlatforms(): ICallPlatform[] {
    return Array.from(this.platforms.values());
  }

  // Check platform health
  async checkHealth(): Promise<{ [key: string]: boolean }> {
    const health: { [key: string]: boolean } = {};
    
    for (const [type, platform] of Array.from(this.platforms.entries())) {
      try {
        health[type] = await platform.isHealthy();
      } catch (error) {
        console.error(`Platform health check failed for ${type}:`, error);
        health[type] = false;
      }
    }
    
    return health;
  }

  // Event handling
  onEvent(handler: PlatformEventHandler): void {
    this.eventHandlers.push(handler);
  }

  offEvent(handler: PlatformEventHandler): void {
    const index = this.eventHandlers.indexOf(handler);
    if (index > -1) {
      this.eventHandlers.splice(index, 1);
    }
  }

  // Initialize all platforms
  async initialize(): Promise<void> {
    console.log('🚀 Initializing call platforms...');
    
    for (const [type, platform] of Array.from(this.platforms.entries())) {
      try {
        if (platform.initialize) {
          await platform.initialize();
          console.log(`✅ Initialized platform: ${platform.name}`);
        }
      } catch (error) {
        console.error(`❌ Failed to initialize platform ${type}:`, error);
      }
    }
  }

  // Shutdown all platforms
  async shutdown(): Promise<void> {
    console.log('🛑 Shutting down call platforms...');
    
    for (const [type, platform] of Array.from(this.platforms.entries())) {
      try {
        if (platform.shutdown) {
          await platform.shutdown();
          console.log(`✅ Shutdown platform: ${platform.name}`);
        }
      } catch (error) {
        console.error(`❌ Failed to shutdown platform ${type}:`, error);
      }
    }
  }
}

// Global registry instance
export const callPlatformRegistry = new CallPlatformRegistry(
  process.env.CALL_PLATFORM_DEFAULT || 'default'
);

// Utility function to get platform config from environment
export function getPlatformConfig(): PlatformConfig {
  return {
    default: {
      websocketHost: process.env.WEBSOCKET_HOST || 'localhost',
      websocketPort: parseInt(process.env.WEBSOCKET_PORT || '5000'),
    },
    livekit: {
      url: process.env.LIVEKIT_URL,
      apiKey: process.env.LIVEKIT_API_KEY,
      apiSecret: process.env.LIVEKIT_API_SECRET,
      region: process.env.LIVEKIT_REGION,
    },
  };
}