/**
 * EchoAgent Chat Widget (Chat Only)
 * A lightweight, embeddable text-only chat widget that can be added to any website.
 * 
 * Usage:
 * <script 
 *   src="https://your-domain.com/chat-only-widget.js" 
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
  
  // Widget state (text chat only)
  let state = {
    isOpen: false,
    isContactInfoSubmitted: false,
    contactId: null,
    conversationId: null,
    messages: [],
    agentConfig: null,
    isLoading: false
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

  // Send message
  async function sendMessage(content, role = 'user') {
    try {
      const response = await apiRequest(`/widget/agents/${agentId}/conversations/${state.conversationId}/messages`, {
        method: 'POST',
        body: {
          content,
          role,
          contactId: state.contactId
        }
      });
      return response;
    } catch (error) {
      console.error('Failed to send message:', error);
      throw error;
    }
  }
  
  // Create widget DOM structure (text only)
  function createWidgetDOM(agentConfig) {
    const displayName = agentConfig?.preferences?.displayName || agentConfig?.name || 'Chat Assistant';
    
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
        
        .echoagent-chat-button {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border: none;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          transition: all 0.3s ease;
        }
        
        .echoagent-chat-button:hover {
          transform: scale(1.1);
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.25);
        }
        
        .echoagent-chat-window {
          position: absolute;
          bottom: 80px;
          right: 0;
          width: 350px;
          max-width: calc(100vw - 40px);
          height: 500px;
          max-height: calc(100vh - 140px);
          background: white;
          border-radius: 12px;
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
          display: none;
          flex-direction: column;
          overflow: hidden;
          transform: scale(0.9);
          opacity: 0;
          transition: all 0.3s ease;
        }
        
        .echoagent-chat-window.open {
          display: flex;
          transform: scale(1);
          opacity: 1;
        }
        
        .echoagent-chat-header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        
        .echoagent-chat-header-title {
          font-weight: 600;
          font-size: 16px;
        }
        
        .echoagent-close-button {
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
        }
        
        .echoagent-chat-messages {
          flex: 1;
          padding: 16px;
          overflow-y: auto;
          background: #f8f9fa;
        }
        
        .echoagent-message {
          margin-bottom: 12px;
          padding: 8px 12px;
          border-radius: 8px;
          max-width: 80%;
          word-wrap: break-word;
        }
        
        .echoagent-message.user {
          background: #667eea;
          color: white;
          margin-left: auto;
          border-bottom-right-radius: 4px;
        }
        
        .echoagent-message.bot {
          background: white;
          color: #333;
          border-bottom-left-radius: 4px;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
        }
        
        .echoagent-contact-form {
          padding: 16px;
          background: white;
        }
        
        .echoagent-input-group {
          margin-bottom: 12px;
        }
        
        .echoagent-input-group label {
          display: block;
          margin-bottom: 4px;
          font-size: 14px;
          font-weight: 500;
          color: #333;
        }
        
        .echoagent-input-field {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-size: 14px;
          box-sizing: border-box;
        }
        
        .echoagent-input-field:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.2);
        }
        
        .echoagent-submit-button {
          width: 100%;
          background: #667eea;
          color: white;
          border: none;
          padding: 10px;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.2s ease;
        }
        
        .echoagent-submit-button:hover {
          background: #5a67d8;
        }
        
        .echoagent-submit-button:disabled {
          background: #a0aec0;
          cursor: not-allowed;
        }
        
        .echoagent-chat-input-container {
          padding: 16px;
          background: white;
          border-top: 1px solid #e2e8f0;
          display: flex;
          gap: 8px;
          align-items: flex-end;
        }
        
        .echoagent-chat-input {
          flex: 1;
          border: 1px solid #ddd;
          border-radius: 6px;
          padding: 8px 12px;
          font-size: 14px;
          resize: none;
          max-height: 100px;
          min-height: 36px;
          box-sizing: border-box;
        }
        
        .echoagent-chat-input:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.2);
        }
        
        .echoagent-send-button {
          background: #667eea;
          color: white;
          border: none;
          border-radius: 6px;
          width: 36px;
          height: 36px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.2s ease;
          flex-shrink: 0;
        }
        
        .echoagent-send-button:hover {
          background: #5a67d8;
        }
        
        .echoagent-send-button:disabled {
          background: #a0aec0;
          cursor: not-allowed;
        }
        
        .echoagent-typing-indicator {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 8px 12px;
          background: white;
          border-radius: 8px;
          margin-bottom: 12px;
          max-width: 80%;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
        }
        
        .echoagent-typing-dot {
          width: 6px;
          height: 6px;
          background: #999;
          border-radius: 50%;
          animation: echoagent-typing 1.4s infinite;
        }
        
        .echoagent-typing-dot:nth-child(2) { animation-delay: 0.2s; }
        .echoagent-typing-dot:nth-child(3) { animation-delay: 0.4s; }
        
        @keyframes echoagent-typing {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-10px); }
        }
        
        .echoagent-error {
          background: #fed7d7;
          color: #c53030;
          padding: 8px 12px;
          border-radius: 6px;
          margin-bottom: 12px;
          font-size: 14px;
        }
      </style>
    `;
    
    // Create chat button
    const chatButton = document.createElement('button');
    chatButton.className = 'echoagent-chat-button';
    chatButton.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
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
    
    // Create chat input container (text only)
    const chatInputContainer = document.createElement('div');
    chatInputContainer.className = 'echoagent-chat-input-container';
    chatInputContainer.style.display = 'none';
    chatInputContainer.innerHTML = `
      <textarea class="echoagent-chat-input" placeholder="Type your message..."></textarea>
      <button class="echoagent-send-button">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="22" y1="2" x2="11" y2="13"></line>
          <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
        </svg>
      </button>
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
      submitButton: contactForm.querySelector('.echoagent-submit-button')
    };
  }
  
  // Add message to UI
  function addMessageToUI(content, role, messagesContainer) {
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
    typingEl.innerHTML = `
      <div class="echoagent-typing-dot"></div>
      <div class="echoagent-typing-dot"></div>
      <div class="echoagent-typing-dot"></div>
    `;
    messagesContainer.appendChild(typingEl);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    return typingEl;
  }
  
  // Show error message
  function showError(message, container) {
    const errorEl = document.createElement('div');
    errorEl.className = 'echoagent-error';
    errorEl.textContent = message;
    
    const messagesContainer = container.querySelector('.echoagent-chat-messages');
    if (messagesContainer) {
      messagesContainer.appendChild(errorEl);
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
      
      setTimeout(() => {
        if (errorEl.parentNode) {
          errorEl.parentNode.removeChild(errorEl);
        }
      }, 5000);
    }
  }
  
  // Handle message submission
  async function handleMessageSubmit(content, elements) {
    const { chatInput, sendButton, messagesContainer } = elements;
    
    if (!content.trim() || state.isLoading) return;
    
    state.isLoading = true;
    sendButton.disabled = true;
    chatInput.disabled = true;
    
    // Add user message to UI
    addMessageToUI(content, 'user', messagesContainer);
    
    // Clear input
    chatInput.value = '';
    chatInput.style.height = 'auto';
    
    // Show typing indicator
    const typingIndicator = showTypingIndicator(messagesContainer);
    
    try {
      // Send message to backend
      const response = await sendMessage(content);
      
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
      chatInputContainer
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
      
      console.log('EchoAgent Chat-Only Widget initialized successfully');
      
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