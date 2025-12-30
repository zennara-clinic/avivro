import { useParams, Link } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import { Bot, Globe, MessageSquare, ThumbsUp, ArrowLeft, Play, Pause, Settings as SettingsIcon, Database as DatabaseIcon, Palette, BarChart3, Code, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { db } from '../../lib/supabase';
import type { Database } from '../../types/database.types';

type Agent = Database['public']['Tables']['agents']['Row'];
type TabType = 'overview' | 'data' | 'settings' | 'analytics' | 'widget';

export default function AgentDetail() {
  const { agentId } = useParams();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAgentData();
  }, [agentId]);

  const fetchAgentData = async () => {
    if (!agentId) return;

    try {
      setLoading(true);
      const { data, error } = await db.agents.get(agentId);
      if (error) throw error;
      setAgent(data);
    } catch (err: any) {
      console.error('Error fetching agent:', err);
      setError(err.message || 'Failed to load agent data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-600 font-medium">Loading agent...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !agent) {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-3xl p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Agent</h2>
            <p className="text-gray-600 mb-6">{error || 'Agent not found'}</p>
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Agents
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const tabs = [
    { id: 'overview', name: 'Overview', icon: Bot },
    { id: 'data', name: 'Data & Knowledge', icon: DatabaseIcon },
    { id: 'settings', name: 'Settings', icon: SettingsIcon },
    { id: 'analytics', name: 'Analytics', icon: BarChart3 },
    { id: 'widget', name: 'Widget', icon: Palette },
  ];

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        {/* Back Button */}
        <Link
          to="/dashboard/agents"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Agents
        </Link>

        {/* Agent Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-primary-600 rounded-xl flex items-center justify-center">
                <Bot className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-1">{agent.name}</h1>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  {agent.website_url && (
                    <div className="flex items-center gap-1">
                      <Globe className="w-4 h-4" />
                      {agent.website_url}
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full ${
                        agent.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {agent.is_active ? (
                        <Play className="w-3 h-3" />
                      ) : (
                        <Pause className="w-3 h-3" />
                      )}
                      {agent.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Link
                to={`/dashboard/agent/${agentId}/test`}
                className="px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition"
              >
                Test Agent
              </Link>
              <Link
                to={`/dashboard/agent/${agentId}/embed`}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition"
              >
                <Code className="w-4 h-4 inline mr-2" />
                Get Embed Code
              </Link>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-200">
            <div>
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                <MessageSquare className="w-4 h-4" />
                Conversations
              </div>
              <div className="text-2xl font-bold text-gray-900">456</div>
            </div>
            <div>
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                <ThumbsUp className="w-4 h-4" />
                Satisfaction
              </div>
              <div className="text-2xl font-bold text-gray-900">4.8</div>
            </div>
            <div>
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                <Bot className="w-4 h-4" />
                Model
              </div>
              <div className="text-2xl font-bold text-gray-900">{agent.model}</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
          <div className="border-b border-gray-200 overflow-x-auto">
            <nav className="flex -mb-px">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`flex items-center gap-2 px-6 py-4 border-b-2 font-medium text-sm whitespace-nowrap transition ${
                    activeTab === tab.id
                      ? 'border-primary-600 text-primary-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                  }`}
                >
                  <tab.icon className="w-5 h-5" />
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'overview' && <OverviewTab />}
            {activeTab === 'data' && <DataTab />}
            {activeTab === 'settings' && <SettingsTab agent={agent} />}
            {activeTab === 'analytics' && <AnalyticsTab />}
            {activeTab === 'widget' && <WidgetTab />}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function OverviewTab() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-4">Agent Performance</h3>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="text-sm text-blue-700 mb-1">Avg. Response Time</div>
            <div className="text-2xl font-bold text-blue-900">1.2s</div>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="text-sm text-green-700 mb-1">Resolution Rate</div>
            <div className="text-2xl font-bold text-green-900">87%</div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="text-sm text-blue-700 mb-1">Fallback Rate</div>
            <div className="text-2xl font-bold text-blue-900">8%</div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-4">Recent Activity</h3>
        <div className="space-y-3">
          {[
            { action: 'New conversation started', time: '2 minutes ago', type: 'conversation' },
            { action: 'Positive feedback received', time: '3 hours ago', type: 'feedback' },
            { action: 'Knowledge base updated', time: '1 day ago', type: 'update' },
          ].map((activity, idx) => (
            <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className={`w-2 h-2 rounded-full ${
                activity.type === 'conversation' ? 'bg-blue-500' :
                activity.type === 'feedback' ? 'bg-blue-800' : 'bg-gray-500'
              }`} />
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900">{activity.action}</div>
                <div className="text-xs text-gray-500">{activity.time}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function DataTab() {
  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">Website Pages</h3>
          <button className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition">
            Add URL
          </button>
        </div>
        <div className="space-y-3">
          {[
            { url: 'https://example.com', status: 'completed', words: 1234, lastCrawled: '2 days ago' },
            { url: 'https://example.com/about', status: 'completed', words: 567, lastCrawled: '2 days ago' },
            { url: 'https://example.com/services', status: 'completed', words: 890, lastCrawled: '2 days ago' },
          ].map((page, idx) => (
            <div key={idx} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900 mb-1">{page.url}</div>
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span>{page.words} words</span>
                  <span>Last crawled {page.lastCrawled}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                  {page.status}
                </span>
                <button className="px-3 py-1 text-sm text-primary-600 hover:text-primary-700 font-medium">
                  Re-crawl
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">Uploaded Files</h3>
          <button className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition">
            Upload File
          </button>
        </div>
        <div className="space-y-3">
          {[
            { name: 'Product Guide.pdf', status: 'completed', words: 2345, uploaded: '1 week ago' },
            { name: 'FAQ Document.docx', status: 'completed', words: 1890, uploaded: '2 weeks ago' },
          ].map((file, idx) => (
            <div key={idx} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900 mb-1">{file.name}</div>
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span>{file.words} words</span>
                  <span>Uploaded {file.uploaded}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                  {file.status}
                </span>
                <button className="px-3 py-1 text-sm text-red-600 hover:text-red-700 font-medium">
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-4">Corrections</h3>
        <div className="text-sm text-gray-600 mb-3">
          Manual corrections help your agent learn from mistakes and improve responses.
        </div>
        <Link
          to="/dashboard/corrections"
          className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium text-sm"
        >
          Manage Corrections →
        </Link>
      </div>
    </div>
  );
}

function SettingsTab({ agent }: { agent: any }) {
  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Agent Name
        </label>
        <input
          type="text"
          defaultValue={agent.name}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-primary-600"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-3">
          Personality Preset
        </label>
        <select
          defaultValue={agent.personality.toLowerCase()}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-primary-600"
        >
          <option value="professional">Professional</option>
          <option value="friendly">Friendly</option>
          <option value="casual">Casual</option>
          <option value="technical">Technical</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Welcome Message
        </label>
        <textarea
          defaultValue="Hi! How can I help you today?"
          rows={3}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-primary-600"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Custom Instructions
        </label>
        <textarea
          placeholder="Add specific instructions for how your agent should behave..."
          rows={4}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-primary-600"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-3">
          AI Model
        </label>
        <select
          defaultValue="gpt-4"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-primary-600"
        >
          <option value="gpt-3.5-turbo">GPT-3.5 Turbo (Fast & Affordable)</option>
          <option value="gpt-4">GPT-4 (Most Capable)</option>
          <option value="claude-3-opus">Claude 3 Opus (Creative)</option>
          <option value="gemini-pro">Gemini Pro (Google)</option>
        </select>
        <p className="text-xs text-gray-500 mt-2">
          Different models have different capabilities and costs. GPT-4 is recommended for best results.
        </p>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-3">
          Language & Tone
        </label>
        <div className="grid md:grid-cols-2 gap-4">
          <select className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-primary-600">
            <option>English</option>
            <option>Spanish</option>
            <option>French</option>
            <option>German</option>
          </select>
          <select className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-primary-600">
            <option>Formal</option>
            <option>Balanced</option>
            <option>Casual</option>
          </select>
        </div>
      </div>

      <div className="pt-4">
        <button className="px-6 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition">
          Save Settings
        </button>
      </div>
    </div>
  );
}


function AnalyticsTab() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-4">Conversations Over Time</h3>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 h-64 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <BarChart3 className="w-12 h-12 mx-auto mb-2 text-gray-400" />
            <p>Chart visualization would go here</p>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-4">Top User Questions</h3>
        <div className="space-y-2">
          {[
            { question: 'What are your business hours?', count: 45 },
            { question: 'How do I reset my password?', count: 38 },
            { question: 'Where is my order?', count: 32 },
            { question: 'Do you offer refunds?', count: 28 },
            { question: 'How can I contact support?', count: 24 },
          ].map((item, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-900">{item.question}</div>
              <div className="text-sm font-semibold text-gray-700">{item.count}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-4">Fallback Rate</h3>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
            <div className="text-4xl font-bold text-yellow-900 mb-2">8%</div>
            <div className="text-sm text-yellow-700">Questions that couldn't be answered</div>
          </div>
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-4">Correction Usage</h3>
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
            <div className="text-4xl font-bold text-green-900 mb-2">12</div>
            <div className="text-sm text-green-700">Active corrections applied</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function WidgetTab() {
  return (
    <div className="grid lg:grid-cols-2 gap-8">
      <div className="space-y-6">
        <h3 className="text-lg font-bold text-gray-900">Customize Widget</h3>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Primary Color
          </label>
          <div className="flex gap-3 items-center">
            <input type="color" defaultValue="#4f46e5" className="w-16 h-12 rounded-lg cursor-pointer" />
            <input type="text" defaultValue="#4f46e5" className="flex-1 px-4 py-3 border border-gray-300 rounded-lg font-mono" />
          </div>
        </div>

        <div>
          <label className="flex items-center gap-3 mb-4">
            <input type="checkbox" defaultChecked className="w-5 h-5 text-primary-600 rounded" />
            <span className="font-semibold text-gray-700">Show Logo</span>
          </label>
          <button className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-600 hover:border-primary-600 hover:text-primary-600 transition">
            Upload Logo (Optional)
          </button>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Position
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button className="p-4 border-2 border-primary-600 bg-primary-50 rounded-lg font-medium">
              Bottom Right
            </button>
            <button className="p-4 border-2 border-gray-200 rounded-lg font-medium hover:border-gray-300">
              Bottom Left
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Bubble Text
          </label>
          <input
            type="text"
            defaultValue="Chat with us!"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-primary-600"
          />
        </div>

        <div className="pt-4">
          <button className="w-full px-6 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition">
            Save Appearance
          </button>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-4">Live Preview</h3>
        <div className="bg-gray-100 rounded-lg p-8 h-96 relative">
          <div className="absolute bottom-8 right-8">
            <div className="bg-primary-600 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg mb-2 animate-bounce">
              Chat with us!
            </div>
            <button className="w-14 h-14 bg-primary-600 rounded-full flex items-center justify-center text-white shadow-lg hover:scale-110 transition">
              <MessageSquare className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
