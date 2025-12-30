import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import { Send, Bot, Sparkles, ChevronDown, Loader2, AlertCircle } from 'lucide-react';
import { OPENROUTER_MODELS } from '../../config/llm-models';
import { openRouterClient } from '../../lib/openrouter';
import { db } from '../../lib/supabase';
import type { Database } from '../../types/database.types';
import LLMSelector from '../../components/LLMSelector';

type Agent = Database['public']['Tables']['agents']['Row'];

interface Widget {
  id: string;
  enabled: boolean;
  selectedModel: string;
  messages: { role: 'user' | 'assistant'; content: string; timestamp?: string }[];
  loading?: boolean;
  error?: string;
}

export default function AgentTest() {
  const { agentId } = useParams();
  const [inputMessage, setInputMessage] = useState('');
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const dropdownRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const messagesEndRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [apiConfigured, setApiConfigured] = useState(true);
  const [agent, setAgent] = useState<Agent | null>(null);
  const [loadingAgent, setLoadingAgent] = useState(true);
  
  // Fetch agent data
  useEffect(() => {
    async function fetchAgent() {
      if (!agentId) {
        setLoadingAgent(false);
        return;
      }
      
      try {
        const { data, error } = await db.agents.get(agentId);
        if (error) throw error;
        setAgent(data);
      } catch (error) {
        console.error('Error fetching agent:', error);
      } finally {
        setLoadingAgent(false);
      }
    }
    
    fetchAgent();
  }, [agentId]);
  
  // Check if OpenRouter API is configured
  useEffect(() => {
    setApiConfigured(openRouterClient.isConfigured());
  }, []);
  
  // Use only the 5 real LLMs from agent configuration (all are recommended)
  const REAL_MODELS = OPENROUTER_MODELS.filter(m => m.recommended);
  const initialModels = REAL_MODELS.slice(0, 3);
  
  // Widget configuration
  const [widgets, setWidgets] = useState<Widget[]>([
    { id: 'widget1', enabled: true, selectedModel: initialModels[0]?.id || OPENROUTER_MODELS[0].id, messages: [], loading: false },
    { id: 'widget2', enabled: true, selectedModel: initialModels[1]?.id || OPENROUTER_MODELS[1].id, messages: [], loading: false },
    { id: 'widget3', enabled: true, selectedModel: initialModels[2]?.id || OPENROUTER_MODELS[2].id, messages: [], loading: false }
  ]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    widgets.forEach(widget => {
      if (messagesEndRefs.current[widget.id]) {
        messagesEndRefs.current[widget.id]?.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }, [widgets]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openDropdown) {
        const dropdownElement = dropdownRefs.current[openDropdown];
        if (dropdownElement && !dropdownElement.contains(event.target as Node)) {
          setOpenDropdown(null);
        }
      }
    };

    if (openDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [openDropdown]);

  // Map models to UI config with colors
  const getModelColor = (index: number) => {
    const colors = [
      { color: 'from-blue-600 to-blue-700', shadow: 'shadow-blue-600/30' },
      { color: 'from-green-600 to-green-700', shadow: 'shadow-green-600/30' },
      { color: 'from-purple-600 to-purple-700', shadow: 'shadow-purple-600/30' },
      { color: 'from-yellow-600 to-yellow-700', shadow: 'shadow-yellow-600/30' },
      { color: 'from-red-600 to-red-700', shadow: 'shadow-red-600/30' },
      { color: 'from-pink-600 to-pink-700', shadow: 'shadow-pink-600/30' },
      { color: 'from-indigo-600 to-indigo-700', shadow: 'shadow-indigo-600/30' },
      { color: 'from-orange-600 to-orange-700', shadow: 'shadow-orange-600/30' },
    ];
    return colors[index % colors.length];
  };

  const getModelConfig = (modelId: string) => {
    const model = OPENROUTER_MODELS.find(m => m.id === modelId);
    if (!model) return { model: OPENROUTER_MODELS[0], ...getModelColor(0) };
    
    const index = OPENROUTER_MODELS.findIndex(m => m.id === modelId);
    return { model, ...getModelColor(index) };
  };

  const toggleWidget = (widgetId: string) => {
    setWidgets(prev => prev.map(w => 
      w.id === widgetId ? { ...w, enabled: !w.enabled } : w
    ));
  };

  const changeModel = (widgetId: string, modelId: string) => {
    setWidgets(prev => prev.map(w => 
      w.id === widgetId ? { ...w, selectedModel: modelId, messages: [], error: undefined } : w
    ));
    setOpenDropdown(null);
  };

  const handleSend = async () => {
    if (!inputMessage.trim()) return;
    if (!agentId) {
      alert('No agent selected');
      return;
    }

    const userMessage = inputMessage.trim();
    setInputMessage('');

    // Add user message to enabled widgets
    setWidgets(prev => prev.map(widget => 
      widget.enabled 
        ? { ...widget, messages: [...widget.messages, { role: 'user', content: userMessage }], loading: true, error: undefined }
        : widget
    ));

    // Send to all enabled widgets in parallel using Supabase chat edge function
    const enabledWidgets = widgets.filter(w => w.enabled);
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    await Promise.all(enabledWidgets.map(async (widget) => {
      try {
        // Create unique session ID for each widget to keep conversations separate
        const sessionId = `test_${widget.id}_${Date.now()}`;
        
        // Call Supabase chat edge function with selected model override
        const response = await fetch(`${supabaseUrl}/functions/v1/chat/${agentId}?model=${encodeURIComponent(widget.selectedModel)}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseAnonKey}`,
          },
          body: JSON.stringify({
            message: userMessage,
            conversationId: null, // Each test is independent
            sessionId: sessionId,
            leadInfo: null,
            modelOverride: widget.selectedModel // Pass model override
          }),
        });

        if (!response.ok) {
          throw new Error(`Chat API error: ${response.status}`);
        }

        const data = await response.json();

        // Update widget with response
        setWidgets(prev => prev.map(w => 
          w.id === widget.id
            ? {
                ...w,
                messages: [...w.messages, {
                  role: 'assistant',
                  content: data.response,
                  timestamp: new Date().toLocaleTimeString()
                }],
                loading: false,
                error: undefined
              }
            : w
        ));
      } catch (error: any) {
        console.error(`Error for widget ${widget.id}:`, error);
        setWidgets(prev => prev.map(w => 
          w.id === widget.id
            ? {
                ...w,
                loading: false,
                error: error.message || 'Failed to get response'
              }
            : w
        ));
      }
    }));
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-gradient-to-br from-primary-600 to-primary-700 rounded-2xl flex items-center justify-center shadow-lg shadow-primary-600/30">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900">Model Comparison Test</h1>
              <p className="text-lg text-gray-600">
                {loadingAgent ? (
                  'Loading agent...'
                ) : agent ? (
                  `Testing agent: ${agent.name}`
                ) : (
                  'Compare responses from different AI models in real-time'
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Model Comparison Grid - Chat Window Style */}
        <div className={`grid grid-cols-1 gap-6 mb-6 ${
          widgets.filter(w => w.enabled).length === 3 ? 'lg:grid-cols-3' :
          widgets.filter(w => w.enabled).length === 2 ? 'lg:grid-cols-2' :
          'lg:grid-cols-1'
        }`}>
          {widgets.filter(w => w.enabled).map((widget) => {
            const modelConfig = getModelConfig(widget.selectedModel);
            const primaryColor = modelConfig.color.includes('blue') ? '#3B82F6' :
                                modelConfig.color.includes('green') ? '#10B981' :
                                modelConfig.color.includes('purple') ? '#8B5CF6' :
                                modelConfig.color.includes('yellow') ? '#F59E0B' :
                                modelConfig.color.includes('red') ? '#EF4444' :
                                modelConfig.color.includes('pink') ? '#EC4899' :
                                modelConfig.color.includes('indigo') ? '#6366F1' :
                                modelConfig.color.includes('orange') ? '#F97316' : '#3B82F6';
            
            return (
              <div key={widget.id} className="flex flex-col bg-white rounded-3xl shadow-2xl overflow-hidden" style={{ height: '600px' }}>
                {/* Chat Window Header - ChatWidget Style */}
                <div
                  className="rounded-t-3xl px-6 py-4 flex items-center justify-between relative overflow-hidden"
                  style={{ background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd)` }}
                >
                  {/* Decorative background */}
                  <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full -mr-16 -mt-16"></div>
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full -ml-12 -mb-12"></div>
                  </div>

                  <div className="flex items-center gap-3 relative z-10 flex-1 min-w-0">
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg flex-shrink-0">
                      <Bot className="w-5 h-5" style={{ color: primaryColor }} />
                    </div>
                    <div 
                      className="relative flex-1 min-w-0" 
                      ref={(el) => { dropdownRefs.current[widget.id] = el; }}
                    >
                      <button
                        onClick={() => setOpenDropdown(openDropdown === widget.id ? null : widget.id)}
                        className="flex items-center justify-between w-full text-white text-left"
                      >
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-base truncate text-left">{modelConfig.model.name}</h3>
                          <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                            <p className="text-white/90 text-xs font-medium">Online</p>
                          </div>
                        </div>
                        <ChevronDown className={`w-4 h-4 text-white/90 transition-transform duration-200 flex-shrink-0 ml-2 ${openDropdown === widget.id ? 'rotate-180' : ''}`} />
                      </button>
                      
                      {/* Custom Dropdown Menu - Fixed positioning */}
                      {openDropdown === widget.id && (() => {
                        const rect = dropdownRefs.current[widget.id]?.getBoundingClientRect();
                        return (
                        <div className="fixed bg-white border-2 border-gray-200 rounded-2xl shadow-2xl z-[9999] max-h-96 overflow-y-auto mt-2" 
                             style={{
                               top: rect ? `${rect.bottom + 8}px` : 'auto',
                               left: rect ? `${rect.left}px` : 'auto',
                               width: rect ? `${rect.width}px` : 'auto'
                             }}>
                          {REAL_MODELS.map((model, idx) => {
                            const isSelected = widget.selectedModel === model.id;
                            const colorConfig = getModelColor(idx);
                            return (
                              <button
                                key={model.id}
                                onClick={() => changeModel(widget.id, model.id)}
                                className={`w-full flex items-start gap-3 px-4 py-3 transition-all ${
                                  isSelected 
                                    ? `bg-gradient-to-r ${colorConfig.color} text-white shadow-lg` 
                                    : 'hover:bg-gray-100 text-gray-900'
                                }`}
                              >
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shadow-md transition-transform hover:scale-110 flex-shrink-0 ${
                                  isSelected 
                                    ? 'bg-white/20' 
                                    : `bg-gradient-to-br ${colorConfig.color}`
                                }`}>
                                  <Bot className="w-4 h-4 text-white" />
                                </div>
                                <div className="flex-1 text-left">
                                  <div className="font-semibold text-sm">{model.name}</div>
                                  <div className={`text-xs mt-0.5 ${
                                    isSelected ? 'text-white/80' : 'text-gray-500'
                                  }`}>
                                    {model.provider} • ${model.pricing.input.toFixed(2)}/M input
                                  </div>
                                </div>
                                {isSelected && (
                                  <div className="flex-shrink-0">
                                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                                  </div>
                                )}
                              </button>
                            );
                          })}
                        </div>
                        );
                      })()}
                    </div>
                  </div>

                  <button
                    onClick={() => toggleWidget(widget.id)}
                    className="relative z-10 flex-shrink-0 text-white/90 hover:text-white transition-colors p-1.5 hover:bg-white/10 rounded-lg ml-2"
                    aria-label="Hide widget"
                  >
                    <span className="text-xs font-bold">Hide</span>
                  </button>
                </div>

                {/* Messages - ChatWidget Style */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-gray-50 to-white">
                  {widget.messages.length === 0 && !widget.loading ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <div
                          className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg"
                          style={{ background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd)` }}
                        >
                          <Bot className="w-8 h-8 text-white" />
                        </div>
                        <p className="text-gray-800 font-semibold text-sm">How can I assist you today?</p>
                        <p className="text-gray-500 text-xs mt-1">Start a conversation below</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      {widget.messages.map((message, idx) => (
                        <div
                          key={idx}
                          className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : ''}`}
                        >
                          {message.role === 'assistant' && (
                            <div
                              className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-md"
                              style={{ background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd)` }}
                            >
                              <Bot className="w-4 h-4 text-white" />
                            </div>
                          )}
                          <div
                            className={`px-4 py-3 rounded-2xl shadow-md max-w-[80%] ${
                              message.role === 'assistant'
                                ? 'bg-white rounded-tl-md border border-gray-100'
                                : 'text-white rounded-tr-md'
                            }`}
                            style={message.role === 'user' ? { background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd)` } : {}}
                          >
                            <div 
                              className={`text-sm leading-relaxed ${message.role === 'assistant' ? 'text-gray-800' : ''}`}
                              style={{ whiteSpace: 'pre-wrap' }}
                              dangerouslySetInnerHTML={{ 
                                __html: message.content
                                  // Code blocks (```code```)
                                  .replace(/```([\s\S]*?)```/g, '<pre class="bg-gray-100 rounded-lg p-3 my-2 overflow-x-auto"><code class="text-xs font-mono text-gray-900">$1</code></pre>')
                                  // Inline code (`code`)
                                  .replace(/`([^`]+)`/g, '<code class="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono text-gray-900">$1</code>')
                                  // Bold (**text** or __text__)
                                  .replace(/\*\*(.+?)\*\*/g, '<strong class="font-bold text-gray-900">$1</strong>')
                                  .replace(/__(.+?)__/g, '<strong class="font-bold text-gray-900">$1</strong>')
                                  // Italic (*text* or _text_)
                                  .replace(/\*(.+?)\*/g, '<em class="italic">$1</em>')
                                  .replace(/_(.+?)_/g, '<em class="italic">$1</em>')
                                  // Strikethrough (~~text~~)
                                  .replace(/~~(.+?)~~/g, '<del class="line-through opacity-70">$1</del>')
                                  // Headers (# Header)
                                  .replace(/^### (.+)$/gm, '<h3 class="text-base font-bold text-gray-900 mt-3 mb-2">$1</h3>')
                                  .replace(/^## (.+)$/gm, '<h2 class="text-lg font-bold text-gray-900 mt-3 mb-2">$1</h2>')
                                  .replace(/^# (.+)$/gm, '<h1 class="text-xl font-bold text-gray-900 mt-3 mb-2">$1</h1>')
                                  // Links ([text](url))
                                  .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-800 underline">$1</a>')
                                  // Numbered lists (1. item)
                                  .replace(/^\d+\.\s+(.+)$/gm, '<div class="flex gap-2 my-1"><span class="flex-shrink-0 font-semibold text-gray-700">•</span><span class="flex-1">$1</span></div>')
                                  // Bullet lists (• item or - item or * item)
                                  .replace(/^[•\-\*]\s+(.+)$/gm, '<div class="flex gap-2 my-1"><span class="flex-shrink-0 text-gray-700">•</span><span class="flex-1">$1</span></div>')
                                  // Paragraph spacing
                                  .replace(/\n\n/g, '<div class="h-3"></div>')
                                  // Line breaks
                                  .replace(/\n/g, '<br/>')
                              }}
                            />
                            {message.timestamp && (
                              <span className={`text-xs mt-1 block ${message.role === 'assistant' ? 'text-gray-400' : 'text-white/70'}`}>
                                {message.timestamp}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                      {widget.loading && (
                        <div className="flex gap-3">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-md"
                            style={{ background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd)` }}
                          >
                            <Bot className="w-4 h-4 text-white" />
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
                      {widget.error && (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-600">
                          {widget.error}
                        </div>
                      )}
                      {/* Scroll anchor */}
                      <div ref={(el) => { messagesEndRefs.current[widget.id] = el; }} />
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Disabled Widgets */}
        {/* API Configuration Warning */}
        {!apiConfigured && (
          <div className="mb-6">
            <div className="bg-yellow-50 border-2 border-yellow-200 rounded-2xl p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-yellow-900">OpenRouter API Not Configured</p>
                <p className="text-xs text-yellow-700 mt-1">Set VITE_OPENROUTER_API_KEY in your .env file to enable real model comparisons.</p>
              </div>
            </div>
          </div>
        )}

        {widgets.filter(w => !w.enabled).length > 0 && (
          <div className="mb-6">
            <div className="relative bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 p-4">
              <div className="absolute inset-0 bg-gradient-to-br from-gray-50/50 to-white rounded-2xl"></div>
              <div className="relative flex items-center gap-3 flex-wrap">
                <p className="text-sm font-semibold text-gray-700">Hidden Widgets:</p>
                {widgets.filter(w => !w.enabled).map(widget => {
                  const modelConfig = getModelConfig(widget.selectedModel);
                  return (
                    <button
                      key={widget.id}
                      onClick={() => toggleWidget(widget.id)}
                      className={`inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r ${modelConfig.color} text-white rounded-xl font-semibold hover:shadow-lg transition-all hover:scale-[1.02] text-sm`}
                    >
                      <Bot className="w-4 h-4" />
                      Show {modelConfig.model.name}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="relative bg-white/70 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-200/50 p-6">
          <div className="absolute inset-0 bg-gradient-to-br from-gray-50/50 to-white rounded-3xl"></div>
          
          <div className="relative flex items-center gap-4">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder={`Type your message to test ${widgets.filter(w => w.enabled).length} active model${widgets.filter(w => w.enabled).length !== 1 ? 's' : ''} simultaneously...`}
              className="flex-1 px-6 py-4 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-primary-600 focus:border-primary-600 transition-all text-base"
            />
            <button
              onClick={handleSend}
              disabled={!inputMessage.trim() || widgets.filter(w => w.enabled).length === 0}
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-2xl font-bold hover:shadow-xl hover:shadow-primary-600/30 transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-5 h-5" />
              Send to {widgets.filter(w => w.enabled).length > 0 ? `${widgets.filter(w => w.enabled).length} Widget${widgets.filter(w => w.enabled).length !== 1 ? 's' : ''}` : 'All'}
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
