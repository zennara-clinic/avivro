import { Link } from 'react-router-dom';
import MainDashboardLayout from '../../components/MainDashboardLayout';
import { Bot, Plus, Search, Play, Pause, MessageSquare, Globe, ArrowRight, Zap, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useAuth, useAgents, useDeleteAgent } from '../../lib/hooks';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

export default function AgentsListing() {
  const [searchQuery, setSearchQuery] = useState('');
  const { user } = useAuth();
  const { data: agents, isLoading, error } = useAgents(user?.id);
  const deleteAgent = useDeleteAgent();

  const filteredAgents = agents?.filter((agent) =>
    agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    agent.website_url?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const handleDeleteAgent = async (agentId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (confirm('Are you sure you want to delete this agent?')) {
      try {
        await deleteAgent.mutateAsync(agentId);
        toast.success('Agent deleted successfully');
      } catch (error) {
        toast.error('Failed to delete agent');
      }
    }
  };

  return (
    <MainDashboardLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-3">Your Agents</h1>
              <p className="text-lg text-gray-600">Manage and monitor all your AI agents</p>
            </div>
            <Link
              to="/dashboard/agents/create"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-primary-600 to-primary-700 text-white px-8 py-4 rounded-2xl font-bold hover:shadow-2xl hover:shadow-primary-600/40 transition-all hover:scale-[1.02]"
            >
              <Plus className="w-5 h-5" />
              Create New Agent
            </Link>
          </div>
        </div>

        {/* Search */}
        <div className="mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search agents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-primary-600 focus:border-primary-600 transition-all text-base shadow-sm"
            />
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-10 h-10 text-primary-600 animate-spin" />
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-20">
            <p className="text-red-600 mb-4">Failed to load agents</p>
            <button
              onClick={() => window.location.reload()}
              className="text-primary-600 hover:text-primary-700 font-semibold"
            >
              Try again
            </button>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && filteredAgents.length === 0 && !searchQuery && (
          <div className="text-center py-20">
            <Bot className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-900 mb-2">No agents yet</h3>
            <p className="text-gray-600 mb-6">Create your first AI agent to get started</p>
            <Link
              to="/dashboard/agents/create"
              className="inline-flex items-center gap-2 bg-primary-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-primary-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Create Agent
            </Link>
          </div>
        )}

        {/* No Search Results */}
        {!isLoading && !error && filteredAgents.length === 0 && searchQuery && (
          <div className="text-center py-20">
            <p className="text-gray-600">No agents match your search</p>
          </div>
        )}

        {/* Agents Grid */}
        {!isLoading && !error && filteredAgents.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredAgents.map((agent) => (
              <Link
                key={agent.id}
                to={`/dashboard/agent/${agent.id}`}
                className="group relative bg-white/70 backdrop-blur-sm rounded-3xl shadow-lg border border-gray-200/50 p-8 hover:shadow-2xl hover:shadow-primary-600/10 transition-all hover:scale-[1.02] hover:border-primary-300"
              >
                {/* Gradient Background on Hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary-50/0 to-primary-50/0 group-hover:from-primary-50/50 group-hover:to-blue-50/50 rounded-3xl transition-all"></div>
                
                <div className="relative">
                  {/* Agent Icon & Status */}
                  <div className="flex items-start justify-between mb-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-primary-600 to-primary-700 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg shadow-primary-600/30">
                      <Bot className="w-8 h-8 text-white" />
                    </div>
                    <span
                      className={`px-4 py-2 rounded-xl text-sm font-bold ${
                        agent.is_published
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {agent.is_published ? (
                        <span className="flex items-center gap-2">
                          <Play className="w-4 h-4 fill-current" />
                          Published
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <Pause className="w-4 h-4" />
                          Draft
                        </span>
                      )}
                    </span>
                  </div>

                  {/* Agent Details */}
                  <div className="mb-6">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors">
                      {agent.name}
                    </h3>
                    
                    {agent.website_url && (
                      <div className="flex items-center gap-2 text-sm text-gray-500 mt-2">
                        <Globe className="w-4 h-4" />
                        <span className="font-medium">{agent.website_url}</span>
                      </div>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4 mb-6 pb-6 border-b border-gray-200">
                    <div className="bg-gradient-to-br from-primary-50 to-blue-50 rounded-2xl p-4">
                      <MessageSquare className="w-5 h-5 text-primary-600 mb-2" />
                      <div className="text-2xl font-bold text-gray-900">{agent.total_conversations || 0}</div>
                      <div className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Conversations</div>
                    </div>
                    <div className="bg-gradient-to-br from-primary-50 to-blue-50 rounded-2xl p-4">
                      <Zap className="w-5 h-5 text-primary-600 mb-2" />
                      <div className="text-2xl font-bold text-gray-900">{agent.total_messages || 0}</div>
                      <div className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Messages</div>
                    </div>
                  </div>

                  {/* Last Active */}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">
                      {agent.updated_at 
                        ? `Updated ${formatDistanceToNow(new Date(agent.updated_at), { addSuffix: true })}`
                        : 'Just created'
                      }
                    </span>
                    <ArrowRight className="w-5 h-5 text-primary-600 group-hover:text-primary-700" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </MainDashboardLayout>
  );
}
