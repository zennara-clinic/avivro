import { Link, useParams } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import { ArrowLeft, Bot, Send, RotateCcw, Smartphone, Monitor } from 'lucide-react';
import { useState } from 'react';

type DeviceType = 'desktop' | 'mobile';

export default function AgentTest() {
  const { id } = useParams();
  const [messages, setMessages] = useState([
    {
      id: '1',
      role: 'assistant',
      content: 'Hi! How can I help you today?',
      timestamp: new Date().toLocaleTimeString(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [deviceType, setDeviceType] = useState<DeviceType>('desktop');

  const agent = {
    id: id || 'agent_1',
    name: 'Support Assistant',
    primaryColor: '#4f46e5',
    bubbleText: 'Chat with us!',
  };

  const handleSend = () => {
    if (!inputMessage.trim()) return;

    const userMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date().toLocaleTimeString(),
    };

    setMessages([...messages, userMessage]);
    setInputMessage('');

    setTimeout(() => {
      const botMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Thank you for your message! This is a test response from your agent.',
        timestamp: new Date().toLocaleTimeString(),
      };
      setMessages((prev) => [...prev, botMessage]);
    }, 1000);
  };

  const handleReset = () => {
    setMessages([
      {
        id: '1',
        role: 'assistant',
        content: 'Hi! How can I help you today?',
        timestamp: new Date().toLocaleTimeString(),
      },
    ]);
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link
            to={`/dashboard/agents/${id}`}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Agent
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Test Agent: {agent.name}</h1>
              <p className="text-gray-600">
                Test your agent in a simulated environment before deploying to your website.
              </p>
            </div>
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition"
            >
              <RotateCcw className="w-4 h-4" />
              Reset Conversation
            </button>
          </div>
        </div>

        {/* Device Selector */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex items-center gap-4">
            <span className="text-sm font-semibold text-gray-700">Simulate Device:</span>
            <div className="flex gap-2">
              <button
                onClick={() => setDeviceType('desktop')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
                  deviceType === 'desktop'
                    ? 'bg-primary-100 text-primary-700 border-2 border-primary-600'
                    : 'bg-gray-100 text-gray-700 border-2 border-transparent hover:bg-gray-200'
                }`}
              >
                <Monitor className="w-4 h-4" />
                Desktop
              </button>
              <button
                onClick={() => setDeviceType('mobile')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
                  deviceType === 'mobile'
                    ? 'bg-primary-100 text-primary-700 border-2 border-primary-600'
                    : 'bg-gray-100 text-gray-700 border-2 border-transparent hover:bg-gray-200'
                }`}
              >
                <Smartphone className="w-4 h-4" />
                Mobile
              </button>
            </div>
          </div>
        </div>

        {/* Test Environment */}
        <div className="bg-gray-100 rounded-xl p-8 min-h-[600px] flex items-center justify-center">
          <div
            className={`bg-white rounded-2xl shadow-2xl flex flex-col transition-all ${
              deviceType === 'desktop' ? 'w-full max-w-4xl h-[600px]' : 'w-96 h-[700px]'
            }`}
          >
            {/* Chat Header */}
            <div
              className="px-6 py-4 rounded-t-2xl flex items-center gap-3"
              style={{ backgroundColor: agent.primaryColor }}
            >
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                <Bot className="w-6 h-6" style={{ color: agent.primaryColor }} />
              </div>
              <div className="flex-1">
                <div className="text-white font-semibold">{agent.name}</div>
                <div className="text-white/80 text-sm">Online</div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg ${
                      message.role === 'user'
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                    <p
                      className={`text-xs mt-1 ${
                        message.role === 'user' ? 'text-primary-100' : 'text-gray-500'
                      }`}
                    >
                      {message.timestamp}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Input */}
            <div className="p-4 border-t border-gray-200">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Type your message..."
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-primary-600"
                />
                <button
                  onClick={handleSend}
                  className="px-6 py-3 rounded-lg font-medium text-white transition"
                  style={{ backgroundColor: agent.primaryColor }}
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Test Info */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h3 className="font-semibold text-blue-900 mb-2">Testing Tips</h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li>• Try asking questions related to your knowledge base to test accuracy</li>
            <li>• Test the lead capture flow by having a conversation</li>
            <li>• Switch between desktop and mobile views to see how it looks on different devices</li>
            <li>• Check response times and overall conversation flow</li>
            <li>• Reset the conversation to start fresh with different test scenarios</li>
          </ul>
        </div>
      </div>
    </DashboardLayout>
  );
}
