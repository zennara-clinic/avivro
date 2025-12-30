(function(window, document) {
  'use strict';

  var AvivroChatWidget = {
    config: {},
    initialized: false,

    init: function(options) {
      if (this.initialized) {
        console.warn('Avivro Chat Widget already initialized');
        return;
      }

      this.config = {
        agentId: options.agentId,
        apiUrl: options.apiUrl || 'https://avivro.com',
        primaryColor: options.primaryColor || '#3B82F6',
        agentName: options.agentName || 'Support Assistant',
        welcomeMessage: options.welcomeMessage || 'Hi! How can I help you today?',
        logoUrl: options.logoUrl || '',
        position: options.position || 'bottom-right',
        showPoweredBy: options.showPoweredBy !== false,
        captureLeads: options.captureLeads !== false,
      };

      this.initialized = true;
      this.loadWidget();
    },

    loadWidget: function() {
      // Create container
      var container = document.createElement('div');
      container.id = 'avivro-chat-widget-container';
      document.body.appendChild(container);

      // Load styles
      this.loadStyles();

      // Render widget
      this.renderWidget(container);
    },

    loadStyles: function() {
      var style = document.createElement('style');
      style.textContent = `
        #avivro-chat-widget-container * {
          box-sizing: border-box;
        }
        
        .avivro-widget-bubble {
          position: fixed;
          z-index: 9999;
          width: 64px;
          height: 64px;
          border-radius: 50%;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          cursor: pointer;
          transition: all 0.3s;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .avivro-widget-bubble:hover {
          transform: scale(1.1);
        }
        
        .avivro-lead-modal {
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(4px);
          border-radius: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          z-index: 100;
        }
        
        .avivro-lead-form {
          background: white;
          border-radius: 16px;
          padding: 24px;
          width: 100%;
          max-width: 384px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        }
        
        .avivro-widget-bubble.bottom-right {
          bottom: 24px;
          right: 24px;
        }
        
        .avivro-widget-bubble.bottom-left {
          bottom: 24px;
          left: 24px;
        }
        
        .avivro-widget-window {
          position: fixed;
          z-index: 9999;
          width: 400px;
          max-width: calc(100vw - 32px);
          height: 600px;
          max-height: calc(100vh - 32px);
          background: white;
          border-radius: 24px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          display: flex;
          flex-direction: column;
          transition: all 0.3s;
        }
        
        .avivro-widget-window.bottom-right {
          bottom: 24px;
          right: 24px;
        }
        
        .avivro-widget-window.bottom-left {
          bottom: 24px;
          left: 24px;
        }
        
        .avivro-widget-window.minimized {
          height: 64px;
        }
        
        .avivro-widget-header {
          padding: 16px 24px;
          border-radius: 24px 24px 0 0;
          display: flex;
          align-items: center;
          justify-content: space-between;
          position: relative;
          overflow: hidden;
        }
        
        .avivro-widget-header::before {
          content: '';
          position: absolute;
          top: -64px;
          right: -64px;
          width: 128px;
          height: 128px;
          background: white;
          opacity: 0.1;
          border-radius: 50%;
        }
        
        .avivro-widget-messages {
          flex: 1;
          overflow-y: auto;
          padding: 24px;
          background: linear-gradient(to bottom, #f9fafb, white);
        }
        
        .avivro-widget-input {
          padding: 16px;
          border-top: 1px solid #e5e7eb;
          background: white;
          border-radius: 0 0 24px 24px;
        }
        
        .avivro-message {
          display: flex;
          gap: 12px;
          margin-bottom: 16px;
          animation: slideIn 0.3s ease-out;
        }
        
        .avivro-message.user {
          justify-content: flex-end;
        }
        
        .avivro-message-content {
          max-width: 80%;
          padding: 12px 16px;
          border-radius: 16px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        
        .avivro-message.assistant .avivro-message-content {
          background: white;
          border: 1px solid #e5e7eb;
          border-top-left-radius: 4px;
        }
        
        .avivro-message.user .avivro-message-content {
          color: white;
          border-top-right-radius: 4px;
        }
        
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        
        .avivro-typing-indicator {
          display: flex;
          gap: 4px;
        }
        
        .avivro-typing-dot {
          width: 8px;
          height: 8px;
          background: #9ca3af;
          border-radius: 50%;
          animation: bounce 1.4s infinite;
        }
        
        .avivro-typing-dot:nth-child(2) {
          animation-delay: 0.2s;
        }
        
        .avivro-typing-dot:nth-child(3) {
          animation-delay: 0.4s;
        }
        
        @media (max-width: 640px) {
          .avivro-widget-window {
            width: calc(100vw - 32px);
            height: calc(100vh - 32px);
          }
        }
      `;
      document.head.appendChild(style);
    },

    renderWidget: function(container) {
      var self = this;
      var isOpen = false;
      var isMinimized = false;
      var messages = [];
      var conversationId = null;
      var sessionId = this.getOrCreateSessionId();
      var leadCaptured = self.getLeadInfo(self.config.agentId) !== null;
      var showLeadForm = false;
      var leadInfo = { name: '', email: '', phone: '' };

      // Load saved conversation
      var savedConversation = self.loadConversation(self.config.agentId);
      if (savedConversation) {
        messages = savedConversation.messages;
        conversationId = savedConversation.conversationId;
      }

      function render() {
        container.innerHTML = '';

        if (!isOpen) {
          // Render bubble
          var bubble = document.createElement('div');
          bubble.className = 'avivro-widget-bubble ' + self.config.position;
          bubble.style.background = 'linear-gradient(135deg, ' + self.config.primaryColor + ', ' + self.config.primaryColor + 'dd)';
          bubble.innerHTML = `
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
            <div style="position: absolute; top: -4px; right: -4px; width: 12px; height: 12px; background: #10B981; border-radius: 50%; animation: pulse 2s infinite;"></div>
          `;
          bubble.onclick = function() {
            isOpen = true;
            if (messages.length === 0) {
              messages.push({
                id: 'welcome',
                role: 'assistant',
                content: self.config.welcomeMessage,
                timestamp: new Date()
              });
              self.saveConversation(self.config.agentId, messages, conversationId);
            }
            render();
          };
          container.appendChild(bubble);
        } else {
          // Render window
          var window = document.createElement('div');
          window.className = 'avivro-widget-window ' + self.config.position + (isMinimized ? ' minimized' : '');

          // Header
          var header = document.createElement('div');
          header.className = 'avivro-widget-header';
          header.style.background = 'linear-gradient(135deg, ' + self.config.primaryColor + ', ' + self.config.primaryColor + 'dd)';
          header.innerHTML = `
            <div style="display: flex; align-items: center; gap: 12px; position: relative; z-index: 10;">
              ${self.config.logoUrl ? 
                '<img src="' + self.config.logoUrl + '" style="width: 40px; height: 40px; border-radius: 50%; background: white; padding: 2px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);" />' :
                '<div style="width: 40px; height: 40px; border-radius: 50%; background: white; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 6px rgba(0,0,0,0.1);"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="' + self.config.primaryColor + '" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg></div>'
              }
              <div>
                <h3 style="margin: 0; color: white; font-size: 16px; font-weight: 700;">${self.config.agentName}</h3>
                <div style="display: flex; align-items: center; gap: 6px; margin-top: 2px;">
                  <div style="width: 8px; height: 8px; background: #10B981; border-radius: 50%; animation: pulse 2s infinite;"></div>
                  <span style="color: rgba(255,255,255,0.9); font-size: 12px; font-weight: 500;">Online</span>
                </div>
              </div>
            </div>
            <div style="display: flex; gap: 8px; position: relative; z-index: 10;">
              <button id="avivro-minimize-btn" style="background: rgba(255,255,255,0.1); border: none; color: white; padding: 6px; border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: center;">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="4 14 10 14 10 20"></polyline><polyline points="20 10 14 10 14 4"></polyline><line x1="14" y1="10" x2="21" y2="3"></line><line x1="3" y1="21" x2="10" y2="14"></line></svg>
              </button>
              <button id="avivro-close-btn" style="background: rgba(255,255,255,0.1); border: none; color: white; padding: 6px; border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: center;">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
          `;

          if (!isMinimized) {
            // Messages
            var messagesDiv = document.createElement('div');
            messagesDiv.className = 'avivro-widget-messages';
            messagesDiv.id = 'avivro-messages';
            
            messages.forEach(function(msg) {
              var messageEl = document.createElement('div');
              messageEl.className = 'avivro-message ' + msg.role;
              
              var content = '<div class="avivro-message-content"';
              if (msg.role === 'user') {
                content += ' style="background: linear-gradient(135deg, ' + self.config.primaryColor + ', ' + self.config.primaryColor + 'dd);"';
              }
              content += '>';
              
              // Format content with bullets, bold text, and line breaks
              var formattedContent = msg.content
                // Convert **text** to bold
                .replace(/\*\*(.+?)\*\*/g, '<strong style="font-weight: 600; color: #111;">$1</strong>')
                // Convert double newlines to spacing divs
                .replace(/\n\n/g, '<div style="margin: 8px 0;"></div>')
                // Convert bullet points to proper flex layout
                .replace(/•\s+(.+?)(\n|$)/g, function(match, text) {
                  return '<div style="display: flex; gap: 8px; margin: 4px 0;"><span style="flex-shrink: 0;">•</span><span style="flex: 1;">' + text + '</span></div>';
                })
                // Convert remaining newlines to line breaks
                .replace(/\n/g, '<br/>');
              
              content += '<div style="margin: 0; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">' + formattedContent + '</div>';
              content += '<span style="display: block; font-size: 11px; margin-top: 4px; opacity: 0.7;">' + formatTime(msg.timestamp) + '</span>';
              content += '</div>';
              
              if (msg.role === 'assistant') {
                var avatar = self.config.logoUrl ? 
                  '<img src="' + self.config.logoUrl + '" style="width: 32px; height: 32px; border-radius: 50%; flex-shrink: 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1);" />' :
                  '<div style="width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(135deg, ' + self.config.primaryColor + ', ' + self.config.primaryColor + 'dd); display: flex; align-items: center; justify-content: center; flex-shrink: 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1);"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg></div>';
                messageEl.innerHTML = avatar + content;
              } else {
                messageEl.innerHTML = content;
              }
              
              messagesDiv.appendChild(messageEl);
            });

            // Input
            var inputDiv = document.createElement('div');
            inputDiv.className = 'avivro-widget-input';
            inputDiv.innerHTML = `
              <div style="display: flex; gap: 8px;">
                <input type="text" id="avivro-input" placeholder="Type your message..." style="flex: 1; padding: 12px 16px; border: 2px solid #e5e7eb; border-radius: 16px; font-size: 14px; outline: none;" />
                <button id="avivro-send-btn" style="background: linear-gradient(135deg, ${self.config.primaryColor}, ${self.config.primaryColor}dd); border: none; color: white; padding: 12px 20px; border-radius: 16px; cursor: pointer; font-weight: 700; box-shadow: 0 4px 6px rgba(0,0,0,0.1); display: flex; align-items: center; justify-content: center;">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                </button>
              </div>
              ${self.config.showPoweredBy ? '<div style="text-align: center; margin-top: 12px; font-size: 11px; color: #6b7280;">Powered by <span style="font-weight: 700; background: linear-gradient(to right, #9333ea, #3b82f6); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">Avivro</span></div>' : ''}
            `;

            window.appendChild(header);
            window.appendChild(messagesDiv);
            window.appendChild(inputDiv);
            
            // Lead form modal (shown when user tries to send first message)
            if (showLeadForm) {
              var leadModal = document.createElement('div');
              leadModal.className = 'avivro-lead-modal';
              leadModal.innerHTML = `
                <div class="avivro-lead-form">
                  <h3 style="margin: 0 0 8px 0; font-size: 20px; font-weight: 700; color: #111;">Let's get started!</h3>
                  <p style="margin: 0 0 16px 0; font-size: 14px; color: #6b7280;">Please share your details so we can assist you better.</p>
                  
                  <div style="margin-bottom: 16px;">
                    <label style="display: block; margin-bottom: 6px; font-size: 13px; font-weight: 600; color: #374151;">Name *</label>
                    <input type="text" id="avivro-lead-name" value="${leadInfo.name}" placeholder="Your full name" style="width: 100%; padding: 10px 16px; border: 2px solid #e5e7eb; border-radius: 12px; font-size: 14px; outline: none; transition: border 0.2s;" />
                  </div>
                  
                  <div style="margin-bottom: 16px;">
                    <label style="display: block; margin-bottom: 6px; font-size: 13px; font-weight: 600; color: #374151;">Email *</label>
                    <input type="email" id="avivro-lead-email" value="${leadInfo.email}" placeholder="your@email.com" style="width: 100%; padding: 10px 16px; border: 2px solid #e5e7eb; border-radius: 12px; font-size: 14px; outline: none; transition: border 0.2s;" />
                  </div>
                  
                  <div style="margin-bottom: 16px;">
                    <label style="display: block; margin-bottom: 6px; font-size: 13px; font-weight: 600; color: #374151;">Phone *</label>
                    <input type="tel" id="avivro-lead-phone" value="${leadInfo.phone}" placeholder="98765 43210" maxlength="11" style="width: 100%; padding: 10px 16px; border: 2px solid #e5e7eb; border-radius: 12px; font-size: 14px; outline: none; transition: border 0.2s;" />
                    <p style="margin: 4px 0 0 0; font-size: 11px; color: #6b7280;">Enter 10-digit mobile number (6-9 to start)</p>
                  </div>
                  
                  <div id="avivro-lead-error" style="display: none; padding: 12px; background: #FEE2E2; border: 1px solid #FCA5A5; border-radius: 12px; margin-bottom: 16px; font-size: 13px; color: #DC2626;"></div>
                  
                  <div style="display: flex; gap: 8px; padding-top: 8px;">
                    <button id="avivro-skip-lead" style="flex: 1; padding: 10px 16px; border: 2px solid #e5e7eb; border-radius: 12px; background: white; color: #374151; font-weight: 600; cursor: pointer; transition: all 0.2s;">
                      Skip
                    </button>
                    <button id="avivro-submit-lead" style="flex: 1; padding: 10px 16px; border: none; border-radius: 12px; background: linear-gradient(135deg, ${self.config.primaryColor}, ${self.config.primaryColor}dd); color: white; font-weight: 700; cursor: pointer; box-shadow: 0 4px 6px rgba(0,0,0,0.1); transition: all 0.2s;">
                      Continue
                    </button>
                  </div>
                </div>
              `;
              window.appendChild(leadModal);
            }

            // Event listeners
            setTimeout(function() {
              document.getElementById('avivro-minimize-btn').onclick = function() {
                isMinimized = !isMinimized;
                render();
              };

              document.getElementById('avivro-close-btn').onclick = function() {
                isOpen = false;
                render();
              };

              var input = document.getElementById('avivro-input');
              var sendBtn = document.getElementById('avivro-send-btn');

              sendBtn.onclick = function() {
                sendMessage(input.value, false);
              };

              input.onkeypress = function(e) {
                if (e.key === 'Enter') {
                  sendMessage(input.value, false);
                }
              };
              
              // Lead form handlers
              if (showLeadForm) {
                var phoneInput = document.getElementById('avivro-lead-phone');
                phoneInput.oninput = function(e) {
                  var numbers = e.target.value.replace(/\D/g, '');
                  if (numbers.length <= 10) {
                    var formatted = numbers;
                    if (numbers.length > 5) {
                      formatted = numbers.slice(0, 5) + ' ' + numbers.slice(5);
                    }
                    leadInfo.phone = formatted;
                    e.target.value = formatted;
                  }
                };
                
                document.getElementById('avivro-skip-lead').onclick = function() {
                  showLeadForm = false;
                  leadCaptured = true;
                  render();
                  // Send message with skip flag
                  sendMessage(input.value, true);
                };
                
                document.getElementById('avivro-submit-lead').onclick = function() {
                  var name = document.getElementById('avivro-lead-name').value.trim();
                  var email = document.getElementById('avivro-lead-email').value.trim();
                  var phone = document.getElementById('avivro-lead-phone').value.trim();
                  var errorDiv = document.getElementById('avivro-lead-error');
                  
                  // Validation
                  if (!name) {
                    errorDiv.textContent = 'Please enter your name';
                    errorDiv.style.display = 'block';
                    return;
                  }
                  
                  if (!email) {
                    errorDiv.textContent = 'Please enter your email address';
                    errorDiv.style.display = 'block';
                    return;
                  }
                  
                  if (!phone) {
                    errorDiv.textContent = 'Please enter your phone number';
                    errorDiv.style.display = 'block';
                    return;
                  }
                  
                  if (name.length < 2) {
                    errorDiv.textContent = 'Name must be at least 2 characters long';
                    errorDiv.style.display = 'block';
                    return;
                  }
                  
                  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                    errorDiv.textContent = 'Please enter a valid email address (e.g., name@example.com)';
                    errorDiv.style.display = 'block';
                    return;
                  }
                  
                  var phoneDigits = phone.replace(/\D/g, '');
                  if (phoneDigits.length !== 10) {
                    errorDiv.textContent = 'Please enter complete 10-digit mobile number';
                    errorDiv.style.display = 'block';
                    return;
                  }
                  
                  if (!/^[6-9]\d{9}$/.test(phoneDigits)) {
                    errorDiv.textContent = 'Mobile number must start with 6, 7, 8, or 9';
                    errorDiv.style.display = 'block';
                    return;
                  }
                  
                  // Save lead info
                  leadInfo = { name: name, email: email, phone: phone };
                  self.saveLeadInfo(self.config.agentId, leadInfo);
                  leadCaptured = true;
                  showLeadForm = false;
                  errorDiv.style.display = 'none';
                  
                  render();
                  // Send message with lead info
                  sendMessage(input.value, true);
                };
              }

              input.focus();
              messagesDiv.scrollTop = messagesDiv.scrollHeight;
            }, 0);
          } else {
            window.appendChild(header);
            setTimeout(function() {
              document.getElementById('avivro-minimize-btn').onclick = function() {
                isMinimized = !isMinimized;
                render();
              };
              document.getElementById('avivro-close-btn').onclick = function() {
                isOpen = false;
                render();
              };
            }, 0);
          }

          container.appendChild(window);
        }
      }

      function sendMessage(text, skipLeadCapture) {
        if (!text.trim()) return;

        // Show lead form if enabled and not captured yet (unless explicitly skipped)
        if (self.config.captureLeads && !leadCaptured && !skipLeadCapture && messages.length <= 1) {
          showLeadForm = true;
          render();
          return;
        }

        var savedLeadInfo = self.getLeadInfo(self.config.agentId);

        messages.push({
          id: Date.now().toString(),
          role: 'user',
          content: text,
          timestamp: new Date()
        });

        // Save after user message
        self.saveConversation(self.config.agentId, messages, conversationId);

        render();

        // Add typing indicator
        var typingId = 'typing-' + Date.now();
        messages.push({
          id: typingId,
          role: 'assistant',
          content: '<div class="avivro-typing-indicator"><div class="avivro-typing-dot"></div><div class="avivro-typing-dot"></div><div class="avivro-typing-dot"></div></div>',
          timestamp: new Date()
        });
        render();

        // Send to Supabase Edge Function
        fetch(self.config.apiUrl + '/functions/v1/chat/' + self.config.agentId, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: text,
            conversationId: conversationId,
            sessionId: sessionId,
            leadInfo: leadCaptured ? savedLeadInfo : null
          })
        })
        .then(function(res) { return res.json(); })
        .then(function(data) {
          // Remove typing indicator
          messages = messages.filter(function(m) { return m.id !== typingId; });

          // Add response
          if (data.conversationId) {
            conversationId = data.conversationId;
          }

          messages.push({
            id: data.messageId || Date.now().toString(),
            role: 'assistant',
            content: data.response,
            timestamp: new Date()
          });

          // Save after assistant response
          self.saveConversation(self.config.agentId, messages, conversationId);

          render();
        })
        .catch(function(err) {
          // Remove typing indicator
          messages = messages.filter(function(m) { return m.id !== typingId; });

          messages.push({
            id: Date.now().toString(),
            role: 'assistant',
            content: 'Sorry, I encountered an error. Please try again.',
            timestamp: new Date()
          });

          render();
          console.error('Chat error:', err);
        });
      }

      function formatTime(date) {
        var hours = date.getHours();
        var minutes = date.getMinutes();
        var ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12;
        minutes = minutes < 10 ? '0' + minutes : minutes;
        return hours + ':' + minutes + ' ' + ampm;
      }

      function escapeHtml(text) {
        var div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
      }

      render();
    },

    getOrCreateSessionId: function() {
      var key = 'avivro_session_' + this.config.agentId;
      var sessionId = sessionStorage.getItem(key);
      if (!sessionId) {
        sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        sessionStorage.setItem(key, sessionId);
      }
      return sessionId;
    },

    saveConversation: function(agentId, messages, conversationId) {
      var key = 'avivro_chat_' + agentId;
      var data = {
        messages: messages.map(function(msg) {
          return {
            id: msg.id,
            role: msg.role,
            content: msg.content,
            timestamp: msg.timestamp.toISOString()
          };
        }),
        conversationId: conversationId,
        savedAt: new Date().toISOString()
      };
      localStorage.setItem(key, JSON.stringify(data));
    },

    loadConversation: function(agentId) {
      var key = 'avivro_chat_' + agentId;
      var stored = localStorage.getItem(key);
      if (!stored) return null;

      try {
        var data = JSON.parse(stored);
        var savedAt = new Date(data.savedAt);
        var now = new Date();
        var weekInMs = 7 * 24 * 60 * 60 * 1000;

        // Clear if older than 1 week
        if (now - savedAt > weekInMs) {
          localStorage.removeItem(key);
          return null;
        }

        // Restore messages with proper Date objects
        data.messages = data.messages.map(function(msg) {
          return {
            id: msg.id,
            role: msg.role,
            content: msg.content,
            timestamp: new Date(msg.timestamp)
          };
        });

        return data;
      } catch (e) {
        console.error('Failed to load conversation:', e);
        return null;
      }
    },

    saveLeadInfo: function(agentId, leadInfo) {
      var key = 'avivro_lead_' + agentId;
      localStorage.setItem(key, JSON.stringify(leadInfo));
    },

    getLeadInfo: function(agentId) {
      var key = 'avivro_lead_' + agentId;
      var stored = localStorage.getItem(key);
      if (!stored) return null;
      try {
        return JSON.parse(stored);
      } catch (e) {
        return null;
      }
    }
  };

  // Expose to window
  window.AvivroChatWidget = AvivroChatWidget;

  // Auto-init if data-agent-id is present
  var script = document.currentScript || document.querySelector('script[data-agent-id]');
  if (script && script.getAttribute('data-agent-id')) {
    AvivroChatWidget.init({
      agentId: script.getAttribute('data-agent-id'),
      apiUrl: script.getAttribute('data-api-url') || undefined,
      primaryColor: script.getAttribute('data-primary-color') || undefined,
      agentName: script.getAttribute('data-agent-name') || undefined,
      welcomeMessage: script.getAttribute('data-welcome-message') || undefined,
      logoUrl: script.getAttribute('data-logo-url') || undefined,
      position: script.getAttribute('data-position') || undefined,
      showPoweredBy: script.getAttribute('data-show-powered-by') !== 'false',
      captureLeads: script.getAttribute('data-capture-leads') !== 'false'
    });
  }
})(window, document);
