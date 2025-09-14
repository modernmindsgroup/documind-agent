import { MediaProvider } from './MediaProvider.js';
import { LiveKitProvider } from './LiveKitProvider.js';

export class MediaProviderFactory {
  private static instance: MediaProvider | null = null;

  static getProvider(): MediaProvider {
    if (!this.instance) {
      const activeProvider = process.env.ACTIVE_MEDIA_PROVIDER?.toLowerCase() || 'livekit';
      
      switch (activeProvider) {
        case 'livekit':
          this.instance = new LiveKitProvider();
          break;
        // Future providers can be added here:
        // case 'agora':
        //   this.instance = new AgoraProvider();
        //   break;
        // case 'twilio':
        //   this.instance = new TwilioProvider();
        //   break;
        default:
          console.warn(`Unknown media provider: ${activeProvider}. Falling back to LiveKit.`);
          this.instance = new LiveKitProvider();
      }

      console.log(`📹 Initialized ${this.instance.providerName} media provider`);
    }

    return this.instance;
  }

  static resetProvider(): void {
    this.instance = null;
  }
}