// ================= AI Chatbot System with Groq =================

class ZaikaChatbot {
    constructor() {
        this.apiKey = process.env.GROQ_API_KEY;
        this.apiUrl = 'https://api.groq.com/openai/v1/chat/completions';
        this.conversationHistory = [];
        this.isOpen = false;
        this.suggestionsEnabled = localStorage.getItem('chatbotSuggestions') !== 'false';
        this.suggestionTimer = null;
        this.lastInteractionTime = Date.now();
        this.suggestionMessages = [
            "👋 Need help finding a recipe? I'm here!",
            "🍳 Want some cooking tips? Just ask!",
            "🥘 Looking for meal ideas? Let's chat!",
            "💡 I can help you with ingredient substitutions!",
            "🎯 Need a quick dinner recipe? I've got you covered!",
            "🌟 Ask me about any cuisine or cooking technique!",
            "🍰 Craving something sweet? Let me suggest desserts!",
            "🥗 Want healthy meal ideas? I'm here to help!"
        ];
        this.init();
    }

    init() {
        this.createChatbotUI();
        this.attachEventListeners();
        this.startSuggestionTimer();
    }

    createChatbotUI() {
        const chatbotHTML = `
            <!-- Floating Chat Button -->
            <button class="chatbot-float-btn" id="chatbot-toggle">
                <img src="images/enchanted-apple.png" 
                     alt="Enchanted Apple" 
                     class="enchanted-apple-img">
                <svg class="close-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
                <span class="chatbot-badge">AI</span>
                <div class="suggestion-bubble" id="suggestion-bubble"></div>
            </button>

            <!-- Chatbot Window -->
            <div class="chatbot-window" id="chatbot-window">
                <div class="chatbot-header">
                    <div class="chatbot-header-info">
                        <div class="chatbot-avatar">
                            <img src="images/enchanted-apple.png" 
                                 alt="Enchanted Apple" 
                                 class="apple-icon-small">
                        </div>
                        <div class="chatbot-header-text">
                            <h3>ZaikaBot</h3>
                            <span class="chatbot-status">
                                <span class="status-dot"></span>
                                Online
                            </span>
                        </div>
                    </div>
                    <div class="chatbot-header-actions">
                        <button class="chatbot-settings-btn" id="chatbot-settings" title="Settings">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="12" cy="12" r="3"></circle>
                                <path d="M12 1v6m0 6v6m9-9h-6m-6 0H3"></path>
                            </svg>
                        </button>
                        <button class="chatbot-minimize" id="chatbot-minimize">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="5" y1="12" x2="19" y2="12"></line>
                            </svg>
                        </button>
                    </div>
                </div>

                <div class="chatbot-messages" id="chatbot-messages">
                    <div class="chatbot-message bot-message">
                        <div class="message-avatar">
                            <img src="images/enchanted-apple.png" 
                                 alt="Enchanted Apple" 
                                 class="apple-icon-tiny">
                        </div>
                        <div class="message-content">
                            <p>Hi! I'm ZaikaBot, your magical cooking assistant! ✨</p>
                            <p>I can help you with:</p>
                            <ul>
                                <li>🍳 Recipe recommendations</li>
                                <li>🥘 Cooking tips and techniques</li>
                                <li>🔍 Finding recipes by ingredients</li>
                                <li>📝 Meal planning suggestions</li>
                                <li>❓ Any cooking questions!</li>
                            </ul>
                            <p>What would you like to know?</p>
                        </div>
                    </div>
                </div>

                <div class="chatbot-quick-actions">
                    <button class="quick-action-btn" data-message="Suggest a quick dinner recipe">
                        🍽️ Quick Dinner
                    </button>
                    <button class="quick-action-btn" data-message="What's a healthy breakfast idea?">
                        🥗 Healthy Breakfast
                    </button>
                    <button class="quick-action-btn" data-message="Give me a dessert recipe">
                        🍰 Dessert Ideas
                    </button>
                </div>

                <div class="chatbot-input-area">
                    <textarea 
                        class="chatbot-input" 
                        id="chatbot-input" 
                        placeholder="Ask me anything about cooking..."
                        rows="1"
                    ></textarea>
                    <button class="chatbot-send-btn" id="chatbot-send">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="22" y1="2" x2="11" y2="13"></line>
                            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                        </svg>
                    </button>
                </div>

                <div class="chatbot-footer">
                    <small>Powered by Groq AI • ZaikaBox</small>
                </div>
            </div>

            <!-- Settings Modal -->
            <div class="chatbot-settings-modal" id="chatbot-settings-modal">
                <div class="settings-modal-content">
                    <div class="settings-header">
                        <h3>⚙️ Chatbot Settings</h3>
                        <button class="settings-close" id="settings-close">&times;</button>
                    </div>
                    <div class="settings-body">
                        <div class="setting-item">
                            <div class="setting-info">
                                <h4>💬 Suggestion Messages</h4>
                                <p>Show helpful suggestions when you're not using the chatbot</p>
                            </div>
                            <label class="toggle-switch">
                                <input type="checkbox" id="suggestions-toggle" ${this.suggestionsEnabled ? 'checked' : ''}>
                                <span class="toggle-slider"></span>
                            </label>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', chatbotHTML);
    }

    attachEventListeners() {
        const toggleBtn = document.getElementById('chatbot-toggle');
        const minimizeBtn = document.getElementById('chatbot-minimize');
        const sendBtn = document.getElementById('chatbot-send');
        const input = document.getElementById('chatbot-input');
        const quickActionBtns = document.querySelectorAll('.quick-action-btn');
        const settingsBtn = document.getElementById('chatbot-settings');
        const settingsModal = document.getElementById('chatbot-settings-modal');
        const settingsClose = document.getElementById('settings-close');
        const suggestionsToggle = document.getElementById('suggestions-toggle');

        toggleBtn.addEventListener('click', () => this.toggleChat());
        minimizeBtn.addEventListener('click', () => this.toggleChat());
        sendBtn.addEventListener('click', () => this.sendMessage());
        
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // Track user interaction
        input.addEventListener('input', () => {
            this.lastInteractionTime = Date.now();
            this.hideSuggestionBubble();
        });

        // Auto-resize textarea
        input.addEventListener('input', () => {
            input.style.height = 'auto';
            input.style.height = Math.min(input.scrollHeight, 120) + 'px';
        });

        // Quick action buttons
        quickActionBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const message = btn.dataset.message;
                input.value = message;
                this.sendMessage();
            });
        });

        // Settings button
        settingsBtn.addEventListener('click', () => {
            settingsModal.classList.add('show');
        });

        settingsClose.addEventListener('click', () => {
            settingsModal.classList.remove('show');
        });

        settingsModal.addEventListener('click', (e) => {
            if (e.target === settingsModal) {
                settingsModal.classList.remove('show');
            }
        });

        // Suggestions toggle
        suggestionsToggle.addEventListener('change', (e) => {
            this.suggestionsEnabled = e.target.checked;
            localStorage.setItem('chatbotSuggestions', this.suggestionsEnabled);
            
            if (!this.suggestionsEnabled) {
                this.hideSuggestionBubble();
                clearTimeout(this.suggestionTimer);
            } else {
                this.startSuggestionTimer();
            }
        });
    }

    toggleChat() {
        this.isOpen = !this.isOpen;
        const window = document.getElementById('chatbot-window');
        const toggleBtn = document.getElementById('chatbot-toggle');
        
        if (this.isOpen) {
            window.classList.add('open');
            toggleBtn.classList.add('active');
            document.getElementById('chatbot-input').focus();
            this.hideSuggestionBubble();
            this.lastInteractionTime = Date.now();
        } else {
            window.classList.remove('open');
            toggleBtn.classList.remove('active');
        }
    }

    startSuggestionTimer() {
        if (!this.suggestionsEnabled) return;
        
        const checkAndShowSuggestion = () => {
            const timeSinceLastInteraction = Date.now() - this.lastInteractionTime;
            const thirtySeconds = 30000;
            
            if (!this.isOpen && timeSinceLastInteraction >= thirtySeconds) {
                this.showSuggestionBubble();
            }
            
            this.suggestionTimer = setTimeout(checkAndShowSuggestion, 30000);
        };
        
        this.suggestionTimer = setTimeout(checkAndShowSuggestion, 30000);
    }

    showSuggestionBubble() {
        if (!this.suggestionsEnabled || this.isOpen) return;
        
        const bubble = document.getElementById('suggestion-bubble');
        const randomMessage = this.suggestionMessages[Math.floor(Math.random() * this.suggestionMessages.length)];
        
        bubble.textContent = randomMessage;
        bubble.classList.add('show');
        
        // Auto-hide after 8 seconds
        setTimeout(() => {
            this.hideSuggestionBubble();
        }, 8000);
    }

    hideSuggestionBubble() {
        const bubble = document.getElementById('suggestion-bubble');
        if (bubble) {
            bubble.classList.remove('show');
        }
    }

    async sendMessage() {
        const input = document.getElementById('chatbot-input');
        const message = input.value.trim();
        
        if (!message) return;

        // Add user message to UI
        this.addMessage(message, 'user');
        input.value = '';
        input.style.height = 'auto';

        // Show typing indicator
        this.showTypingIndicator();

        try {
            // Get AI response
            const response = await this.getAIResponse(message);
            this.removeTypingIndicator();
            this.addMessage(response, 'bot');
        } catch (error) {
            console.error('Chatbot error:', error);
            this.removeTypingIndicator();
            this.addMessage('Sorry, I encountered an error. Please try again!', 'bot');
        }
    }

    async getAIResponse(userMessage) {
        // Add to conversation history
        this.conversationHistory.push({
            role: 'user',
            content: userMessage
        });

        const systemPrompt = {
            role: 'system',
            content: `You are ZaikaBot, a friendly and knowledgeable cooking assistant for ZaikaBox, a recipe discovery platform. 
            
Your personality:
- Warm, enthusiastic, and encouraging
- Use food emojis occasionally 🍳🥘🍰
- Keep responses concise but helpful (2-4 paragraphs max)
- Be conversational and friendly

Your expertise:
- Recipe recommendations and suggestions
- Cooking techniques and tips
- Ingredient substitutions
- Meal planning and nutrition basics
- Kitchen equipment advice
- Food safety and storage

Guidelines:
- If asked about recipes, suggest popular dishes and cooking methods
- Provide practical, actionable advice
- Encourage users to explore recipes on ZaikaBox
- If you don't know something, be honest but helpful
- Keep responses focused on cooking and food

Remember: You're here to make cooking fun and accessible for everyone!`
        };

        try {
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'llama-3.1-70b-versatile',
                    messages: [
                        systemPrompt,
                        ...this.conversationHistory.slice(-10) // Keep last 10 messages for context
                    ],
                    temperature: 0.7,
                    max_tokens: 500,
                    top_p: 0.9
                })
            });

            if (!response.ok) {
                throw new Error('API request failed');
            }

            const data = await response.json();
            const aiMessage = data.choices[0].message.content;

            // Add to conversation history
            this.conversationHistory.push({
                role: 'assistant',
                content: aiMessage
            });

            return aiMessage;
        } catch (error) {
            console.error('Groq API error:', error);
            throw error;
        }
    }

    addMessage(text, sender) {
        const messagesContainer = document.getElementById('chatbot-messages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `chatbot-message ${sender}-message`;
        
        if (sender === 'bot') {
            messageDiv.innerHTML = `
                <div class="message-avatar">
                    <img src="images/enchanted-apple.png" 
                         alt="Enchanted Apple" 
                         class="apple-icon-tiny">
                </div>
                <div class="message-content">
                    <p>${this.formatMessage(text)}</p>
                </div>
            `;
        } else {
            messageDiv.innerHTML = `
                <div class="message-content">
                    <p>${this.escapeHtml(text)}</p>
                </div>
            `;
        }

        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    formatMessage(text) {
        // Convert markdown-style formatting to HTML
        let formatted = this.escapeHtml(text);
        
        // Bold text
        formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        
        // Line breaks
        formatted = formatted.replace(/\n/g, '<br>');
        
        // Lists
        formatted = formatted.replace(/^- (.*?)$/gm, '<li>$1</li>');
        if (formatted.includes('<li>')) {
            formatted = formatted.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
        }
        
        return formatted;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showTypingIndicator() {
        const messagesContainer = document.getElementById('chatbot-messages');
        const typingDiv = document.createElement('div');
        typingDiv.className = 'chatbot-message bot-message typing-indicator';
        typingDiv.id = 'typing-indicator';
        typingDiv.innerHTML = `
            <div class="message-avatar">
                <img src="images/enchanted-apple.png" 
                     alt="Enchanted Apple" 
                     class="apple-icon-tiny">
            </div>
            <div class="message-content">
                <div class="typing-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
        `;
        messagesContainer.appendChild(typingDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    removeTypingIndicator() {
        const indicator = document.getElementById('typing-indicator');
        if (indicator) {
            indicator.remove();
        }
    }
}

// Initialize chatbot when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new ZaikaChatbot();
});
