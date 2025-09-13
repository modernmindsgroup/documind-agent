import { callPlatformRegistry } from './platform';
import { DefaultCallPlatform } from './default';
import { LiveKitCallPlatform } from './livekit';

/**
 * Initialize and register all call platforms
 */
export async function initializeCallPlatforms(): Promise<void> {
  console.log('🔧 Initializing call platforms...');

  try {
    // Register Default platform (always available)
    const defaultPlatform = new DefaultCallPlatform();
    callPlatformRegistry.register(defaultPlatform);

    // Register LiveKit platform (if configured)
    if (process.env.LIVEKIT_URL && process.env.LIVEKIT_API_KEY && process.env.LIVEKIT_API_SECRET) {
      const livekitPlatform = new LiveKitCallPlatform();
      callPlatformRegistry.register(livekitPlatform);
      console.log('✅ LiveKit platform available');
    } else {
      console.log('⚠️ LiveKit platform not configured - only Default platform will be available');
    }

    // Initialize all registered platforms
    await callPlatformRegistry.initialize();

    // Set up global event handling
    callPlatformRegistry.onEvent((event) => {
      console.log(`📡 Platform event: ${event.type} for call ${event.callId} in room ${event.roomId}`);
      
      // Here you could add additional event handling like:
      // - Updating call status in database
      // - Sending webhooks
      // - Logging to analytics
      // - Notifying other systems
    });

    console.log('✅ Call platforms initialized successfully');

  } catch (error) {
    console.error('❌ Failed to initialize call platforms:', error);
    throw error;
  }
}

/**
 * Shutdown all call platforms gracefully
 */
export async function shutdownCallPlatforms(): Promise<void> {
  console.log('🛑 Shutting down call platforms...');
  
  try {
    await callPlatformRegistry.shutdown();
    console.log('✅ Call platforms shutdown complete');
  } catch (error) {
    console.error('❌ Error during call platforms shutdown:', error);
  }
}

/**
 * Get platform health status
 */
export async function getCallPlatformHealth(): Promise<{ [key: string]: boolean }> {
  return await callPlatformRegistry.checkHealth();
}

// Re-export the registry for use in routes
export { callPlatformRegistry } from './platform';