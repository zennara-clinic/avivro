import DashboardLayout from '../../components/DashboardLayout';
import { UserPlus, Search, Mail, Phone, MessageSquare, Loader2, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useLeads } from '../../lib/hooks/useLeads';
import { formatDistanceToNow } from 'date-fns';
import type { Database } from '../../types/database.types';

type Lead = Database['public']['Tables']['leads']['Row'];

export default function Leads() {
  const { agentId } = useParams();
  const [searchQuery, setSearchQuery] = useState('');

  const { data: leads, isLoading, error } = useLeads(agentId!, {
    searchTerm: searchQuery || undefined,
  });

  // Format relative time
  const getRelativeTime = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return 'N/A';
    }
  };

  const leadsData = (leads || []) as Lead[];
  
  const stats = {
    total: leadsData.length,
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-600 font-medium">Loading leads...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-3xl p-8 text-center">
            <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Leads</h2>
            <p className="text-gray-600 mb-6">{error.message || 'Failed to load leads'}</p>
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
            <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-purple-700 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-600/30">
              <UserPlus className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900">Leads</h1>
              <p className="text-lg text-gray-600">Manage leads collected from your chatbot</p>
            </div>
          </div>
        </div>

        {/* Stats Card */}
        <div className="mb-6">
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-purple-200/50 p-5 inline-block">
            <div className="text-xs font-bold text-purple-600 uppercase tracking-wider mb-2">Total Leads</div>
            <div className="text-3xl font-bold text-purple-900">{stats.total}</div>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 p-6 mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search leads by name, email, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-600 focus:border-purple-600 transition-all"
            />
          </div>
        </div>

        {/* Leads Table */}
        <div className="bg-white/70 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-200/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-purple-50 to-purple-100/50">
                <tr>
                  <th className="px-8 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-8 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-8 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Phone
                  </th>
                  <th className="px-8 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Message
                  </th>
                  <th className="px-8 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Chat ID
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {leadsData.length > 0 ? (
                  leadsData.map((lead) => (
                    <tr key={lead.id} className="hover:bg-purple-50/30 transition-colors">
                      <td className="px-8 py-5">
                        <div className="font-bold text-gray-900 text-base">{lead.name || 'N/A'}</div>
                        <div className="text-xs text-gray-500 mt-1">{getRelativeTime(lead.created_at)}</div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                          <Mail className="w-4 h-4 text-gray-400" />
                          <span>{lead.email || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="px-8 py-5 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                          <Phone className="w-4 h-4 text-gray-400" />
                          <span>{lead.phone || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="max-w-xs">
                          <div className="flex items-start gap-2">
                            <MessageSquare className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0" />
                            <p className="text-sm text-gray-700">
                              {lead.notes || (lead.custom_fields && typeof lead.custom_fields === 'object' && 'message' in lead.custom_fields ? String(lead.custom_fields.message) : 'No message')}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5 whitespace-nowrap">
                        <span className="text-sm font-mono text-purple-600">
                          {lead.conversation_id ? lead.conversation_id.substring(0, 13).toUpperCase() : 'N/A'}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : null}
              </tbody>
            </table>
          </div>

          {leadsData.length === 0 && (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <UserPlus className="w-10 h-10 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No Leads Found</h3>
              <p className="text-gray-600">
                {searchQuery ? 'Try adjusting your search query' : 'Leads will appear here once collected from your chatbot'}
              </p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
