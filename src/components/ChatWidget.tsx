import { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Minimize2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatWidgetProps {
  agentId: string;
  apiUrl?: string;
  primaryColor?: string;
  agentName?: string;
  welcomeMessage?: string;
  logoUrl?: string;
  position?: 'bottom-right' | 'bottom-left';
  showPoweredBy?: boolean;
  captureLeads?: boolean;
}

interface LeadInfo {
  name: string;
  email: string;
  phone: string;
}

// Helper function to get conversationId from sessionStorage (lightweight)
const getStoredConversationId = (agentId: string): string | null => {
  return sessionStorage.getItem(`avivro_conversation_${agentId}`);
};

const saveConversationId = (agentId: string, conversationId: string) => {
  sessionStorage.setItem(`avivro_conversation_${agentId}`, conversationId);
};

export default function ChatWidget({
  agentId,
  apiUrl = window.location.origin,
  primaryColor = '#3B82F6',
  agentName = 'Support Assistant',
  welcomeMessage = 'Hi! How can I help you today?',
  logoUrl,
  position = 'bottom-right',
  showPoweredBy = true,
  captureLeads = true,
}: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [leadInfo, setLeadInfo] = useState<LeadInfo>({ name: '', email: '', phone: '' });
  const [leadCaptured, setLeadCaptured] = useState(false);

  const positionClasses = position === 'bottom-right' 
    ? 'right-6 bottom-6' 
    : 'left-6 bottom-6';

  // Load conversation from database on mount
  useEffect(() => {
    if (!loaded) {
      const loadMessagesFromDatabase = async () => {
        // Check if we have a conversationId in session
        const storedConvId = getStoredConversationId(agentId);
        
        if (storedConvId) {
          // Load messages from database
          try {
            const { data: dbMessages, error } = await supabase
              .from('messages')
              .select('id, role, content, created_at')
              .eq('conversation_id', storedConvId)
              .order('created_at', { ascending: true });

            if (!error && dbMessages && dbMessages.length > 0) {
              const messages: Message[] = dbMessages.map((msg: any) => ({
                id: msg.id,
                role: msg.role as 'user' | 'assistant',
                content: msg.content,
                timestamp: new Date(msg.created_at),
              }));
              setMessages(messages);
              setConversationId(storedConvId);
            } else {
              // Conversation exists but no messages, keep conversationId
              setConversationId(storedConvId);
            }
          } catch (err) {
            console.error('Failed to load messages from database:', err);
          }
        }
        
        setLoaded(true);
      };

      loadMessagesFromDatabase();
    }
  }, [agentId, loaded]);

  useEffect(() => {
    if (messages.length === 0 && isOpen && loaded) {
      const welcomeMsg = {
        id: 'welcome',
        role: 'assistant' as const,
        content: welcomeMessage,
        timestamp: new Date(),
      };
      setMessages([welcomeMsg]);
    }
  }, [isOpen, welcomeMessage, messages.length, loaded]);

  // Save conversationId to session when it changes
  useEffect(() => {
    if (conversationId) {
      saveConversationId(agentId, conversationId);
    }
  }, [conversationId, agentId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (skipLeadCapture = false) => {
    if (!inputValue.trim() || isLoading) return;

    // Show lead form if enabled and not yet captured (unless explicitly skipped)
    if (captureLeads && !leadCaptured && !skipLeadCapture && messages.length <= 1) {
      setShowLeadForm(true);
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date(),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputValue('');
    setIsLoading(true);
    setError(null);

    try {
      // Edge function will create/get conversation with service role key
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      const sessionId = getOrCreateSessionId();
      
      const response = await fetch(`${supabaseUrl}/functions/v1/chat/${agentId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify({
          message: userMessage.content,
          conversationId: conversationId, // Pass existing convId or null
          sessionId: sessionId,
          leadInfo: leadCaptured ? leadInfo : null, // Pass lead info if captured
        }),
      });

      if (!response.ok) {
        throw new Error(`Chat API error: ${response.status}`);
      }

      const data = await response.json();

      // Save conversationId if it was just created
      if (data.conversationId && !conversationId) {
        setConversationId(data.conversationId);
      }

      // Assistant message already saved by edge function, just update UI
      const assistantMessage: Message = {
        id: data.messageId || Date.now().toString(),
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setError(null);

    // Validation
    if (!leadInfo.name?.trim()) {
      setError('Please enter your name');
      return;
    }

    if (!leadInfo.email?.trim()) {
      setError('Please enter your email address');
      return;
    }

    if (!leadInfo.phone?.trim()) {
      setError('Please enter your phone number');
      return;
    }

    if (leadInfo.name.trim().length < 2) {
      setError('Name must be at least 2 characters long');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(leadInfo.email.trim())) {
      setError('Please enter a valid email address (e.g., name@example.com)');
      return;
    }

    const phoneDigits = leadInfo.phone.replace(/\D/g, '');
    if (phoneDigits.length !== 10) {
      setError('Please enter complete 10-digit mobile number');
      return;
    }
    
    if (!/^[6-9]\d{9}$/.test(phoneDigits)) {
      setError('Mobile number must start with 6, 7, 8, or 9');
      return;
    }

    // Mark as captured and close form - edge function will handle DB operations
    setLeadCaptured(true);
    setShowLeadForm(false);
    setError(null);
    
    // Send message with lead info - edge function creates conversation & lead
    sendMessage(true);
  };

  const getOrCreateSessionId = () => {
    let sessionId = sessionStorage.getItem(`avivro_session_${agentId}`);
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem(`avivro_session_${agentId}`, sessionId);
    }
    return sessionId;
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* Chat Bubble */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed z-[9999] w-16 h-16 rounded-full shadow-2xl hover:scale-110 transition-all duration-300 flex items-center justify-center group"
          style={{
            background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd)`,
            ...getPositionStyles(position),
          }}
          aria-label="Open chat"
        >
          <MessageCircle className="w-7 h-7 text-white group-hover:scale-110 transition-transform" />
          <div 
            className="absolute -top-1 -right-1 w-3 h-3 rounded-full animate-pulse"
            style={{ backgroundColor: '#10B981' }}
          />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div
          className={`fixed z-[9999] ${positionClasses} flex flex-col bg-white rounded-3xl shadow-2xl transition-all duration-300 ${
            isMinimized ? 'h-16' : 'h-[600px]'
          } w-[400px] max-w-[calc(100vw-2rem)]`}
          style={{ maxHeight: 'calc(100vh - 2rem)' }}
        >
          {/* Header */}
          <div
            className="rounded-t-3xl px-6 py-4 flex items-center justify-between relative overflow-hidden"
            style={{ background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd)` }}
          >
            {/* Decorative background */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full -mr-16 -mt-16"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full -ml-12 -mb-12"></div>
            </div>

            <div className="flex items-center gap-3 relative z-10">
              {logoUrl ? (
                <img src={logoUrl} alt="Logo" className="w-10 h-10 rounded-full bg-white p-1 shadow-lg" />
              ) : (
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg">
                  <MessageCircle className="w-5 h-5" style={{ color: primaryColor }} />
                </div>
              )}
              <div>
                <h3 className="text-white font-bold text-base">{agentName}</h3>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <p className="text-white/90 text-xs font-medium">Online</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 relative z-10">
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="text-white/90 hover:text-white transition-colors p-1.5 hover:bg-white/10 rounded-lg"
                aria-label={isMinimized ? "Maximize" : "Minimize"}
              >
                <Minimize2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white/90 hover:text-white transition-colors p-1.5 hover:bg-white/10 rounded-lg"
                aria-label="Close chat"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Messages */}
          {!isMinimized && (
            <>
              <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-gray-50 to-white">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''} animate-in slide-in-from-${msg.role === 'user' ? 'right' : 'left'} duration-300`}
                  >
                    {msg.role === 'assistant' && (
                      logoUrl ? (
                        <img src={logoUrl} alt="Bot" className="w-8 h-8 rounded-full flex-shrink-0 shadow-md object-cover" />
                      ) : (
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-md"
                          style={{ background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd)` }}
                        >
                          <MessageCircle className="w-4 h-4 text-white" />
                        </div>
                      )
                    )}
                    <div
                      className={`px-4 py-3 rounded-2xl shadow-md max-w-[80%] ${
                        msg.role === 'assistant'
                          ? 'bg-white rounded-tl-md border border-gray-100'
                          : 'text-white rounded-tr-md'
                      }`}
                      style={msg.role === 'user' ? { background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd)` } : {}}
                    >
                      <div 
                        className={`text-sm leading-relaxed ${msg.role === 'assistant' ? 'text-gray-800' : ''}`}
                        style={{ whiteSpace: 'pre-wrap' }}
                        dangerouslySetInnerHTML={{ 
                          __html: msg.content
                            .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>')
                            .replace(/\n\n/g, '<div style="margin: 8px 0;"></div>')
                            .replace(/• (.+?)(\n|$)/g, '<div style="display: flex; gap: 8px; margin: 4px 0;"><span style="flex-shrink: 0;">•</span><span style="flex: 1;">$1</span></div>')
                            .replace(/\n/g, '<br/>')
                        }}
                      />
                      <span className={`text-xs mt-1 block ${msg.role === 'assistant' ? 'text-gray-400' : 'text-white/70'}`}>
                        {msg.timestamp.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex gap-3">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-md"
                      style={{ background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd)` }}
                    >
                      <MessageCircle className="w-4 h-4 text-white" />
                    </div>
                    <div className="bg-white px-4 py-3 rounded-2xl rounded-tl-md shadow-md border border-gray-100">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                    </div>
                  </div>
                )}
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-600">
                    {error}
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-4 bg-white border-t border-gray-100 rounded-b-3xl">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your message..."
                    disabled={isLoading}
                    className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-2xl text-sm focus:border-gray-300 focus:outline-none transition-colors disabled:bg-gray-50 disabled:cursor-not-allowed"
                  />
                  <button
                    onClick={() => sendMessage()}
                    disabled={!inputValue.trim() || isLoading}
                    className="px-5 py-3 rounded-2xl text-white font-bold shadow-lg hover:shadow-xl transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                    style={{ background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd)` }}
                    aria-label="Send message"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
                {showPoweredBy && (
                  <div className="text-center mt-3">
                    <p className="text-xs text-gray-500">
                      Powered by <span className="font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">Avivro</span>
                    </p>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Lead Capture Form Modal */}
          {showLeadForm && (
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm rounded-3xl flex items-center justify-center p-6 z-50">
              <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Let's get started!</h3>
                <p className="text-sm text-gray-600 mb-4">Please share your details so we can assist you better.</p>
                
                <form onSubmit={handleLeadSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                    <input
                      type="text"
                      value={leadInfo.name}
                      onChange={(e) => setLeadInfo({ ...leadInfo, name: e.target.value })}
                      placeholder="Your full name"
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl text-sm focus:border-blue-500 focus:outline-none transition-colors"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                    <input
                      type="email"
                      value={leadInfo.email}
                      onChange={(e) => setLeadInfo({ ...leadInfo, email: e.target.value })}
                      placeholder="your@email.com"
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl text-sm focus:border-blue-500 focus:outline-none transition-colors"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                    <input
                      type="tel"
                      value={leadInfo.phone}
                      onChange={(e) => {
                        // Only allow numbers
                        const numbers = e.target.value.replace(/\D/g, '');
                        
                        // Limit to 10 digits
                        if (numbers.length <= 10) {
                          // Auto-format: XXXXX XXXXX (space after 5 digits)
                          let formatted = numbers;
                          if (numbers.length > 5) {
                            formatted = numbers.slice(0, 5) + ' ' + numbers.slice(5);
                          }
                          setLeadInfo({ ...leadInfo, phone: formatted });
                        }
                      }}
                      placeholder="98765 43210"
                      maxLength={11}
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl text-sm focus:border-blue-500 focus:outline-none transition-colors"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">Enter 10-digit mobile number (6-9 to start)</p>
                  </div>

                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-600">
                      {error}
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowLeadForm(false);
                        setLeadCaptured(true); // Mark as captured so form won't show again
                        setError(null);
                        // Send the message immediately, bypassing lead capture
                        sendMessage(true);
                      }}
                      className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                    >
                      Skip
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2 rounded-xl text-white font-bold shadow-lg hover:shadow-xl transition-all hover:scale-105"
                      style={{ background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd)` }}
                    >
                      Continue
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}

function getPositionStyles(position: 'bottom-right' | 'bottom-left') {
  return position === 'bottom-right'
    ? { right: '1.5rem', bottom: '1.5rem' }
    : { left: '1.5rem', bottom: '1.5rem' };
}
