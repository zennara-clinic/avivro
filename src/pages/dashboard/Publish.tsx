import DashboardLayout from '../../components/DashboardLayout';
import ChatWidget from '../../components/ChatWidget';
import { Rocket, Code, Palette, Upload, Eye, Sparkles, ChevronDown, Zap, DollarSign, Save, CheckCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { OPENROUTER_MODELS, getModelById, type LLMModel } from '../../config/llm-models';
import { db } from '../../lib/supabase';
import { toast } from 'sonner';
import AgentConfiguration from '../../components/publish/AgentConfiguration';

export default function Publish() {
  const { agentId } = useParams();
  const [activeTab, setActiveTab] = useState<'deploy' | 'styling'>('deploy');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [agent, setAgent] = useState<any>(null);
  const [logoFile, setLogoFile] = useState<string>('');
  const [brandColor, setBrandColor] = useState('#3B82F6');
  const [showPoweredBy, setShowPoweredBy] = useState(true);
  const [captureLeads, setCaptureLeads] = useState(true);
  const [welcomeMessage, setWelcomeMessage] = useState('Hi! How can I help you today?');
  const [agentName, setAgentName] = useState('Support Assistant');
  const [personality, setPersonality] = useState('professional');
  const [customInstructions, setCustomInstructions] = useState('');
  const [aiModel, setAiModel] = useState(OPENROUTER_MODELS[0].id);
  const [aiModelOpen, setAiModelOpen] = useState(false);
  const [aiModelSearchTerm, setAiModelSearchTerm] = useState('');
  const [modelFilterType, setModelFilterType] = useState<'all' | 'free' | 'recommended'>('recommended');
  const [testMessage, setTestMessage] = useState('');
  const [testMessages, setTestMessages] = useState<Array<{role: 'user' | 'bot', content: string, time: string}>>([]);
  const [widgetPosition, setWidgetPosition] = useState<'bottom-right' | 'bottom-left'>('bottom-right');

  // Load agent data
  useEffect(() => {
    if (agentId) {
      loadAgentData();
    }
  }, [agentId]);

  const loadAgentData = async () => {
    try {
      setLoading(true);
      const { data, error } = await db.agents.get(agentId!);
      
      if (error || !data) {
        toast.error('Failed to load agent data');
        return;
      }

      setAgent(data);
      setAgentName(data.name);
      setBrandColor(data.primary_color || '#3B82F6');
      setLogoFile(data.avatar_url || '');
      setShowPoweredBy(data.show_branding !== false);
      setCaptureLeads(data.enable_lead_capture !== false);
      setWelcomeMessage(data.welcome_message || 'Hi! How can I help you today?');
      setPersonality(data.tone || 'professional');
      setCustomInstructions(data.system_prompt || '');
      setAiModel(data.ai_model || OPENROUTER_MODELS[0].id);
      setWidgetPosition(data.widget_position || 'bottom-right');
    } catch (err) {
      console.error('Error loading agent:', err);
      toast.error('Error loading agent data');
    } finally {
      setLoading(false);
    }
  };

  const saveConfiguration = async () => {
    try {
      setSaving(true);
      const { error } = await db.agents.update(agentId!, {
        name: agentName,
        ai_model: aiModel,
        temperature: 0.7,
        max_tokens: 2000,
        primary_color: brandColor,
        avatar_url: logoFile,
        welcome_message: welcomeMessage,
        widget_position: widgetPosition,
        tone: personality,
        system_prompt: customInstructions,
        show_branding: showPoweredBy,
        enable_lead_capture: captureLeads,
      });

      if (error) {
        throw error;
      }

      toast.success('Configuration saved successfully! Your widget will use ' + (getSelectedModel()?.name || 'the selected AI model') + '.');
      await loadAgentData();
    } catch (err) {
      console.error('Error saving configuration:', err);
      toast.error('Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  const getSelectedModel = (): LLMModel | undefined => getModelById(aiModel);
  
  const getFilteredModels = () => {
    let models = OPENROUTER_MODELS;
    
    if (modelFilterType === 'free') {
      models = models.filter(m => m.pricing.input === 0 && m.pricing.output === 0);
    } else if (modelFilterType === 'recommended') {
      models = models.filter(m => m.recommended);
    }
    
    if (aiModelSearchTerm) {
      models = models.filter(m => 
        m.name.toLowerCase().includes(aiModelSearchTerm.toLowerCase()) ||
        m.provider.toLowerCase().includes(aiModelSearchTerm.toLowerCase()) ||
        m.description.toLowerCase().includes(aiModelSearchTerm.toLowerCase())
      );
    }
    
    return models;
  };
  
  const filteredModels = getFilteredModels();

  const handleSendTestMessage = async () => {
    if (!testMessage.trim() || !agentId) return;
    
    const now = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    const userMsg = { role: 'user' as const, content: testMessage, time: now };
    setTestMessages([...testMessages, userMsg]);
    const currentMessage = testMessage;
    setTestMessage('');
    
    // Add loading indicator
    setTestMessages(prev => [...prev, {
      role: 'bot' as const,
      content: '...',
      time: now
    }]);
    
    try {
      // Use Supabase Edge Function
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const response = await fetch(`${supabaseUrl}/functions/v1/chat/${agentId}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          message: currentMessage,
          sessionId: 'preview_' + Date.now(),
        }),
      });
      
      // Check if API endpoint exists
      if (response.status === 404) {
        setTestMessages(prev => {
          const filtered = prev.filter(m => m.content !== '...');
          return [...filtered, {
            role: 'bot' as const,
            content: '⚠️ Preview mode: API endpoint not configured yet. Your deployed widget will respond with AI using ' + (getSelectedModel()?.name || 'the selected model') + '. Please set up the backend to test responses.',
            time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
          }];
        });
        return;
      }
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Remove loading, add real response
      setTestMessages(prev => {
        const filtered = prev.filter(m => m.content !== '...');
        return [...filtered, {
          role: 'bot' as const,
          content: data.response || 'Sorry, I encountered an error.',
          time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
        }];
      });
    } catch (err) {
      console.error('Test message error:', err);
      setTestMessages(prev => {
        const filtered = prev.filter(m => m.content !== '...');
        return [...filtered, {
          role: 'bot' as const,
          content: '⚠️ Preview mode: Backend API not available. Your deployed widget will use ' + (getSelectedModel()?.name || 'the selected AI model') + ' to respond.',
          time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
        }];
      });
    }
  };

  useEffect(() => {
    const styleId = 'chatbot-scrollbar-style';
    let styleEl = document.getElementById(styleId) as HTMLStyleElement;
    
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = styleId;
      document.head.appendChild(styleEl);
    }
    
    styleEl.textContent = `
      .chatbot-scrollbar::-webkit-scrollbar {
        width: 8px;
      }
      .chatbot-scrollbar::-webkit-scrollbar-track {
        background: #e5e7eb;
        border-radius: 10px;
      }
      .chatbot-scrollbar::-webkit-scrollbar-thumb {
        background: ${brandColor};
        border-radius: 10px;
      }
      .chatbot-scrollbar::-webkit-scrollbar-thumb:hover {
        background: ${brandColor}dd;
      }
    `;
  }, [brandColor]);

  const embedCode = `<!-- Avivro Chatbot Widget -->
<script 
  src="${window.location.origin}/widget-loader.js"
  data-agent-id="${agentId || 'your-agent-id'}"
  data-primary-color="${brandColor}"
  data-agent-name="${agentName}"
  data-welcome-message="${welcomeMessage}"
  ${logoFile ? `data-logo-url="${logoFile}"` : ''}
  data-position="${widgetPosition}"
  data-show-powered-by="${showPoweredBy}"
  data-capture-leads="${captureLeads}"
  data-api-url="${import.meta.env.VITE_SUPABASE_URL}"
  async
></script>`;

  const reactEmbedCode = `import ChatWidget from './components/ChatWidget';

function App() {
  return (
    <div>
      {/* Your app content */}
      
      <ChatWidget
        agentId="${agentId || 'your-agent-id'}"
        apiUrl="${window.location.origin}"
        primaryColor="${brandColor}"
        agentName="${agentName}"
        welcomeMessage="${welcomeMessage}"
        ${logoFile ? `logoUrl="${logoFile}"` : ''}
        position="${widgetPosition}"
        captureLeads={${captureLeads}}
        showPoweredBy={${showPoweredBy}}
      />
    </div>
  );
}`;

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Code copied to clipboard!');
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading agent configuration...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!agent) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <p className="text-gray-600">Agent not found</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-600 to-orange-700 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-600/30">
              <Rocket className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900">Publish Chatbot</h1>
              <p className="text-lg text-gray-600">Deploy and customize your chatbot widget</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="flex gap-3">
            <button
              onClick={() => setActiveTab('deploy')}
              className={`px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2 ${
                activeTab === 'deploy'
                  ? 'bg-gradient-to-r from-orange-600 to-orange-700 text-white shadow-lg shadow-orange-600/30'
                  : 'bg-white text-gray-600 border-2 border-gray-200 hover:border-orange-300'
              }`}
            >
              <Code className="w-5 h-5" />
              Deploy
            </button>
            <button
              onClick={() => setActiveTab('styling')}
              className={`px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2 ${
                activeTab === 'styling'
                  ? 'bg-gradient-to-r from-orange-600 to-orange-700 text-white shadow-lg shadow-orange-600/30'
                  : 'bg-white text-gray-600 border-2 border-gray-200 hover:border-orange-300'
              }`}
            >
              <Palette className="w-5 h-5" />
              Configuration
            </button>
          </div>
        </div>

        {/* Deploy Tab */}
        {activeTab === 'deploy' && (
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Live Preview */}
            <div className="bg-white/70 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-200/50 p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center">
                  <Eye className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Live Preview</h2>
              </div>
              <p className="text-sm text-gray-600 mb-4">Interact with your chatbot exactly as your users will see it</p>
              {/* Real ChatWidget Component */}
              <div className="relative">
                <ChatWidget
                  agentId={agentId || ''}
                  apiUrl={window.location.origin}
                  primaryColor={brandColor}
                  agentName={agentName}
                  welcomeMessage={welcomeMessage}
                  logoUrl={logoFile}
                  position="bottom-right"
                  showPoweredBy={showPoweredBy}
                  captureLeads={captureLeads}
                />
              </div>
            </div>

            {/* Embed Code */}
            <div className="bg-white/70 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-200/50 p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-green-600 to-green-700 rounded-xl flex items-center justify-center">
                  <Code className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Embed Code</h2>
              </div>
              <p className="text-gray-600 mb-6">
                Copy and paste this code into your website's HTML, just before the closing &lt;/body&gt; tag.
              </p>
              
              {/* Embed Code */}
              <div>
                <div className="relative">
                  <pre className="bg-gray-900 text-green-400 p-6 rounded-2xl overflow-x-auto text-sm font-mono">
                    <code>{embedCode}</code>
                  </pre>
                  <button
                    onClick={() => handleCopyCode(embedCode)}
                    className="absolute top-4 right-4 px-4 py-2 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-all hover:scale-105 flex items-center gap-2"
                  >
                    <Code className="w-4 h-4" />
                    Copy Code
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* Styling & Branding Tab */}
        {activeTab === 'styling' && (
          <div className="space-y-6">
            {/* Agent Configuration Component */}
            <div className="bg-white/70 backdrop-blur-sm rounded-3xl shadow-xl border border-orange-200/50 p-8">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Agent Configuration</h2>
                  <p className="text-sm text-gray-600">Customize your AI agent's behavior and personality</p>
                </div>
              </div>
              
              <AgentConfiguration 
                agentId={agentId!} 
                onSave={() => {
                  loadAgentData();
                  toast.success('Configuration updated! Changes will be reflected in your widget.');
                }}
              />
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
