import { Link, useParams } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import { ArrowLeft, ThumbsUp, ThumbsDown, Edit, Download, Mail, User, Globe, Clock, MessageSquare } from 'lucide-react';
import { useState } from 'react';

export default function ConversationDetail() {
  const { id } = useParams();
  const [showCorrectionModal, setShowCorrectionModal] = useState(false);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);

  const conversation = {
    id: id || '1',
    visitorName: 'John Doe',
    visitorEmail: 'john@example.com',
    visitorPhone: '+1 (555) 123-4567',
    location: 'New York, USA',
    agentName: 'Support Assistant',
    status: 'active',
    startedAt: 'Dec 24, 2024 10:30 AM',
    duration: '15 minutes',
    messages: [
      {
        id: 'm1',
        role: 'user',
        content: 'Hi, I need help with my account',
        timestamp: '10:30 AM',
      },
      {
        id: 'm2',
        role: 'assistant',
        content: 'Hello! I\'d be happy to help you with your account. What specific issue are you experiencing?',
        timestamp: '10:30 AM',
        feedback: 'positive' as const,
      },
      {
        id: 'm3',
        role: 'user',
        content: 'I can\'t reset my password. The reset link doesn\'t work.',
        timestamp: '10:31 AM',
      },
      {
        id: 'm4',
        role: 'assistant',
        content: 'I understand the frustration. Let me help you with that. Can you tell me which email address you\'re using for your account?',
        timestamp: '10:31 AM',
      },
      {
        id: 'm5',
        role: 'user',
        content: 'It\'s john@example.com',
        timestamp: '10:32 AM',
      },
      {
        id: 'm6',
        role: 'assistant',
        content: 'Thank you. I can see your account. The password reset link should arrive within 5 minutes. Please check your spam folder if you don\'t see it in your inbox. Is there anything else I can help you with?',
        timestamp: '10:33 AM',
        feedback: 'negative' as const,
      },
    ],
  };

  const handleCreateCorrection = (messageId: string) => {
    setSelectedMessageId(messageId);
    setShowCorrectionModal(true);
  };

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <Link
          to="/dashboard/conversations"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Conversations
        </Link>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Conversation Header */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary-600 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                    {conversation.visitorName.charAt(0)}
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-gray-900">{conversation.visitorName}</h1>
                    <p className="text-sm text-gray-500">Conversation with {conversation.agentName}</p>
                  </div>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition">
                  <Download className="w-4 h-4" />
                  Export
                </button>
              </div>

              <div className="flex items-center gap-4 text-sm">
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
                <span className="text-gray-600">Started: {conversation.startedAt}</span>
                <span className="text-gray-600">Duration: {conversation.duration}</span>
              </div>
            </div>

            {/* Messages */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-6">Message History</h2>
              <div className="space-y-6">
                {conversation.messages.map((message) => (
                  <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-start' : 'justify-end'}`}>
                    <div className={`max-w-2xl ${message.role === 'assistant' ? 'w-full' : ''}`}>
                      <div
                        className={`px-4 py-3 rounded-lg ${
                          message.role === 'user'
                            ? 'bg-gray-100 text-gray-900'
                            : 'bg-primary-600 text-white'
                        }`}
                      >
                        <p className="text-sm leading-relaxed">{message.content}</p>
                        <p className={`text-xs mt-2 ${message.role === 'user' ? 'text-gray-500' : 'text-primary-100'}`}>
                          {message.timestamp}
                        </p>
                      </div>

                      {/* Feedback for bot messages */}
                      {message.role === 'assistant' && (
                        <div className="flex items-center gap-2 mt-2">
                          <button
                            className={`p-1.5 rounded transition ${
                              message.feedback === 'positive'
                                ? 'bg-green-100 text-green-600'
                                : 'text-gray-400 hover:bg-gray-100'
                            }`}
                            title="Positive feedback"
                          >
                            <ThumbsUp className="w-4 h-4" />
                          </button>
                          <button
                            className={`p-1.5 rounded transition ${
                              message.feedback === 'negative'
                                ? 'bg-red-100 text-red-600'
                                : 'text-gray-400 hover:bg-gray-100'
                            }`}
                            title="Negative feedback"
                          >
                            <ThumbsDown className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleCreateCorrection(message.id)}
                            className="p-1.5 text-gray-400 hover:bg-gray-100 rounded transition ml-2"
                            title="Create correction"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Visitor Information */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="font-bold text-gray-900 mb-4">Visitor Information</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <User className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-sm text-gray-500">Name</div>
                    <div className="text-sm font-medium text-gray-900">{conversation.visitorName}</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-sm text-gray-500">Email</div>
                    <div className="text-sm font-medium text-gray-900">{conversation.visitorEmail}</div>
                  </div>
                </div>
                {conversation.visitorPhone && (
                  <div className="flex items-start gap-3">
                    <MessageSquare className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="text-sm text-gray-500">Phone</div>
                      <div className="text-sm font-medium text-gray-900">{conversation.visitorPhone}</div>
                    </div>
                  </div>
                )}
                <div className="flex items-start gap-3">
                  <Globe className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-sm text-gray-500">Location</div>
                    <div className="text-sm font-medium text-gray-900">{conversation.location}</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-sm text-gray-500">Started At</div>
                    <div className="text-sm font-medium text-gray-900">{conversation.startedAt}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Conversation Stats */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="font-bold text-gray-900 mb-4">Conversation Stats</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total Messages</span>
                  <span className="text-sm font-semibold text-gray-900">{conversation.messages.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Duration</span>
                  <span className="text-sm font-semibold text-gray-900">{conversation.duration}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Response Time</span>
                  <span className="text-sm font-semibold text-gray-900">1.2s avg</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="font-bold text-gray-900 mb-4">Actions</h3>
              <div className="space-y-2">
                <button className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition">
                  Mark as Resolved
                </button>
                <button className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition">
                  Add to CRM
                </button>
                <button className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition">
                  Send Email
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Correction Modal */}
        {showCorrectionModal && (
          <div className="fixed inset-0 bg-gray-900/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Create Correction</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Original Question
                  </label>
                  <input
                    type="text"
                    defaultValue="How do I reset my password?"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-primary-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Corrected Answer
                  </label>
                  <textarea
                    rows={5}
                    placeholder="Enter the correct answer that should be used for this question..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-primary-600"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setShowCorrectionModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => setShowCorrectionModal(false)}
                    className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition"
                  >
                    Create Correction
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
