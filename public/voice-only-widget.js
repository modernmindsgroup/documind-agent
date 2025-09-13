/**
 * EchoAgent Voice Widget (Voice Only)
 * A lightweight, embeddable voice-only widget for AI conversations.
 * 
 * Usage:
 * <script 
 *   src="https://your-domain.com/voice-only-widget.js" 
 *   data-agent-id="YOUR_AGENT_ID">
 * </script>
 */

(function() {
  // Configuration - Update this to match your deployment
  const API_BASE_URL = window.location.origin + '/api';
  
  // Get agent ID from script tag
  const currentScript = document.currentScript;
  const agentId = currentScript.getAttribute('data-agent-id');
  
  if (!agentId) {
    console.error('EchoAgent Voice: Missing agent ID. Add data-agent-id attribute to the script tag.');
    return;
  }
  
  // Widget state (voice only)
  let state = {
    isOpen: false,
    isContactInfoSubmitted: false,
    contactId: null,
    contactInfo: null, // Store contact info for voice API
    agentConfig: null,
    // Agent availability state
    agentStatus: null,
    lastStatusCheck: null,
    statusCheckInterval: null,
    // Widget connection state
    connectionState: 'idle', // idle, checking_agent, agent_unavailable, connecting, connected, error
    // Voice call state
    voiceCall: null,
    isRecording: false,
    isProcessing: false,
    isPlaying: false,
    mediaRecorder: null,
    recordedChunks: [],
    websocket: null,
    roomId: null,
    callId: null,
    // Error handling
    lastError: null,
    retryCount: 0,
    maxRetries: 3
  };
  
  // API helper functions
  async function apiRequest(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    };
    
    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }
    
    try {
      const response = await fetch(url, config);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }
      
      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }
  
  // Load agent configuration
  async function loadAgentConfig() {
    try {
      const agentData = await apiRequest(`/widget/agents/${agentId}`);
      state.agentConfig = agentData;
      return agentData;
    } catch (error) {
      console.error('Failed to load agent configuration:', error);
      return null;
    }
  }
  
  // Store contact info for voice call (no backend contact creation needed for voice calls)
  function storeContactInfo(contactInfo) {
    state.contactInfo = contactInfo;
    console.log('Contact info stored for voice call:', contactInfo.name);
    return contactInfo;
  }
  
  // Agent status checking functions
  async function checkAgentStatus() {
    try {
      console.log('🔍 Checking agent status for:', agentId);
      state.connectionState = 'checking_agent';
      updateVoiceUI();
      
      const statusData = await apiRequest(`/widget/agents/${agentId}/status`);
      console.log('📊 Agent status response:', statusData);
      
      state.agentStatus = statusData;
      state.lastStatusCheck = Date.now();
      state.lastError = null;
      
      if (statusData.available) {
        state.connectionState = 'idle';
        console.log('✅ Agent is available and ready');
      } else {
        state.connectionState = 'agent_unavailable';
        console.log('⚠️ Agent is currently unavailable:', statusData.reason || 'No reason provided');
      }
      
      updateVoiceUI();
      return statusData;
      
    } catch (error) {
      console.error('❌ Failed to check agent status:', error);
      state.connectionState = 'error';
      state.lastError = {
        type: 'status_check_failed',
        message: 'Unable to check agent status',
        details: error.message,
        timestamp: Date.now()
      };
      updateVoiceUI();
      throw error;
    }
  }
  
  // Start periodic agent status checking
  function startAgentStatusMonitoring() {
    // Check immediately
    checkAgentStatus().catch(error => {
      console.warn('Initial agent status check failed:', error);
    });
    
    // Then check every 30 seconds
    if (state.statusCheckInterval) {
      clearInterval(state.statusCheckInterval);
    }
    
    state.statusCheckInterval = setInterval(() => {
      // Only check if we're not in an active call
      if (!state.voiceCall && state.connectionState !== 'connecting' && state.connectionState !== 'connected') {
        checkAgentStatus().catch(error => {
          console.warn('Periodic agent status check failed:', error);
        });
      }
    }, 30000); // Check every 30 seconds
  }
  
  // Stop agent status monitoring
  function stopAgentStatusMonitoring() {
    if (state.statusCheckInterval) {
      clearInterval(state.statusCheckInterval);
      state.statusCheckInterval = null;
    }
  }
  
  // Check if agent is available (with optional fresh check)
  async function isAgentAvailable(forceCheck = false) {
    const now = Date.now();
    const statusAge = state.lastStatusCheck ? now - state.lastStatusCheck : Infinity;
    
    // If status is older than 60 seconds or forced, get fresh status
    if (forceCheck || statusAge > 60000 || !state.agentStatus) {
      await checkAgentStatus();
    }
    
    return state.agentStatus?.available === true;
  }
  
  // Retry mechanism for failed operations
  async function retryWithBackoff(operation, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔄 Attempt ${attempt}/${maxRetries} for operation`);
        const result = await operation();
        state.retryCount = 0; // Reset on success
        return result;
      } catch (error) {
        console.warn(`❌ Attempt ${attempt}/${maxRetries} failed:`, error.message);
        
        if (attempt === maxRetries) {
          state.retryCount = maxRetries;
          throw error;
        }
        
        // Exponential backoff: 1s, 2s, 4s
        const delay = Math.pow(2, attempt - 1) * 1000;
        console.log(`⏳ Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  // Voice call functions
  async function startVoiceCall() {
    try {
      console.log('📞 Starting voice call for agent:', agentId);
      
      // First check if agent is available
      state.connectionState = 'checking_agent';
      updateVoiceUI();
      
      const isAvailable = await isAgentAvailable(true); // Force fresh check
      
      if (!isAvailable) {
        const error = new Error('Agent is currently unavailable');
        error.code = 'AGENT_UNAVAILABLE';
        error.reason = state.agentStatus?.reason || 'Agent unavailable';
        throw error;
      }
      
      console.log('✅ Agent is available, starting voice call');
      state.connectionState = 'connecting';
      updateVoiceUI();
      
      // Start the voice call with contact info using retry mechanism
      const callData = await retryWithBackoff(async () => {
        return await apiRequest(`/widget/agents/${agentId}/voice/start`, {
          method: 'POST',
          body: {
            contactName: state.contactInfo?.name || 'Anonymous User',
            contactEmail: state.contactInfo?.email || `anonymous-${Date.now()}@widget.voice`,
            contactPhone: state.contactInfo?.phone || null
          }
        });
      }, state.maxRetries);
      
      console.log('📞 Voice call started:', callData);
      state.voiceCall = callData;
      state.roomId = callData.roomId;
      state.callId = callData.callId;
      
      // Connect to WebSocket for real-time communication
      await connectToVoiceWebSocket(callData.token);
      
      state.connectionState = 'connected';
      updateVoiceUI();
      
      return callData;
    } catch (error) {
      console.error('❌ Failed to start voice call:', error);
      
      // Handle different error types
      if (error.code === 'AGENT_UNAVAILABLE') {
        state.connectionState = 'agent_unavailable';
        state.lastError = {
          type: 'agent_unavailable',
          message: 'Agent is currently busy or unavailable',
          details: error.reason || 'Agent unavailable',
          timestamp: Date.now()
        };
      } else {
        state.connectionState = 'error';
        state.lastError = {
          type: 'connection_failed',
          message: 'Failed to start voice call',
          details: error.message,
          timestamp: Date.now()
        };
      }
      
      updateVoiceUI();
      throw error;
    }
  }

  async function endVoiceCall() {
    try {
      if (state.callId) {
        console.log('🔚 Ending voice call:', state.callId);
        
        // Stop recording if active
        if (state.isRecording) {
          stopRecording();
        }
        
        // Close WebSocket connection
        if (state.websocket) {
          state.websocket.close();
          state.websocket = null;
        }
        
        // End the call on the backend
        await apiRequest(`/widget/agents/${agentId}/voice/end`, {
          method: 'POST',
          body: {
            callId: state.callId
          }
        });
        
        // Reset voice state
        state.voiceCall = null;
        state.callId = null;
        state.roomId = null;
        state.isRecording = false;
        state.isProcessing = false;
        state.isPlaying = false;
        state.connectionState = 'idle';
        state.lastError = null;
        
        // Resume agent status monitoring
        startAgentStatusMonitoring();
        
        console.log('✅ Voice call ended successfully');
      }
    } catch (error) {
      console.error('❌ Failed to end voice call:', error);
      state.connectionState = 'error';
      state.lastError = {
        type: 'disconnect_failed',
        message: 'Failed to properly end voice call',
        details: error.message,
        timestamp: Date.now()
      };
      updateVoiceUI();
      throw error;
    }
  }

  // WebSocket connection for real-time voice communication
  async function connectToVoiceWebSocket(token) {
    try {
      // Include roomId, clientType (human), and callId in the WebSocket path
      const wsUrl = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws/${state.roomId}/human/${state.callId}`;
      console.log('Connecting to WebSocket:', wsUrl);
      
      // Create WebSocket connection with JWT token in protocol header
      state.websocket = new WebSocket(wsUrl, [`auth.${token}`]);
      
      state.websocket.onopen = () => {
        console.log('WebSocket connected for voice call');
      };
      
      state.websocket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          handleVoiceWebSocketMessage(message);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };
      
      state.websocket.onclose = (event) => {
        console.log('WebSocket connection closed:', event.code, event.reason);
        state.websocket = null;
      };
      
      state.websocket.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
      
    } catch (error) {
      console.error('Failed to connect to voice WebSocket:', error);
      throw error;
    }
  }

  function handleVoiceWebSocketMessage(message) {
    console.log('Received WebSocket message:', message);
    
    switch (message.type) {
      case 'connected':
        console.log('WebSocket connection confirmed:', message);
        // Connection successful, ready to process audio
        break;
        
      case 'audio_response':
        // Play AI audio response
        if (message.audioData) {
          playAudioResponse(message.audioData);
        }
        break;
        
      case 'call_status':
        console.log('Call status update:', message.status);
        if (message.status === 'ended') {
          endVoiceCall();
        }
        break;
        
      case 'error':
        console.error('Voice WebSocket error:', message.message);
        showError('Voice call error: ' + message.message);
        break;
        
      default:
        console.warn('Unknown WebSocket message type:', message.type);
    }
  }

  // Audio recording functions
  async function startRecording() {
    try {
      console.log('Requesting microphone access...');
      
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true
        } 
      });
      
      console.log('Microphone access granted');
      
      // Create MediaRecorder
      state.mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm'
      });
      
      state.recordedChunks = [];
      state.isRecording = true;
      
      // Handle data available
      state.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          state.recordedChunks.push(event.data);
        }
      };
      
      // Handle stop
      state.mediaRecorder.onstop = () => {
        console.log('Recording stopped');
        
        // Create audio blob
        const audioBlob = new Blob(state.recordedChunks, { type: 'audio/webm' });
        
        // Send audio data via WebSocket
        if (state.websocket && state.websocket.readyState === WebSocket.OPEN) {
          sendAudioToWebSocket(audioBlob);
        }
        
        // Stop microphone stream
        stream.getTracks().forEach(track => track.stop());
        
        state.isRecording = false;
        state.isProcessing = true;
        updateVoiceUI();
      };
      
      // Start recording
      state.mediaRecorder.start();
      console.log('Recording started');
      
      updateVoiceUI();
      
    } catch (error) {
      console.error('Failed to start recording:', error);
      showError('Could not access microphone. Please check your permissions.');
      state.isRecording = false;
      updateVoiceUI();
    }
  }

  function stopRecording() {
    if (state.mediaRecorder && state.isRecording) {
      console.log('Stopping recording...');
      state.mediaRecorder.stop();
    }
  }

  async function sendAudioToWebSocket(audioBlob) {
    try {
      console.log('Sending audio data to WebSocket, size:', audioBlob.size);
      
      // Convert blob to base64
      const reader = new FileReader();
      reader.onload = () => {
        const base64Audio = reader.result.split(',')[1]; // Remove data:audio/webm;base64, prefix
        
        const message = {
          type: 'audio_message',
          audioData: base64Audio,
          roomId: state.roomId,
          callId: state.callId
        };
        
        state.websocket.send(JSON.stringify(message));
        console.log('Audio message sent via WebSocket');
      };
      
      reader.readAsDataURL(audioBlob);
      
    } catch (error) {
      console.error('Failed to send audio to WebSocket:', error);
      state.isProcessing = false;
      updateVoiceUI();
    }
  }

  // Audio playback function
  function playAudioResponse(base64AudioData) {
    try {
      console.log('Playing AI audio response');
      state.isPlaying = true;
      updateVoiceUI();
      
      // Create audio element
      const audio = new Audio();
      audio.src = `data:audio/mpeg;base64,${base64AudioData}`;
      
      audio.onended = () => {
        console.log('Audio playback finished');
        state.isPlaying = false;
        state.isProcessing = false;
        updateVoiceUI();
      };
      
      audio.onerror = (error) => {
        console.error('Audio playback error:', error);
        state.isPlaying = false;
        state.isProcessing = false;
        updateVoiceUI();
      };
      
      audio.play().catch(error => {
        console.error('Failed to play audio:', error);
        state.isPlaying = false;
        state.isProcessing = false;
        updateVoiceUI();
      });
      
    } catch (error) {
      console.error('Failed to play audio response:', error);
      state.isPlaying = false;
      state.isProcessing = false;
      updateVoiceUI();
    }
  }
  
  // Create widget DOM structure (voice only)
  function createWidgetDOM(agentConfig) {
    const displayName = agentConfig?.preferences?.displayName || agentConfig?.name || 'Voice Assistant';
    
    // Create main container
    const container = document.createElement('div');
    container.className = 'echoagent-widget-container';
    container.innerHTML = `
      <style>
        .echoagent-widget-container {
          position: fixed;
          bottom: 20px;
          right: 20px;
          z-index: 10000;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
        }
        
        .echoagent-voice-button {
          width: 70px;
          height: 70px;
          border-radius: 50%;
          background: linear-gradient(135deg, #4a5c96 0%, #6366f1 100%);
          border: none;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          transition: all 0.3s ease;
          position: relative;
        }
        
        .echoagent-voice-button:hover {
          transform: scale(1.1);
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.25);
        }
        
        .echoagent-voice-button.recording {
          background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%);
          animation: echoagent-pulse 1.5s infinite;
        }
        
        .echoagent-voice-button.processing {
          background: linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%);
          animation: echoagent-spin 1s linear infinite;
        }
        
        .echoagent-voice-button.playing {
          background: linear-gradient(135deg, #059669 0%, #10b981 100%);
          animation: echoagent-pulse 1s infinite;
        }
        
        .echoagent-voice-window {
          position: absolute;
          bottom: 90px;
          right: 0;
          width: 320px;
          max-width: calc(100vw - 40px);
          background: white;
          border-radius: 16px;
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
          display: none;
          flex-direction: column;
          overflow: hidden;
          transform: scale(0.9);
          opacity: 0;
          transition: all 0.3s ease;
        }
        
        .echoagent-voice-window.open {
          display: flex;
          transform: scale(1);
          opacity: 1;
        }
        
        .echoagent-voice-header {
          background: linear-gradient(135deg, #4a5c96 0%, #6366f1 100%);
          color: white;
          padding: 20px;
          text-align: center;
          position: relative;
        }
        
        .echoagent-voice-header-title {
          font-weight: 600;
          font-size: 18px;
          margin-bottom: 4px;
        }
        
        .echoagent-voice-header-subtitle {
          font-size: 14px;
          opacity: 0.8;
        }
        
        .echoagent-close-button {
          position: absolute;
          top: 16px;
          right: 16px;
          background: none;
          border: none;
          color: white;
          font-size: 24px;
          cursor: pointer;
          padding: 0;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
          transition: background 0.2s ease;
        }
        
        .echoagent-close-button:hover {
          background: rgba(255, 255, 255, 0.1);
        }
        
        .echoagent-contact-form {
          padding: 24px;
          background: white;
        }
        
        .echoagent-input-group {
          margin-bottom: 16px;
        }
        
        .echoagent-input-group label {
          display: block;
          margin-bottom: 6px;
          font-size: 14px;
          font-weight: 500;
          color: #333;
        }
        
        .echoagent-input-field {
          width: 100%;
          padding: 10px 14px;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          font-size: 14px;
          box-sizing: border-box;
          transition: border-color 0.2s ease;
        }
        
        .echoagent-input-field:focus {
          outline: none;
          border-color: #6366f1;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
        }
        
        .echoagent-submit-button {
          width: 100%;
          background: #6366f1;
          color: white;
          border: none;
          padding: 12px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.2s ease;
        }
        
        .echoagent-submit-button:hover {
          background: #5b5af0;
        }
        
        .echoagent-submit-button:disabled {
          background: #9ca3af;
          cursor: not-allowed;
        }
        
        .echoagent-voice-controls {
          padding: 32px 24px;
          background: white;
          text-align: center;
        }
        
        .echoagent-voice-status {
          font-size: 16px;
          font-weight: 500;
          margin-bottom: 24px;
          min-height: 24px;
          color: #374151;
        }
        
        .echoagent-voice-status.recording {
          color: #dc2626;
          animation: echoagent-pulse-text 1.5s infinite;
        }
        
        .echoagent-voice-status.processing {
          color: #f59e0b;
        }
        
        .echoagent-voice-status.playing {
          color: #059669;
        }
        
        .echoagent-record-button {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: #6366f1;
          border: none;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 12px;
          font-weight: 500;
          box-shadow: 0 4px 16px rgba(99, 102, 241, 0.3);
          transition: all 0.2s ease;
          margin: 0 auto 16px;
        }
        
        .echoagent-record-button:hover {
          transform: scale(1.05);
          box-shadow: 0 6px 20px rgba(99, 102, 241, 0.4);
        }
        
        .echoagent-record-button:active {
          transform: scale(0.95);
        }
        
        .echoagent-record-button.recording {
          background: #dc2626;
          animation: echoagent-pulse 1.5s infinite;
          box-shadow: 0 4px 16px rgba(220, 38, 38, 0.3);
        }
        
        .echoagent-record-button.processing,
        .echoagent-record-button.playing {
          background: #9ca3af;
          cursor: not-allowed;
          transform: none;
        }
        
        .echoagent-record-button.processing:hover,
        .echoagent-record-button.playing:hover {
          transform: none;
        }
        
        .echoagent-record-button svg {
          margin-bottom: 4px;
        }
        
        .echoagent-voice-hint {
          font-size: 12px;
          color: #6b7280;
          margin-top: 8px;
        }
        
        .echoagent-error {
          background: #fed7d7;
          color: #c53030;
          padding: 12px 16px;
          border-radius: 8px;
          margin: 16px 24px;
          font-size: 14px;
          text-align: center;
        }
        
        @keyframes echoagent-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        
        @keyframes echoagent-pulse-text {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
        
        @keyframes echoagent-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        /* Mobile responsiveness */
        @media (max-width: 480px) {
          .echoagent-voice-window {
            width: calc(100vw - 40px);
            bottom: 90px;
            right: 20px;
          }
          
          .echoagent-widget-container {
            bottom: 20px;
            right: 20px;
          }
        }
      </style>
    `;
    
    // Create voice button
    const voiceButton = document.createElement('button');
    voiceButton.className = 'echoagent-voice-button';
    voiceButton.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
        <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
        <line x1="12" y1="19" x2="12" y2="23"></line>
        <line x1="8" y1="23" x2="16" y2="23"></line>
      </svg>
    `;
    
    // Create voice window
    const voiceWindow = document.createElement('div');
    voiceWindow.className = 'echoagent-voice-window';
    
    // Create voice header
    const voiceHeader = document.createElement('div');
    voiceHeader.className = 'echoagent-voice-header';
    voiceHeader.innerHTML = `
      <div class="echoagent-voice-header-title">${displayName}</div>
      <div class="echoagent-voice-header-subtitle">Voice Assistant</div>
      <button class="echoagent-close-button">&times;</button>
    `;
    
    // Create contact form
    const contactForm = document.createElement('div');
    contactForm.className = 'echoagent-contact-form';
    contactForm.innerHTML = `
      <div class="echoagent-input-group">
        <label for="echoagent-name">Name</label>
        <input type="text" id="echoagent-name" class="echoagent-input-field" placeholder="Your name" required>
      </div>
      <div class="echoagent-input-group">
        <label for="echoagent-email">Email</label>
        <input type="email" id="echoagent-email" class="echoagent-input-field" placeholder="Your email address" required>
      </div>
      <div class="echoagent-input-group">
        <label for="echoagent-phone">Phone (optional)</label>
        <input type="tel" id="echoagent-phone" class="echoagent-input-field" placeholder="Your phone number">
      </div>
      <button class="echoagent-submit-button">Start Voice Call</button>
    `;
    
    // Create voice controls
    const voiceControls = document.createElement('div');
    voiceControls.className = 'echoagent-voice-controls';
    voiceControls.style.display = 'none';
    voiceControls.innerHTML = `
      <div class="echoagent-voice-status">Ready to record</div>
      <button class="echoagent-record-button">
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
          <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
          <line x1="12" y1="19" x2="12" y2="23"></line>
          <line x1="8" y1="23" x2="16" y2="23"></line>
        </svg>
        <span>Hold to Record</span>
      </button>
      <div class="echoagent-voice-hint">Hold the button and speak</div>
    `;
    
    // Append elements to voice window
    voiceWindow.appendChild(voiceHeader);
    voiceWindow.appendChild(contactForm);
    voiceWindow.appendChild(voiceControls);
    
    // Append elements to container
    container.appendChild(voiceWindow);
    container.appendChild(voiceButton);
    
    // Append container to body
    document.body.appendChild(container);
    
    return {
      container,
      voiceButton,
      voiceWindow,
      contactForm,
      voiceControls,
      recordButton: voiceControls.querySelector('.echoagent-record-button'),
      voiceStatus: voiceControls.querySelector('.echoagent-voice-status'),
      closeButton: voiceHeader.querySelector('.echoagent-close-button'),
      submitButton: contactForm.querySelector('.echoagent-submit-button')
    };
  }
  
  // Voice UI update function
  function updateVoiceUI() {
    const elements = document.querySelector('.echoagent-widget-container');
    if (!elements) return;
    
    const voiceStatus = elements.querySelector('.echoagent-voice-status');
    const recordButton = elements.querySelector('.echoagent-record-button');
    const voiceButton = elements.querySelector('.echoagent-voice-button');
    const recordButtonSpan = recordButton?.querySelector('span');
    
    if (!voiceStatus || !recordButton || !recordButtonSpan || !voiceButton) return;
    
    // Handle connection states first (highest priority)
    switch (state.connectionState) {
      case 'checking_agent':
        voiceStatus.textContent = '🔍 Checking agent availability...';
        voiceStatus.className = 'echoagent-voice-status checking';
        recordButtonSpan.textContent = 'Checking...';
        recordButton.className = 'echoagent-record-button checking';
        voiceButton.className = 'echoagent-voice-button checking';
        recordButton.disabled = true;
        return;
        
      case 'agent_unavailable':
        const agentName = state.agentConfig?.preferences?.displayName || 'Agent';
        voiceStatus.textContent = `⚠️ ${agentName} is currently unavailable`;
        voiceStatus.className = 'echoagent-voice-status unavailable';
        recordButtonSpan.textContent = 'Agent Busy';
        recordButton.className = 'echoagent-record-button unavailable';
        voiceButton.className = 'echoagent-voice-button unavailable';
        recordButton.disabled = true;
        
        // Add retry info if available
        if (state.agentStatus?.details?.troubleshooting) {
          const troubleshootingInfo = state.agentStatus.details.troubleshooting.join(', ');
          voiceStatus.title = `Issues: ${troubleshootingInfo}`;
        }
        return;
        
      case 'connecting':
        voiceStatus.textContent = '🔗 Connecting to agent...';
        voiceStatus.className = 'echoagent-voice-status connecting';
        recordButtonSpan.textContent = 'Connecting...';
        recordButton.className = 'echoagent-record-button connecting';
        voiceButton.className = 'echoagent-voice-button connecting';
        recordButton.disabled = true;
        return;
        
      case 'error':
        const errorMsg = state.lastError?.message || 'Connection failed';
        voiceStatus.textContent = `❌ ${errorMsg}`;
        voiceStatus.className = 'echoagent-voice-status error';
        recordButtonSpan.textContent = 'Error';
        recordButton.className = 'echoagent-record-button error';
        voiceButton.className = 'echoagent-voice-button error';
        recordButton.disabled = true;
        
        // Add error details in tooltip
        if (state.lastError?.details) {
          voiceStatus.title = `Error details: ${state.lastError.details}`;
        }
        return;
    }
    
    // Handle active call states (when connected)
    if (state.connectionState === 'connected') {
      if (state.isRecording) {
        voiceStatus.textContent = '🎤 Recording... Release to send';
        voiceStatus.className = 'echoagent-voice-status recording';
        recordButtonSpan.textContent = 'Recording...';
        recordButton.className = 'echoagent-record-button recording';
        voiceButton.className = 'echoagent-voice-button recording';
        recordButton.disabled = false;
      } else if (state.isProcessing) {
        voiceStatus.textContent = '⏳ Processing your message...';
        voiceStatus.className = 'echoagent-voice-status processing';
        recordButtonSpan.textContent = 'Processing...';
        recordButton.className = 'echoagent-record-button processing';
        voiceButton.className = 'echoagent-voice-button processing';
        recordButton.disabled = true;
      } else if (state.isPlaying) {
        voiceStatus.textContent = '🔊 Playing AI response...';
        voiceStatus.className = 'echoagent-voice-status playing';
        recordButtonSpan.textContent = 'Playing...';
        recordButton.className = 'echoagent-record-button playing';
        voiceButton.className = 'echoagent-voice-button playing';
        recordButton.disabled = true;
      } else {
        voiceStatus.textContent = '✅ Ready to record';
        voiceStatus.className = 'echoagent-voice-status ready';
        recordButtonSpan.textContent = 'Hold to Record';
        recordButton.className = 'echoagent-record-button ready';
        voiceButton.className = 'echoagent-voice-button connected';
        recordButton.disabled = false;
      }
      return;
    }
    
    // Default idle state (agent available, no active call)
    if (state.agentStatus?.available) {
      voiceStatus.textContent = '✅ Agent available - Ready to start';
      voiceStatus.className = 'echoagent-voice-status available';
      recordButtonSpan.textContent = 'Start Voice Call';
      recordButton.className = 'echoagent-record-button available';
      voiceButton.className = 'echoagent-voice-button available';
      recordButton.disabled = false;
    } else {
      // Unknown status or initial state
      voiceStatus.textContent = '🔄 Checking agent status...';
      voiceStatus.className = 'echoagent-voice-status checking';
      recordButtonSpan.textContent = 'Please wait...';
      recordButton.className = 'echoagent-record-button checking';
      voiceButton.className = 'echoagent-voice-button checking';
      recordButton.disabled = true;
    }
  }
  
  // Show error message
  function showError(message) {
    const voiceWindow = document.querySelector('.echoagent-voice-window');
    if (!voiceWindow) return;
    
    // Remove existing error
    const existingError = voiceWindow.querySelector('.echoagent-error');
    if (existingError) {
      existingError.remove();
    }
    
    const errorEl = document.createElement('div');
    errorEl.className = 'echoagent-error';
    errorEl.textContent = message;
    voiceWindow.appendChild(errorEl);
    
    setTimeout(() => {
      if (errorEl.parentNode) {
        errorEl.parentNode.removeChild(errorEl);
      }
    }, 5000);
  }
  
  // Setup event listeners
  function setupEventListeners(elements) {
    const {
      voiceButton,
      voiceWindow,
      recordButton,
      closeButton,
      contactForm,
      submitButton,
      voiceControls
    } = elements;
    
    // Toggle voice window
    voiceButton.addEventListener('click', () => {
      state.isOpen = !state.isOpen;
      voiceWindow.classList.toggle('open', state.isOpen);
    });
    
    // Close voice window
    closeButton.addEventListener('click', () => {
      state.isOpen = false;
      voiceWindow.classList.remove('open');
      
      // End voice call if active
      if (state.voiceCall) {
        endVoiceCall();
      }
    });
    
    // Handle contact form submission
    submitButton.addEventListener('click', async (e) => {
      e.preventDefault();
      
      const nameInput = contactForm.querySelector('#echoagent-name');
      const emailInput = contactForm.querySelector('#echoagent-email');
      const phoneInput = contactForm.querySelector('#echoagent-phone');
      
      const name = nameInput.value.trim();
      const email = emailInput.value.trim();
      const phone = phoneInput.value.trim();
      
      // Validate required fields
      if (!name || !email) {
        showError('Please fill in all required fields.');
        return;
      }
      
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        showError('Please enter a valid email address.');
        return;
      }
      
      try {
        submitButton.disabled = true;
        submitButton.textContent = 'Connecting...';
        
        // Store contact info
        storeContactInfo({ name, email, phone });
        
        // Start voice call
        await startVoiceCall();
        
        // Hide contact form and show voice controls
        contactForm.style.display = 'none';
        voiceControls.style.display = 'block';
        
        state.isContactInfoSubmitted = true;
        
      } catch (error) {
        console.error('Failed to start voice call:', error);
        showError('Failed to start voice call. Please try again.');
        submitButton.disabled = false;
        submitButton.textContent = 'Start Voice Call';
      }
    });
    
    // Record button - enhanced with agent detection
    recordButton.addEventListener('mousedown', async (e) => {
      e.preventDefault();
      
      // Handle different connection states
      if (state.connectionState === 'idle' && state.agentStatus?.available) {
        // If agent is available but no call started, start voice call first
        if (!state.voiceCall && state.isContactInfoSubmitted) {
          try {
            await startVoiceCall();
          } catch (error) {
            console.error('Failed to start voice call from record button:', error);
            return;
          }
        }
      } else if (state.connectionState === 'agent_unavailable') {
        // Try to check agent status again
        await checkAgentStatus();
        return;
      } else if (state.connectionState === 'error') {
        // Try to recover from error state
        state.connectionState = 'idle';
        await checkAgentStatus();
        return;
      }
      
      // Original recording logic (only if connected and ready)
      if (!state.isRecording && !state.isProcessing && !state.isPlaying && state.voiceCall && state.connectionState === 'connected') {
        startRecording();
      }
    });
    
    recordButton.addEventListener('mouseup', (e) => {
      e.preventDefault();
      if (state.isRecording) {
        stopRecording();
      }
    });
    
    recordButton.addEventListener('mouseleave', (e) => {
      e.preventDefault();
      if (state.isRecording) {
        stopRecording();
      }
    });
    
    // Touch support for mobile devices
    recordButton.addEventListener('touchstart', async (e) => {
      e.preventDefault();
      
      // Handle different connection states (same logic as mousedown)
      if (state.connectionState === 'idle' && state.agentStatus?.available) {
        if (!state.voiceCall && state.isContactInfoSubmitted) {
          try {
            await startVoiceCall();
          } catch (error) {
            console.error('Failed to start voice call from touch:', error);
            return;
          }
        }
      } else if (state.connectionState === 'agent_unavailable') {
        await checkAgentStatus();
        return;
      } else if (state.connectionState === 'error') {
        state.connectionState = 'idle';
        await checkAgentStatus();
        return;
      }
      
      // Original recording logic
      if (!state.isRecording && !state.isProcessing && !state.isPlaying && state.voiceCall && state.connectionState === 'connected') {
        startRecording();
      }
    });
    
    recordButton.addEventListener('touchend', (e) => {
      e.preventDefault();
      if (state.isRecording) {
        stopRecording();
      }
    });
    
    recordButton.addEventListener('touchcancel', (e) => {
      e.preventDefault();
      if (state.isRecording) {
        stopRecording();
      }
    });
  }
  
  // Initialize widget
  async function initWidget() {
    try {
      console.log('🚀 Initializing EchoAgent Voice Widget with comprehensive agent detection...');
      
      // Load agent configuration
      const agentConfig = await loadAgentConfig();
      if (!agentConfig) {
        console.error('❌ Failed to load agent configuration');
        return;
      }
      
      console.log('✅ Agent configuration loaded:', agentConfig.name);
      
      // Create widget DOM
      const elements = createWidgetDOM(agentConfig);
      
      // Start agent status monitoring immediately
      console.log('🔍 Starting agent status monitoring...');
      startAgentStatusMonitoring();
      
      // Check if contact info is required
      const requireContactInfo = agentConfig.preferences?.isContactRequired !== false;
      
      // For anonymous mode, still require explicit user action to start calls
      if (!requireContactInfo) {
        // Store anonymous contact info but don't auto-start calls
        storeContactInfo({
          name: 'Anonymous User',
          email: `anonymous-${Date.now()}@widget.voice`,
          phone: null
        });
        
        // Hide contact form and show voice controls in waiting mode
        elements.contactForm.style.display = 'none';
        elements.voiceControls.style.display = 'block';
        state.isContactInfoSubmitted = true;
        
        console.log('ℹ️ Anonymous mode - waiting for user to start call');
      }
      
      // Setup event listeners
      setupEventListeners(elements);
      
      // Add cleanup on page unload
      window.addEventListener('beforeunload', () => {
        stopAgentStatusMonitoring();
        if (state.voiceCall) {
          endVoiceCall();
        }
      });
      
      console.log('✅ EchoAgent Voice Widget initialized successfully with agent detection');
      
    } catch (error) {
      console.error('❌ Failed to initialize voice widget:', error);
      state.connectionState = 'error';
      state.lastError = {
        type: 'initialization_failed',
        message: 'Failed to initialize widget',
        details: error.message,
        timestamp: Date.now()
      };
    }
  }
  
  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWidget);
  } else {
    initWidget();
  }
  
})();