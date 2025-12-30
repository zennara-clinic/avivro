import { Link } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import { MessageSquare, ThumbsUp, TrendingUp, Bot, Plus, ExternalLink } from 'lucide-react';

export default function DashboardHome() {
  const stats = [
    { name: 'Total Conversations', value: '1,234', change: '+12%', icon: MessageSquare, color: 'bg-blue-500' },
    { name: 'Avg. CSAT Score', value: '4.8', change: '+0.3', icon: ThumbsUp, color: 'bg-blue-800' },
    { name: 'Active Agents', value: '3', change: '0', icon: Bot, color: 'bg-primary-600' },
  ];

  const recentConversations = [
    { id: '1', visitor: 'John Doe', email: 'john@example.com', agent: 'Support Assistant', status: 'resolved', time: '2 hours ago' },
    { id: '2', visitor: 'Jane Smith', email: 'jane@example.com', agent: 'Sales Helper', status: 'active', time: '4 hours ago' },
    { id: '3', visitor: 'Bob Johnson', email: 'bob@example.com', agent: 'Support Assistant', status: 'lead', time: '1 day ago' },
    { id: '4', visitor: 'Alice Williams', email: 'alice@example.com', agent: 'Support Assistant', status: 'resolved', time: '2 days ago' },
  ];

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
          <p className="text-gray-600">Welcome back! Here's what's happening with your agents.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {stats.map((stat) => (
            <div key={stat.name} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
                <div className="flex items-center gap-1 text-sm font-semibold text-green-600">
                  <TrendingUp className="w-4 h-4" />
                  {stat.change}
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</h3>
              <p className="text-sm text-gray-600">{stat.name}</p>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="bg-primary-600 rounded-xl shadow-lg p-8 mb-8 text-white">
          <h2 className="text-2xl font-bold mb-4">Create Your Next Agent</h2>
          <p className="mb-6 text-primary-50">
            Set up a new AI agent in minutes to handle different aspects of your business.
          </p>
          <Link
            to="/dashboard/agents/create"
            className="inline-flex items-center gap-2 bg-white text-primary-700 px-6 py-3 rounded-lg font-semibold hover:bg-primary-50 transition"
          >
            <Plus className="w-5 h-5" />
            Create New Agent
          </Link>
        </div>

        {/* Recent Conversations */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">Recent Conversations</h2>
            <Link
              to="/dashboard/conversations"
              className="text-sm text-primary-600 hover:text-primary-700 font-semibold flex items-center gap-1"
            >
              View All
              <ExternalLink className="w-4 h-4" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Visitor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Agent
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {recentConversations.map((conversation) => (
                  <tr key={conversation.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{conversation.visitor}</div>
                        <div className="text-sm text-gray-500">{conversation.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {conversation.agent}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          conversation.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : conversation.status === 'lead'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {conversation.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {conversation.time}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <Link
                        to={`/dashboard/conversations/${conversation.id}`}
                        className="text-primary-600 hover:text-primary-700 font-medium"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
