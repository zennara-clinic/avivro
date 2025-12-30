import { Link, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { MessageSquare, Users, ThumbsUp, TrendingUp, Bot, ExternalLink, ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import { db } from '../../lib/supabase';
import type { Database } from '../../types/database.types';

type Agent = Database['public']['Tables']['agents']['Row'];
type Conversation = Database['public']['Tables']['conversations']['Row'];
type DashboardSummary = Database['public']['Views']['agent_dashboard_summary']['Row'];

export default function AgentDashboard() {
  const { agentId } = useParams();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!agentId) return;

    async function fetchDashboardData() {
      try {
        setLoading(true);
        setError(null);

        // Fetch agent details
        const { data: agentData, error: agentError } = await db.agents.get(agentId);
        if (agentError) throw agentError;
        setAgent(agentData);

        // Fetch dashboard summary
        const { data: summaryData, error: summaryError } = await db.agents.getDashboardSummary(agentId);
        if (summaryError) throw summaryError;
        setSummary(summaryData);

        // Fetch recent conversations
        const { data: conversationsData, error: conversationsError } = await db.conversations.list(agentId, {
          limit: 4,
        });
        if (conversationsError) throw conversationsError;
        setConversations(conversationsData || []);
      } catch (err: any) {
        console.error('Error fetching dashboard data:', err);
        setError(err.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, [agentId]);

  // Calculate percentage changes (you can enhance this with historical data)
  const getPercentageChange = (value: number) => {
    // Mock calculation - replace with actual historical comparison
    const change = Math.floor(Math.random() * 30) - 5;
    return change > 0 ? `+${change}%` : `${change}%`;
  };

  // Format relative time
  const getRelativeTime = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    return `${diffDays} days ago`;
  };

  const stats = [
    { 
      name: 'Total Conversations', 
      value: summary?.total_conversations?.toString() || '0', 
      change: summary?.total_conversations ? getPercentageChange(summary.total_conversations) : '0', 
      icon: MessageSquare, 
      color: 'bg-blue-500' 
    },
    { 
      name: 'Avg. CSAT Score', 
      value: summary?.average_sentiment?.toFixed(1) || '0.0', 
      change: summary?.average_sentiment ? `+${(summary.average_sentiment * 0.1).toFixed(1)}` : '0', 
      icon: ThumbsUp, 
      color: 'bg-blue-800' 
    },
    { 
      name: 'Active Status', 
      value: agent?.status || 'Offline', 
      change: '0', 
      icon: Bot, 
      color: 'bg-primary-600' 
    },
  ];

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-primary-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-600 font-medium">Loading dashboard data...</p>
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
            <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Dashboard</h2>
            <p className="text-gray-600 mb-6">{error || 'Agent not found'}</p>
            <Link
              to="/dashboard/agents"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Agents
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        {/* Back Button */}
        <Link 
          to="/dashboard/agents" 
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Agents
        </Link>

        {/* Header with Agent Name */}
        <div className="mb-10">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-primary-600 to-primary-700 rounded-2xl flex items-center justify-center shadow-lg shadow-primary-600/30">
              <Bot className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-1">{agent.name}</h1>
              <p className="text-lg text-gray-600">Agent performance overview</p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {stats.map((stat, index) => {
            const gradients = [
              'from-blue-50/50 to-white',
              'from-green-50/50 to-white',
              'from-purple-50/50 to-white',
              'from-primary-50/50 to-white'
            ];
            const iconColors = [
              'from-blue-600 to-blue-700',
              'from-green-600 to-green-700',
              'from-purple-600 to-purple-700',
              'from-primary-600 to-primary-700'
            ];
            const shadowColors = [
              'shadow-blue-600/30',
              'shadow-green-600/30',
              'shadow-purple-600/30',
              'shadow-primary-600/30'
            ];
            
            return (
              <div key={stat.name} className="relative bg-white/70 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-200/50 p-6 overflow-hidden hover:scale-[1.02] transition-transform">
                <div className={`absolute inset-0 bg-gradient-to-br ${gradients[index]} rounded-3xl`}></div>
                
                <div className="relative">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-14 h-14 bg-gradient-to-br ${iconColors[index]} rounded-2xl flex items-center justify-center shadow-lg ${shadowColors[index]}`}>
                      <stat.icon className="w-7 h-7 text-white" />
                    </div>
                    {stat.change !== '0' && (
                      <div className="flex items-center gap-1 px-3 py-1.5 bg-green-100 text-green-700 rounded-xl text-sm font-bold">
                        <TrendingUp className="w-4 h-4" />
                        {stat.change}
                      </div>
                    )}
                  </div>
                  <h3 className="text-3xl font-bold text-gray-900 mb-2">{stat.value}</h3>
                  <p className="text-sm text-gray-600 font-medium">{stat.name}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Recent Conversations */}
        <div className="bg-white/70 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-200/50 overflow-hidden">
          <div className="px-8 py-6 border-b border-gray-200/50 bg-gradient-to-r from-gray-50 to-white flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Recent Conversations</h2>
            <Link
              to={`/dashboard/agent/${agentId}/conversations`}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 transition-all hover:shadow-lg hover:shadow-primary-600/30"
            >
              View All
              <ExternalLink className="w-4 h-4" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-200">
                  <th className="px-8 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Chat ID
                  </th>
                  <th className="px-8 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-8 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Time
                  </th>
                  <th className="px-8 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200/50">
                {conversations.length > 0 ? (
                  conversations.map((conversation) => (
                    <tr key={conversation.id} className="hover:bg-gradient-to-r hover:from-primary-50/30 hover:to-blue-50/30 transition-colors">
                      <td className="px-8 py-5 whitespace-nowrap">
                        <div className="text-base font-semibold text-gray-900">
                          {conversation.id.substring(0, 13).toUpperCase()}
                        </div>
                      </td>
                      <td className="px-8 py-5 whitespace-nowrap">
                        <span
                          className={`inline-flex px-3 py-1.5 text-xs font-bold rounded-xl ${
                            conversation.status === 'active'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {conversation.status || 'resolved'}
                        </span>
                      </td>
                      <td className="px-8 py-5 whitespace-nowrap text-base text-gray-600 font-medium">
                        {getRelativeTime(conversation.started_at)}
                      </td>
                      <td className="px-8 py-5 whitespace-nowrap text-sm">
                        <Link
                          to={`/dashboard/agent/${agentId}/conversations/${conversation.id}`}
                          className="inline-flex items-center gap-1 text-primary-600 hover:text-primary-700 font-bold transition-colors"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-8 py-12 text-center">
                      <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-500 font-medium">No conversations yet</p>
                      <p className="text-sm text-gray-400">Conversations will appear here once users interact with your agent</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
