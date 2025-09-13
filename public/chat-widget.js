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
      
      .echoagent-input-controls {
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: 8px;
        width: 100%;
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
        <textarea class="echoagent-chat-input" placeholder="Type your message..."></textarea>
        <button class="echoagent-send-button">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"></line>
            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
          </svg>
        </button>
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
      inputControls: chatInputContainer.querySelector('.echoagent-input-controls')
    };
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