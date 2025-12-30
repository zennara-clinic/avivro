import MainDashboardLayout from '../../components/MainDashboardLayout';
import { CreditCard, Bot, TrendingUp, Calendar, MessageSquare, Sparkles, ArrowRight } from 'lucide-react';

export default function Usage() {
  // Mock data - replace with actual API data
  const currentPlan = 'Free';
  const chatsUsed = 45;
  const totalChats = 100;
  const llmsUsed = 3;
  const llmsLimit = 5;
  const chatsPercentage = (chatsUsed / totalChats) * 100;
  const llmsPercentage = (llmsUsed / llmsLimit) * 100;

  const usageHistory = [
    { date: 'Dec 24, 2024', chats: 8, llms: 1 },
    { date: 'Dec 23, 2024', chats: 12, llms: 1 },
    { date: 'Dec 22, 2024', chats: 10, llms: 0 },
    { date: 'Dec 21, 2024', chats: 7, llms: 1 },
    { date: 'Dec 20, 2024', chats: 8, llms: 0 },
  ];

  return (
    <MainDashboardLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Usage</h1>
          <p className="text-lg text-gray-600">Monitor your credits and agent usage</p>
        </div>

        {/* Current Plan Badge */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-primary-50 to-blue-50 border-2 border-primary-200 text-primary-700 rounded-2xl font-bold shadow-sm">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <CreditCard className="w-4 h-4 text-white" />
            </div>
            <span>Current Plan: {currentPlan}</span>
          </div>
        </div>

        {/* Usage Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
          {/* Credits Usage */}
          <div className="relative bg-white/70 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-200/50 p-8 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-white rounded-3xl"></div>
            
            <div className="relative">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/30">
                  <MessageSquare className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Chats Usage</h3>
                  <p className="text-sm text-gray-600">Monthly chat conversations</p>
                </div>
              </div>

              <div className="mb-6">
                <div className="flex items-end justify-between mb-3">
                  <div>
                    <p className="text-5xl font-bold text-gray-900">{chatsUsed}</p>
                    <p className="text-base text-gray-600 mt-1">of {totalChats} chats</p>
                  </div>
                  <span className="text-lg font-bold text-blue-600 bg-blue-100 px-4 py-2 rounded-xl">
                    {chatsPercentage.toFixed(0)}%
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden shadow-inner">
                  <div 
                    className={`h-full rounded-full transition-all ${
                      chatsPercentage >= 100 
                        ? 'bg-gradient-to-r from-red-500 to-red-600' 
                        : chatsPercentage >= 80 
                        ? 'bg-gradient-to-r from-yellow-500 to-yellow-600' 
                        : 'bg-gradient-to-r from-blue-500 to-blue-600'
                    }`}
                    style={{ width: `${chatsPercentage}%` }}
                  />
                </div>
              </div>

              <div className="pt-5 border-t border-gray-200/50 flex items-center justify-between">
                <p className="text-base text-gray-700 font-medium">
                  {totalChats - chatsUsed} chats remaining
                </p>
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-blue-600" />
                </div>
              </div>
            </div>
          </div>

          {/* LLM Requests Usage */}
          <div className="relative bg-white/70 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-200/50 p-8 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 to-white rounded-3xl"></div>
            
            <div className="relative">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 bg-gradient-to-br from-purple-600 to-purple-700 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-600/30">
                  <Bot className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">LLM Requests</h3>
                  <p className="text-sm text-gray-600">AI model usage this month</p>
                </div>
              </div>

              <div className="mb-6">
                <div className="flex items-end justify-between mb-3">
                  <div>
                    <p className="text-5xl font-bold text-gray-900">{llmsUsed}</p>
                    <p className="text-base text-gray-600 mt-1">of {llmsLimit} requests</p>
                  </div>
                  <span className="text-lg font-bold text-purple-600 bg-purple-100 px-4 py-2 rounded-xl">
                    {llmsPercentage.toFixed(0)}%
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden shadow-inner">
                  <div 
                    className={`h-full rounded-full transition-all ${
                      llmsPercentage >= 100 
                        ? 'bg-gradient-to-r from-red-500 to-red-600' 
                        : llmsPercentage >= 80 
                        ? 'bg-gradient-to-r from-yellow-500 to-yellow-600' 
                        : 'bg-gradient-to-r from-purple-500 to-purple-600'
                    }`}
                    style={{ width: `${llmsPercentage}%` }}
                  />
                </div>
              </div>

              <div className="pt-5 border-t border-gray-200/50 flex items-center justify-between">
                <p className="text-base text-gray-700 font-medium">
                  {llmsLimit - llmsUsed} request{llmsLimit - llmsUsed !== 1 ? 's' : ''} remaining
                </p>
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Usage History */}
        <div className="bg-white/70 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-200/50 overflow-hidden">
          <div className="px-8 py-6 border-b border-gray-200/50 bg-gradient-to-r from-gray-50 to-white">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-green-600 to-green-700 rounded-xl flex items-center justify-center">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              Recent Usage
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-200">
                  <th className="px-8 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-8 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Chats
                  </th>
                  <th className="px-8 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    LLM Requests
                  </th>
                  <th className="px-8 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Trend
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200/50">
                {usageHistory.map((day, index) => {
                  const prevDay = usageHistory[index + 1];
                  const trend = prevDay 
                    ? ((day.chats - prevDay.chats) / prevDay.chats * 100).toFixed(0)
                    : 0;
                  const isPositive = Number(trend) > 0;

                  return (
                    <tr key={day.date} className="hover:bg-gradient-to-r hover:from-primary-50/30 hover:to-blue-50/30 transition-colors">
                      <td className="px-8 py-5 whitespace-nowrap text-base font-semibold text-gray-900">
                        {day.date}
                      </td>
                      <td className="px-8 py-5 whitespace-nowrap text-base text-gray-900 font-medium">
                        {day.chats}
                      </td>
                      <td className="px-8 py-5 whitespace-nowrap text-base text-gray-900 font-medium">
                        {day.llms}
                      </td>
                      <td className="px-8 py-5 whitespace-nowrap">
                        {prevDay && (
                          <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-bold ${
                            isPositive ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                          }`}>
                            <TrendingUp className={`w-4 h-4 ${isPositive ? '' : 'rotate-180'}`} />
                            {Math.abs(Number(trend))}%
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Upgrade CTA */}
        {currentPlan === 'Free' && (
          <div className="mt-10 relative overflow-hidden bg-gradient-to-r from-primary-600 to-primary-700 rounded-3xl shadow-2xl shadow-primary-600/40 p-10">
            <div className="absolute inset-0 bg-grid-white/10"></div>
            <div className="relative">
              <div className="flex items-start justify-between gap-8">
                <div className="flex-1">
                  <h2 className="text-3xl font-bold mb-3 text-white">Need more chats?</h2>
                  <p className="text-lg mb-6 text-primary-50">
                    Upgrade to Pro for 500 chats/month and all LLM models, or Plus for 1,200 chats/month.
                  </p>
                  <a
                    href="/#pricing"
                    className="inline-flex items-center gap-3 bg-white text-primary-700 px-8 py-4 rounded-2xl font-bold hover:bg-primary-50 transition-all hover:scale-[1.02] shadow-lg"
                  >
                    View Plans
                    <ArrowRight className="w-5 h-5" />
                  </a>
                </div>
                <div className="hidden lg:block">
                  <div className="w-32 h-32 bg-white/10 backdrop-blur-sm rounded-3xl flex items-center justify-center">
                    <Sparkles className="w-16 h-16 text-white" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainDashboardLayout>
  );
}
