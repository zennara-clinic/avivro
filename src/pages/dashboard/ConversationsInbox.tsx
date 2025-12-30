import { useParams } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import { Search, Download, MessageSquare, Clock, Hash, UserCircle, Send, Loader2, AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useConversations, useConversationRealtime } from '../../lib/hooks';
import { useMessages, useMessagesRealtime, useCreateMessage } from '../../lib/hooks/useMessages';
import { formatDistanceToNow } from 'date-fns';
import type { Database } from '../../types/database.types';

type Message = Database['public']['Tables']['messages']['Row'];
type Conversation = Database['public']['Tables']['conversations']['Row'];

export default function ConversationsInbox() {
  const { agentId } = useParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [humanJoined, setHumanJoined] = useState<Record<string, boolean>>({});
  const [humanMessage, setHumanMessage] = useState('');

  const { data: conversations, isLoading, error } = useConversations(agentId!, {
    searchTerm: searchQuery || undefined,
  });

  // Enable real-time updates for conversations
  useConversationRealtime(agentId!);

  // Fetch messages for selected conversation
  const { data: messages, isLoading: messagesLoading } = useMessages(selectedConversationId || undefined);
  useMessagesRealtime(selectedConversationId || undefined);

  const createMessage = useCreateMessage();

  // Auto-select first conversation when data loads
  useEffect(() => {
    const convs = (conversations || []) as Conversation[];
    if (convs.length > 0 && !selectedConversationId) {
      setSelectedConversationId(convs[0].id);
    }
  }, [conversations, selectedConversationId]);

  // Format relative time
  const getRelativeTime = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return 'N/A';
    }
  };

  // Format time
  const formatTime = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch {
      return 'N/A';
    }
  };

  const filteredConversations = ((conversations || []) as Conversation[]).filter((conv) => {
    if (!searchQuery) return true;
    const search = searchQuery.toLowerCase();
    return (
      conv.id.toLowerCase().includes(search) ||
      conv.visitor_name?.toLowerCase().includes(search) ||
      conv.visitor_email?.toLowerCase().includes(search)
    );
  });

  const selectedConv = ((conversations || []) as Conversation[]).find((c) => c.id === selectedConversationId);
  const isHumanInChat = selectedConversationId ? humanJoined[selectedConversationId] || false : false;
  const currentMessages = messages || [];

  const handleJoinAsHuman = () => {
    if (selectedConversationId) {
      setHumanJoined(prev => ({ ...prev, [selectedConversationId]: true }));
    }
  };

  const handleLeaveChat = () => {
    if (selectedConversationId) {
      setHumanJoined(prev => ({ ...prev, [selectedConversationId]: false }));
    }
  };

  const handleSendMessage = async () => {
    if (!humanMessage.trim() || !selectedConversationId) return;
    
    try {
      await createMessage.mutateAsync({
        conversation_id: selectedConversationId,
        role: 'assistant',
        content: humanMessage,
        metadata: { sent_by: 'human_agent' },
      });
      
      setHumanMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-primary-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-600 font-medium">Loading conversations...</p>
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
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Conversations</h2>
            <p className="text-gray-600 mb-6">{error.message || 'Failed to load conversations'}</p>
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
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-gradient-to-br from-primary-600 to-primary-700 rounded-2xl flex items-center justify-center shadow-lg shadow-primary-600/30">
              <MessageSquare className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900">Conversations</h1>
              <p className="text-lg text-gray-600">All chat conversations with unique IDs</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-16rem)]">
          {/* Conversations List */}
          <div className="lg:w-96 flex flex-col relative bg-white/70 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-200/50 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-gray-50/50 to-white rounded-3xl"></div>
            
            {/* Header */}
            <div className="relative p-6 border-b border-gray-200/50 bg-gradient-to-r from-gray-50 to-white">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Chat List</h2>
                <div className="px-3 py-1.5 bg-primary-100 text-primary-700 rounded-xl text-sm font-bold">
                  {filteredConversations.length} Chats
                </div>
              </div>
              
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by Chat ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-2xl text-sm focus:ring-2 focus:ring-primary-600 focus:border-primary-600 transition-all bg-white/80"
                />
              </div>
            </div>

            {/* Conversation List */}
            <div className="relative flex-1 overflow-y-auto">
              {filteredConversations.map((conversation) => (
                <button
                  key={conversation.id}
                  onClick={() => setSelectedConversationId(conversation.id)}
                  className={`w-full p-5 border-b border-gray-200/50 hover:bg-gradient-to-r hover:from-primary-50/30 hover:to-blue-50/30 transition-all text-left relative ${
                    selectedConversationId === conversation.id 
                      ? 'bg-gradient-to-r from-primary-50 to-blue-50 border-l-4 border-l-primary-600' 
                      : ''
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-primary-700 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                        <Hash className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-gray-900 truncate text-base">
                          {conversation.id.substring(0, 13).toUpperCase()}
                        </div>
                        <div className="text-xs text-gray-500 font-medium">
                          {conversation.message_count || 0} messages
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-gray-700 truncate mb-2 pl-13">
                    {conversation.visitor_name || conversation.visitor_email || 'Anonymous'}
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500 pl-13">
                    <span className="font-medium capitalize">{conversation.status || 'active'}</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {getRelativeTime(conversation.started_at)}
                    </span>
                  </div>
                </button>
              ))}

              {filteredConversations.length === 0 && (
                <div className="relative p-8 text-center">
                  <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600 font-semibold">No conversations found</p>
                  <p className="text-gray-500 text-sm">Try adjusting your search</p>
                </div>
              )}
            </div>
          </div>

          {/* Conversation Detail */}
          <div className="flex-1 flex flex-col relative bg-white/70 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-200/50 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 to-white rounded-3xl"></div>
            
            {selectedConv ? (
              <>
                {/* Conversation Header */}
                <div className="relative p-6 border-b border-gray-200/50 bg-gradient-to-r from-gray-50 to-white">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-gradient-to-br from-primary-600 to-primary-700 rounded-2xl flex items-center justify-center shadow-lg shadow-primary-600/30">
                        <Hash className="w-7 h-7 text-white" />
                      </div>
                      <div>
                        <div className="text-xl font-bold text-gray-900">
                          {selectedConv.id.substring(0, 13).toUpperCase()}
                        </div>
                        <div className="flex items-center gap-3 text-sm text-gray-600 mt-1">
                          <span className="flex items-center gap-1">
                            <UserCircle className="w-4 h-4" />
                            {selectedConv.visitor_name || selectedConv.visitor_email || 'Anonymous'}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageSquare className="w-4 h-4" />
                            {selectedConv.message_count || 0} messages
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button className="p-3 text-gray-600 hover:text-gray-900 hover:bg-white rounded-xl transition-all hover:shadow-md">
                        <Download className="w-5 h-5" />
                      </button>
                      {!isHumanInChat ? (
                        <button
                          onClick={handleJoinAsHuman}
                          className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl text-sm font-bold hover:shadow-xl hover:shadow-green-600/30 transition-all hover:scale-[1.02] flex items-center gap-2"
                        >
                          <UserCircle className="w-5 h-5" />
                          Join as Human
                        </button>
                      ) : (
                        <button
                          onClick={handleLeaveChat}
                          className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl text-sm font-bold hover:shadow-xl hover:shadow-red-600/30 transition-all hover:scale-[1.02] flex items-center gap-2"
                        >
                          <UserCircle className="w-5 h-5" />
                          Leave Chat
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="relative flex-1 overflow-y-auto p-6 space-y-4">
                  {messagesLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
                    </div>
                  ) : currentMessages.length > 0 ? (
                    currentMessages.map((message: Message) => {
                      const isHuman = message.metadata && typeof message.metadata === 'object' && 'sent_by' in message.metadata && message.metadata.sent_by === 'human_agent';
                      return (
                        <div
                          key={message.id}
                          className={`flex ${
                            message.role === 'user' 
                              ? 'justify-start' 
                              : 'justify-end'
                          }`}
                        >
                          <div className="flex flex-col gap-1">
                            {isHuman && (
                              <span className="text-xs font-bold text-green-600 ml-2 flex items-center gap-1">
                                <UserCircle className="w-3 h-3" />
                                You (Human)
                              </span>
                            )}
                            <div
                              className={`max-w-md px-5 py-3.5 rounded-2xl shadow-md ${
                                message.role === 'user'
                                  ? 'bg-white border border-gray-200 text-gray-900'
                                  : isHuman
                                  ? 'bg-gradient-to-r from-green-600 to-green-700 text-white shadow-green-600/30 border-2 border-green-500'
                                  : 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-primary-600/30'
                              }`}
                            >
                              <p className="text-sm leading-relaxed">{message.content}</p>
                              <p className={`text-xs mt-2 font-medium ${
                                message.role === 'user' 
                                  ? 'text-gray-500' 
                                  : isHuman
                                  ? 'text-green-100'
                                  : 'text-primary-100'
                              }`}>
                                {formatTime(message.created_at)}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 font-semibold">No messages yet</p>
                        <p className="text-gray-400 text-sm">Messages will appear here</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Human Chat Input */}
                {isHumanInChat && (
                  <div className="relative border-t-2 border-green-200 p-4 bg-gradient-to-r from-green-50 to-emerald-50">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-sm font-bold text-green-700">You're in the conversation</span>
                    </div>
                    <div className="flex gap-3">
                      <input
                        type="text"
                        value={humanMessage}
                        onChange={(e) => setHumanMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                        placeholder="Type your message as human agent..."
                        className="flex-1 px-4 py-3 border-2 border-green-200 rounded-xl text-sm focus:ring-2 focus:ring-green-600 focus:border-green-600 transition-all bg-white"
                      />
                      <button
                        onClick={handleSendMessage}
                        disabled={!humanMessage.trim()}
                        className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl font-bold hover:shadow-xl hover:shadow-green-600/30 transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        <Send className="w-5 h-5" />
                        Send
                      </button>
                    </div>
                  </div>
                )}

                {/* Chat Info Footer */}
                <div className="relative border-t border-gray-200/50 p-6 bg-gradient-to-r from-gray-50 to-white">
                  <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-primary-600" />
                    Chat Information
                  </h3>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="px-4 py-3 bg-white rounded-xl border border-gray-200 shadow-sm">
                      <div className="text-gray-500 text-xs font-medium mb-1">Chat ID</div>
                      <div className="text-gray-900 font-bold">
                        {selectedConv.id.substring(0, 13).toUpperCase()}
                      </div>
                    </div>
                    <div className="px-4 py-3 bg-white rounded-xl border border-gray-200 shadow-sm">
                      <div className="text-gray-500 text-xs font-medium mb-1">Start Time</div>
                      <div className="text-gray-900 font-bold">{formatTime(selectedConv.started_at)}</div>
                    </div>
                    <div className="px-4 py-3 bg-white rounded-xl border border-gray-200 shadow-sm">
                      <div className="text-gray-500 text-xs font-medium mb-1">Status</div>
                      <div className="text-gray-900 font-bold capitalize">{selectedConv.status || 'active'}</div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="relative flex-1 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <MessageSquare className="w-20 h-20 text-gray-300 mx-auto mb-4" />
                  <p className="text-lg font-semibold text-gray-600">Select a conversation</p>
                  <p className="text-sm text-gray-500">Choose a chat from the list to view messages</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
