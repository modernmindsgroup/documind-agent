/**
 * EchoAgent Chat Widget
 * A lightweight, embeddable chat widget that can be added to any website.
 * 
 * Usage:
 * <script 
 *   src="https://your-domain.com/chat-widget.js" 
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
    console.error('EchoAgent Chat: Missing agent ID. Add data-agent-id attribute to the script tag.');
    return;
  }
  
  // Widget state
  let state = {
    isOpen: false,
    isContactInfoSubmitted: false,
    contactId: null,
    conversationId: null,
    messages: [],
    agentConfig: null,
    isLoading: false,
    // Voice call state
    isVoiceMode: false,
    voiceCall: null,
    isRecording: false,
    isProcessing: false,
    isPlaying: false,
    mediaRecorder: null,
    recordedChunks: [],
    websocket: null,
    roomId: null,
    callId: null
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
  
  // Create or get contact
  async function createContact(contactInfo) {
    try {
      const contact = await apiRequest(`/widget/agents/${agentId}/contacts`, {
        method: 'POST',
        body: contactInfo
      });
      state.contactId = contact.id;
      return contact;
    } catch (error) {
      console.error('Failed to create contact:', error);
      throw error;
    }
  }
  
  // Start conversation
  async function startConversation() {
    try {
      const conversation = await apiRequest(`/widget/agents/${agentId}/conversations`, {
        method: 'POST',
        body: {
          contactId: state.contactId,
          title: 'Widget Chat'
        }
      });
      state.conversationId = conversation.id;
      return conversation;
    } catch (error) {
      console.error('Failed to start conversation:', error);
      throw error;
    }
  }

  // Voice call functions
  async function startVoiceCall() {
    try {
      console.log('Starting voice call for agent:', agentId);
      
      // Start the voice call
      const callData = await apiRequest(`/widget/agents/${agentId}/voice/start`, {
        method: 'POST',
        body: {
          contactId: state.contactId,
          conversationId: state.conversationId
        }
      });
      
      console.log('Voice call started');
      state.voiceCall = callData;
      state.roomId = callData.roomId;
      state.callId = callData.callId;
      
      // Connect to WebSocket for real-time communication
      await connectToVoiceWebSocket(callData.token);
      
      return callData;
    } catch (error) {
      console.error('Failed to start voice call:', error);
      throw error;
    }
  }

  async function endVoiceCall() {
    try {
      if (state.callId) {
        console.log('Ending voice call:', state.callId);
        
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
        state.isVoiceMode = false;
        state.isRecording = false;
        state.isProcessing = false;
        state.isPlaying = false;
        
        console.log('Voice call ended successfully');
      }
    } catch (error) {
      console.error('Failed to end voice call:', error);
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
      state.websocket = new WebSocket(wsUrl, [`Bearer.${token}`]);
      
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
      case 'audio_response':
        // Play AI audio response
        if (message.audioData) {
          playAudioResponse(message.audioData);
        }
        break;
        
      case 'transcription':
        // Display user speech transcription
        if (message.text) {
          const container = document.querySelector('.echoagent-widget-container');
          const messagesContainer = container?.querySelector('.echoagent-chat-messages');
          if (messagesContainer) {
            addMessageToUI(message.text, 'user', messagesContainer);
          }
        }
        break;
        
      case 'ai_response':
        // Display AI text response
        if (message.text) {
          const container = document.querySelector('.echoagent-widget-container');
          const messagesContainer = container?.querySelector('.echoagent-chat-messages');
          if (messagesContainer) {
            addMessageToUI(message.text, 'bot', messagesContainer);
          }
        }
        break;
        
      case 'call_status':
        console.log('Call status update:', message.status);
        if (message.status === 'ended') {
          // Call ended by server, switch back to text mode
          const container = document.querySelector('.echoagent-widget-container');
          if (container) {
            const inputControls = container.querySelector('.echoagent-input-controls');
            const voiceControls = container.querySelector('.echoagent-voice-controls');
            const chatInput = container.querySelector('.echoagent-chat-input');
            
            if (inputControls && voiceControls && chatInput) {
              inputControls.style.display = 'flex';
              voiceControls.style.display = 'none';
              state.isVoiceMode = false;
              chatInput.focus();
            }
          }
          
          // Reset voice call state
          state.voiceCall = null;
          state.callId = null;
          state.roomId = null;
          state.isRecording = false;
          state.isProcessing = false;
          state.isPlaying = false;
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
  
  // Send message
  async function sendMessage(content, role = 'user') {
    try {
      const message = await apiRequest(`/widget/conversations/${state.conversationId}/messages`, {
        method: 'POST',
        body: {
          content,
          role
        }
      });
      
      return message;
    } catch (error) {
      console.error('Failed to send message:', error);
      throw error;
    }
  }
  
  // Create widget DOM and styles
  function createWidgetDOM(agentConfig) {
    // Extract colors from agent preferences or use defaults
    const primaryColor = agentConfig?.preferences?.widgetTheme?.primaryColor || '#2563eb';
    const secondaryColor = agentConfig?.preferences?.widgetTheme?.secondaryColor || '#1d4ed8';
    const displayName = agentConfig?.preferences?.displayName || 'Chat with us';
    
    // Add CSS with customizable theme
    const styleTag = document.createElement('style');
    styleTag.innerHTML = `
      .echoagent-widget-container * {
        box-sizing: border-box;
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      }
      
      .echoagent-widget-container {
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 9999;
        display: flex;
        flex-direction: column;
        align-items: flex-end;
      }
      
      .echoagent-chat-button {
        width: 60px;
        height: 60px;
        border-radius: 50%;
        background-color: ${primaryColor};
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        transition: all 0.2s ease;
        border: none;
      }
      
      .echoagent-chat-button:hover {
        transform: scale(1.05);
        box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
        background-color: ${secondaryColor};
      }
      
      .echoagent-chat-icon {
        width: 28px;
        height: 28px;
      }
      
      .echoagent-chat-window {
        position: absolute;
        bottom: 80px;
        right: 0;
        width: 350px;
        height: 500px;
        background: white;
        border-radius: 12px;
        box-shadow: 0 5px 25px rgba(0, 0, 0, 0.15);
        display: flex;
        flex-direction: column;
        overflow: hidden;
        transition: all 0.3s ease;
        opacity: 0;
        transform: translateY(20px) scale(0.9);
        pointer-events: none;
      }
      
      .echoagent-chat-window.open {
        opacity: 1;
        transform: translateY(0) scale(1);
        pointer-events: all;
      }
      
      .echoagent-chat-header {
        background-color: ${primaryColor};
        color: white;
        padding: 16px;
        font-weight: 600;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      
      .echoagent-chat-header-title {
        font-size: 16px;
      }
      
      .echoagent-close-button {
        background: none;
        border: none;
        color: white;
        cursor: pointer;
        font-size: 20px;
        padding: 0;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .echoagent-chat-messages {
        flex: 1;
        padding: 16px;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 12px;
        background-color: #f9fafb;
      }
      
      .echoagent-message {
        max-width: 80%;
        padding: 10px 14px;
        border-radius: 16px;
        font-size: 14px;
        line-height: 1.4;
        word-wrap: break-word;
      }
      
      .echoagent-message.user {
        align-self: flex-end;
        background-color: ${primaryColor};
        color: white;
        border-bottom-right-radius: 4px;
      }
      
      .echoagent-message.bot {
        align-self: flex-start;
        background-color: white;
        color: #1f2937;
        border-bottom-left-radius: 4px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      }
      
      .echoagent-typing-indicator {
        display: flex;
        padding: 10px 14px;
        background-color: white;
        border-radius: 16px;
        border-bottom-left-radius: 4px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        align-self: flex-start;
        width: 60px;
      }
      
      .echoagent-typing-indicator span {
        height: 8px;
        width: 8px;
        background-color: #e5e7eb;
        border-radius: 50%;
        display: inline-block;
        margin-right: 4px;
        animation: echoagent-bounce 1.3s linear infinite;
      }
      
      .echoagent-typing-indicator span:nth-child(2) {
        animation-delay: 0.15s;
      }
      
      .echoagent-typing-indicator span:nth-child(3) {
        animation-delay: 0.3s;
        margin-right: 0;
      }
      
      @keyframes echoagent-bounce {
        0%, 60%, 100% {
          transform: translateY(0);
        }
        30% {
          transform: translateY(-4px);
        }
      }
      
      .echoagent-contact-form {
        padding: 20px;
        display: flex;
        flex-direction: column;
        gap: 12px;
        background-color: white;
      }
      
      .echoagent-input-group {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      
      .echoagent-input-group label {
        font-size: 13px;
        color: #4b5563;
        font-weight: 500;
      }
      
      .echoagent-input-field {
        padding: 10px 12px;
        border-radius: 6px;
        border: 1px solid #d1d5db;
        font-size: 14px;
        transition: border-color 0.2s;
      }
      
      .echoagent-input-field:focus {
        border-color: ${primaryColor};
        outline: none;
      }
      
      .echoagent-submit-button {
        background-color: ${primaryColor};
        color: white;
        border: none;
        border-radius: 6px;
        padding: 10px 16px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: background-color 0.2s;
        margin-top: 8px;
      }
      
      .echoagent-submit-button:hover {
        background-color: ${secondaryColor};
      }
      
      .echoagent-submit-button:disabled {
        background-color: #93c5fd;
        cursor: not-allowed;
      }
      
      .echoagent-chat-input-container {
        display: flex;
        padding: 12px;
        border-top: 1px solid #e5e7eb;
        background-color: white;
      }
      
      .echoagent-chat-input {
        flex: 1;
        padding: 10px 14px;
        border-radius: 20px;
        border: 1px solid #d1d5db;
        font-size: 14px;
        resize: none;
        height: 40px;
        max-height: 120px;
        overflow-y: auto;
      }
      
      .echoagent-chat-input:focus {
        outline: none;
        border-color: ${primaryColor};
      }
      
      .echoagent-send-button {
        background-color: ${primaryColor};
        color: white;
        border: none;
        border-radius: 50%;
        width: 40px;
        height: 40px;
        margin-left: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: background-color 0.2s;
      }
      
      .echoagent-send-button:hover {
        background-color: ${secondaryColor};
      }
      
      .echoagent-send-button:disabled {
        background-color: #93c5fd;
        cursor: not-allowed;
      }
      
      .echoagent-error-message {
        background-color: #fee2e2;
        border: 1px solid #fecaca;
        color: #b91c1c;
        padding: 8px 12px;
        border-radius: 6px;
        font-size: 14px;
        margin: 8px 16px;
      }
      
      /* Voice Control Styles */
      .echoagent-input-controls {
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: 8px;
        width: 100%;
      }
      
      .echoagent-voice-controls {
        display: none;
        flex-direction: column;
        align-items: center;
        gap: 12px;
        width: 100%;
        padding: 8px 0;
      }
      
      .echoagent-voice-status {
        font-size: 14px;
        color: #6b7280;
        font-weight: 500;
        text-align: center;
      }
      
      .echoagent-voice-status.recording {
        color: #dc2626;
        animation: echoagent-pulse 1s infinite;
      }
      
      .echoagent-voice-status.processing {
        color: #2563eb;
      }
      
      .echoagent-voice-status.playing {
        color: #059669;
      }
      
      .echoagent-voice-status.ready {
        color: #6b7280;
      }
      
      @keyframes echoagent-pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.6; }
      }
      
      .echoagent-record-button {
        background-color: ${primaryColor};
        color: white;
        border: none;
        border-radius: 50%;
        width: 60px;
        height: 60px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.2s ease;
        font-size: 12px;
        gap: 4px;
        user-select: none;
      }
      
      .echoagent-record-button:hover {
        background-color: ${secondaryColor};
        transform: scale(1.05);
      }
      
      .echoagent-record-button.recording {
        background-color: #dc2626;
        animation: echoagent-pulse 1s infinite;
      }
      
      .echoagent-record-button.processing {
        background-color: #9ca3af;
        cursor: not-allowed;
      }
      
      .echoagent-record-button.playing {
        background-color: #059669;
        cursor: not-allowed;
      }
      
      .echoagent-record-button:disabled {
        background-color: #9ca3af;
        cursor: not-allowed;
        transform: none;
      }
      
      .echoagent-record-button svg {
        width: 20px;
        height: 20px;
      }
      
      .echoagent-record-button span {
        font-size: 10px;
        font-weight: 500;
        margin-top: 2px;
      }
      
      .echoagent-voice-toggle,
      .echoagent-text-toggle {
        background-color: #f3f4f6;
        color: #6b7280;
        border: none;
        border-radius: 50%;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.2s ease;
        flex-shrink: 0;
      }
      
      .echoagent-voice-toggle:hover,
      .echoagent-text-toggle:hover {
        background-color: #e5e7eb;
        color: #374151;
      }
      
      .echoagent-voice-toggle svg,
      .echoagent-text-toggle svg {
        width: 16px;
        height: 16px;
      }
    `;
    document.head.appendChild(styleTag);
    
    // Create container
    const container = document.createElement('div');
    container.className = 'echoagent-widget-container';
    
    // Create chat button
    const chatButton = document.createElement('button');
    chatButton.className = 'echoagent-chat-button';
    chatButton.innerHTML = `
      <svg class="echoagent-chat-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
      </svg>
    `;
    
    // Create chat window
    const chatWindow = document.createElement('div');
    chatWindow.className = 'echoagent-chat-window';
    
    // Create chat header
    const chatHeader = document.createElement('div');
    chatHeader.className = 'echoagent-chat-header';
    chatHeader.innerHTML = `
      <div class="echoagent-chat-header-title">${displayName}</div>
      <button class="echoagent-close-button">&times;</button>
    `;
    
    // Create messages container
    const messagesContainer = document.createElement('div');
    messagesContainer.className = 'echoagent-chat-messages';
    
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
      <button class="echoagent-submit-button">Continue</button>
    `;
    
    // Create chat input container
    const chatInputContainer = document.createElement('div');
    chatInputContainer.className = 'echoagent-chat-input-container';
    chatInputContainer.style.display = 'none';
    chatInputContainer.innerHTML = `
      <div class="echoagent-input-controls">
        <button class="echoagent-voice-toggle" title="Switch to voice mode">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
            <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
            <line x1="12" y1="19" x2="12" y2="23"></line>
            <line x1="8" y1="23" x2="16" y2="23"></line>
          </svg>
        </button>
        <textarea class="echoagent-chat-input" placeholder="Type your message..."></textarea>
        <button class="echoagent-send-button">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"></line>
            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
          </svg>
        </button>
      </div>
      <div class="echoagent-voice-controls" style="display: none;">
        <div class="echoagent-voice-status">Ready to record</div>
        <div style="display: flex; align-items: center; gap: 12px;">
          <button class="echoagent-record-button">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
              <line x1="12" y1="19" x2="12" y2="23"></line>
              <line x1="8" y1="23" x2="16" y2="23"></line>
            </svg>
            <span>Hold to Record</span>
          </button>
          <button class="echoagent-text-toggle" title="Switch to text mode">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14,2 14,8 20,8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10,9 9,9 8,9"></polyline>
            </svg>
          </button>
        </div>
      </div>
    `;
    
    // Append elements to chat window
    chatWindow.appendChild(chatHeader);
    chatWindow.appendChild(messagesContainer);
    chatWindow.appendChild(contactForm);
    chatWindow.appendChild(chatInputContainer);
    
    // Append elements to container
    container.appendChild(chatWindow);
    container.appendChild(chatButton);
    
    // Append container to body
    document.body.appendChild(container);
    
    return {
      container,
      chatButton,
      chatWindow,
      messagesContainer,
      contactForm,
      chatInputContainer,
      chatInput: chatInputContainer.querySelector('.echoagent-chat-input'),
      sendButton: chatInputContainer.querySelector('.echoagent-send-button'),
      closeButton: chatHeader.querySelector('.echoagent-close-button'),
      submitButton: contactForm.querySelector('.echoagent-submit-button'),
      // Voice control elements
      voiceToggle: chatInputContainer.querySelector('.echoagent-voice-toggle'),
      textToggle: chatInputContainer.querySelector('.echoagent-text-toggle'),
      recordButton: chatInputContainer.querySelector('.echoagent-record-button'),
      voiceStatus: chatInputContainer.querySelector('.echoagent-voice-status'),
      inputControls: chatInputContainer.querySelector('.echoagent-input-controls'),
      voiceControls: chatInputContainer.querySelector('.echoagent-voice-controls')
    };
  }
  
  // Voice UI update function
  function updateVoiceUI() {
    const container = document.querySelector('.echoagent-widget-container');
    if (!container) return;
    
    const voiceStatus = container.querySelector('.echoagent-voice-status');
    const recordButton = container.querySelector('.echoagent-record-button');
    const recordButtonSpan = recordButton?.querySelector('span');
    
    if (!voiceStatus || !recordButton || !recordButtonSpan) return;
    
    // Update based on current voice state
    if (state.isRecording) {
      voiceStatus.textContent = 'Recording... Release to send';
      voiceStatus.className = 'echoagent-voice-status recording';
      recordButtonSpan.textContent = 'Recording...';
      recordButton.className = 'echoagent-record-button recording';
    } else if (state.isProcessing) {
      voiceStatus.textContent = 'Processing your message...';
      voiceStatus.className = 'echoagent-voice-status processing';
      recordButtonSpan.textContent = 'Processing...';
      recordButton.className = 'echoagent-record-button processing';
      recordButton.disabled = true;
    } else if (state.isPlaying) {
      voiceStatus.textContent = 'Playing AI response...';
      voiceStatus.className = 'echoagent-voice-status playing';
      recordButtonSpan.textContent = 'Playing...';
      recordButton.className = 'echoagent-record-button playing';
      recordButton.disabled = true;
    } else {
      voiceStatus.textContent = 'Ready to record';
      voiceStatus.className = 'echoagent-voice-status ready';
      recordButtonSpan.textContent = 'Hold to Record';
      recordButton.className = 'echoagent-record-button ready';
      recordButton.disabled = false;
    }
  }

  // Toggle between text and voice modes
  async function toggleVoiceMode(elements) {
    try {
      if (!state.isVoiceMode) {
        // Switch to voice mode
        console.log('Switching to voice mode');
        
        // Start voice call if not already started
        if (!state.voiceCall && state.contactId && state.conversationId) {
          await startVoiceCall();
        }
        
        // Show voice controls, hide text input
        elements.inputControls.style.display = 'none';
        elements.voiceControls.style.display = 'flex';
        state.isVoiceMode = true;
        
        updateVoiceUI();
        
      } else {
        // Switch to text mode
        console.log('Switching to text mode');
        
        // End voice call if active
        if (state.voiceCall) {
          await endVoiceCall();
        }
        
        // Show text input, hide voice controls
        elements.inputControls.style.display = 'flex';
        elements.voiceControls.style.display = 'none';
        state.isVoiceMode = false;
        
        // Focus on text input
        elements.chatInput.focus();
      }
    } catch (error) {
      console.error('Failed to toggle voice mode:', error);
      showError('Failed to switch voice mode. Please try again.');
    }
  }

  // Add message to UI
  function addMessageToUI(content, role, messagesContainer) {
    // Use the provided messagesContainer or find it
    const messageContainer = messagesContainer || document.querySelector('.echoagent-chat-messages');
    if (!messageContainer) return;
    
    const messageEl = document.createElement('div');
    messageEl.className = `echoagent-message ${role}`;
    messageEl.textContent = content;
    messageContainer.appendChild(messageEl);
    messageContainer.scrollTop = messageContainer.scrollHeight;
  }
  
  // Show typing indicator
  function showTypingIndicator(messagesContainer) {
    const typingEl = document.createElement('div');
    typingEl.className = 'echoagent-typing-indicator';
    typingEl.innerHTML = '<span></span><span></span><span></span>';
    messagesContainer.appendChild(typingEl);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    return typingEl;
  }
  
  // Show error message
  function showError(message, chatWindow) {
    const errorEl = document.createElement('div');
    errorEl.className = 'echoagent-error-message';
    errorEl.textContent = message;
    chatWindow.appendChild(errorEl);
    
    // Remove error after 5 seconds
    setTimeout(() => {
      if (errorEl.parentNode) {
        errorEl.parentNode.removeChild(errorEl);
      }
    }, 5000);
  }
  
  // Handle message submission
  async function handleMessageSubmit(content, elements) {
    if (!content.trim() || state.isLoading) return;
    
    const { messagesContainer, chatInput, sendButton } = elements;
    
    state.isLoading = true;
    sendButton.disabled = true;
    chatInput.disabled = true;
    
    try {
      // Add user message to UI
      addMessageToUI(content, 'user', messagesContainer);
      chatInput.value = '';
      
      // Show typing indicator
      const typingIndicator = showTypingIndicator(messagesContainer);
      
      // Send message to API
      await sendMessage(content, 'user');
      
      // Get AI response
      const response = await apiRequest(`/widget/conversations/${state.conversationId}/chat`, {
        method: 'POST',
        body: { message: content }
      });
      
      // Remove typing indicator
      if (typingIndicator.parentNode) {
        typingIndicator.parentNode.removeChild(typingIndicator);
      }
      
      // Add bot response to UI
      addMessageToUI(response.message, 'bot', messagesContainer);
      
    } catch (error) {
      console.error('Failed to send message:', error);
      showError('Failed to send message. Please try again.', elements.chatWindow);
      
      // Remove typing indicator on error
      const typingIndicator = messagesContainer.querySelector('.echoagent-typing-indicator');
      if (typingIndicator && typingIndicator.parentNode) {
        typingIndicator.parentNode.removeChild(typingIndicator);
      }
    } finally {
      state.isLoading = false;
      sendButton.disabled = false;
      chatInput.disabled = false;
      chatInput.focus();
    }
  }
  
  // Setup event listeners
  function setupEventListeners(elements) {
    const {
      chatButton,
      chatWindow,
      chatInput,
      sendButton,
      closeButton,
      contactForm,
      submitButton,
      messagesContainer,
      chatInputContainer,
      voiceToggle,
      textToggle,
      recordButton
    } = elements;
    
    // Toggle chat window
    chatButton.addEventListener('click', () => {
      state.isOpen = !state.isOpen;
      chatWindow.classList.toggle('open', state.isOpen);
    });
    
    // Close chat window
    closeButton.addEventListener('click', () => {
      state.isOpen = false;
      chatWindow.classList.remove('open');
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
        showError('Please fill in all required fields.', chatWindow);
        return;
      }
      
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        showError('Please enter a valid email address.', chatWindow);
        return;
      }
      
      try {
        submitButton.disabled = true;
        submitButton.textContent = 'Connecting...';
        
        // Create contact
        await createContact({ name, email, phone });
        
        // Start conversation
        await startConversation();
        
        // Hide contact form and show chat interface
        contactForm.style.display = 'none';
        chatInputContainer.style.display = 'flex';
        
        // Add initial bot message
        addMessageToUI('Hi there! How can I help you today?', 'bot', messagesContainer);
        
        // Focus on chat input
        chatInput.focus();
        
        state.isContactInfoSubmitted = true;
        
      } catch (error) {
        console.error('Failed to submit contact info:', error);
        showError('Failed to start chat. Please try again.', chatWindow);
        submitButton.disabled = false;
        submitButton.textContent = 'Continue';
      }
    });
    
    // Handle message submission
    sendButton.addEventListener('click', () => {
      handleMessageSubmit(chatInput.value, elements);
    });
    
    // Handle enter key in chat input
    chatInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleMessageSubmit(chatInput.value, elements);
      }
    });
    
    // Auto-resize textarea
    chatInput.addEventListener('input', () => {
      chatInput.style.height = 'auto';
      chatInput.style.height = Math.min(chatInput.scrollHeight, 120) + 'px';
    });
    
    // Voice mode toggle (text to voice)
    voiceToggle.addEventListener('click', () => {
      toggleVoiceMode(elements);
    });
    
    // Text mode toggle (voice to text)
    textToggle.addEventListener('click', () => {
      toggleVoiceMode(elements);
    });
    
    // Record button - press and hold to record
    recordButton.addEventListener('mousedown', (e) => {
      e.preventDefault();
      if (!state.isRecording && !state.isProcessing && !state.isPlaying) {
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
    recordButton.addEventListener('touchstart', (e) => {
      e.preventDefault();
      if (!state.isRecording && !state.isProcessing && !state.isPlaying) {
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
      // Load agent configuration
      const agentConfig = await loadAgentConfig();
      if (!agentConfig) {
        console.error('Failed to load agent configuration');
        return;
      }
      
      // Check if contact info is required
      const requireContactInfo = agentConfig.preferences?.isContactRequired !== false;
      
      // Create widget DOM
      const elements = createWidgetDOM(agentConfig);
      
      // If contact info is not required, skip contact form
      if (!requireContactInfo) {
        try {
          // Create anonymous contact
          await createContact({
            name: 'Anonymous User',
            email: `anonymous-${Date.now()}@widget.chat`,
            phone: null
          });
          
          // Start conversation
          await startConversation();
          
          // Hide contact form and show chat interface
          elements.contactForm.style.display = 'none';
          elements.chatInputContainer.style.display = 'flex';
          
          // Add initial bot message
          addMessageToUI('Hi there! How can I help you today?', 'bot', elements.messagesContainer);
          
          state.isContactInfoSubmitted = true;
          
        } catch (error) {
          console.error('Failed to create anonymous session:', error);
          // Fall back to showing contact form
        }
      }
      
      // Setup event listeners
      setupEventListeners(elements);
      
      console.log('EchoAgent Chat Widget initialized successfully');
      
    } catch (error) {
      console.error('Failed to initialize widget:', error);
    }
  }
  
  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWidget);
  } else {
    initWidget();
  }
  
})();