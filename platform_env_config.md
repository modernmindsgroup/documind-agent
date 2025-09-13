# Call Platform Environment Configuration

This document describes the environment variables needed to configure the call platform abstraction.

## Required Environment Variables

### Core Platform Configuration

```bash
# Default platform to use when agent doesn't specify one
# Options: 'default' (WebSocket) or 'livekit'
CALL_PLATFORM_DEFAULT=default

# WebSocket Platform Configuration
WEBSOCKET_HOST=localhost
WEBSOCKET_PORT=5000
```

### LiveKit Platform Configuration

Required for LiveKit platform support:

```bash
# LiveKit server URL
LIVEKIT_URL=ws://localhost:7880

# LiveKit API credentials
LIVEKIT_API_KEY=your_livekit_api_key
LIVEKIT_API_SECRET=your_livekit_api_secret

# Optional: LiveKit region (for cloud deployments)
LIVEKIT_REGION=us-west-2
```

### AI Service Configuration (Required for both platforms)

```bash
# OpenAI API key for language processing
OPENAI_API_KEY=your_openai_api_key

# Deepgram API key for speech-to-text
DEEPGRAM_API_KEY=your_deepgram_api_key

# ElevenLabs API key for text-to-speech (Default platform)
ELEVENLABS_API_KEY=your_elevenlabs_api_key
```

## Platform Selection

### Agent-Level Configuration

Each agent can specify its preferred call platform via the `callPlatform` field:
- `'default'`: Uses WebSocket-based platform with existing infrastructure
- `'livekit'`: Uses LiveKit platform for enhanced voice features

### Fallback Behavior

1. If agent specifies a platform and it's available → use specified platform
2. If agent specifies a platform but it's unavailable → fallback to default platform
3. If agent doesn't specify a platform → use `CALL_PLATFORM_DEFAULT`
4. If no platforms are available → error

## Platform Capabilities

### Default WebSocket Platform
- ✅ Custom WebSocket implementation
- ✅ Auto-spawning AI agents
- ✅ OpenAI + Deepgram + ElevenLabs integration
- ✅ Full backward compatibility
- ✅ Multi-tenant isolation

### LiveKit Platform
- ✅ LiveKit infrastructure for improved performance
- ✅ Built-in voice optimization
- ✅ Better handling of network conditions
- ✅ OpenAI integration via @livekit/agents-plugin-openai
- ✅ Scalable agent worker architecture
- ⚠️ Requires LiveKit server setup

## Testing Configuration

To test the platform abstraction:

1. **Default Platform Only** (minimal setup):
   ```bash
   CALL_PLATFORM_DEFAULT=default
   OPENAI_API_KEY=your_key
   DEEPGRAM_API_KEY=your_key
   ELEVENLABS_API_KEY=your_key
   ```

2. **LiveKit Platform** (full setup):
   ```bash
   CALL_PLATFORM_DEFAULT=livekit
   LIVEKIT_URL=ws://localhost:7880
   LIVEKIT_API_KEY=your_key
   LIVEKIT_API_SECRET=your_key
   OPENAI_API_KEY=your_key
   DEEPGRAM_API_KEY=your_key
   ```

## Development Notes

- If LiveKit environment variables are missing, the system will only register the Default platform
- Platform health checks run automatically
- Platform events are logged for debugging
- All platforms maintain the same API contract for voice calls