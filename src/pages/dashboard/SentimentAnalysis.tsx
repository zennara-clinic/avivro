import DashboardLayout from '../../components/DashboardLayout';
import { Smile, Frown, Meh, TrendingUp, Calendar, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { db, supabase } from '../../lib/supabase';

interface SentimentOverview {
  positive: number;
  neutral: number;
  negative: number;
  totalChats: number;
  avgSentimentScore: number;
}

interface SentimentTrendItem {
  label: string;
  positive: number;
  neutral: number;
  negative: number;
}

export default function SentimentAnalysis() {
  const { agentId } = useParams();
  const [timeRange, setTimeRange] = useState('7days');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentimentOverview, setSentimentOverview] = useState<SentimentOverview>({
    positive: 0,
    neutral: 0,
    negative: 0,
    totalChats: 0,
    avgSentimentScore: 0
  });
  const [sentimentTrend, setSentimentTrend] = useState<SentimentTrendItem[]>([]);

  useEffect(() => {
    if (!agentId) return;

    async function fetchSentimentData() {
      try {
        setLoading(true);
        setError(null);

        // Calculate date range
        const endDate = new Date();
        const startDate = new Date();
        
        switch (timeRange) {
          case '24hours':
            startDate.setHours(startDate.getHours() - 24);
            break;
          case '7days':
            startDate.setDate(startDate.getDate() - 7);
            break;
          case '30days':
            startDate.setDate(startDate.getDate() - 30);
            break;
          case '90days':
            startDate.setDate(startDate.getDate() - 90);
            break;
        }

        // Fetch conversations for the agent
        const { data: conversations, error: convError } = await db.conversations.list(agentId!, {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          limit: 1000
        });

        if (convError) throw convError;

        // Get all messages from these conversations with sentiment metadata
        const conversationIds = ((conversations as any[]) || []).map((c: any) => c.id);
        
        if (conversationIds.length === 0) {
          setSentimentOverview({
            positive: 0,
            neutral: 0,
            negative: 0,
            totalChats: 0,
            avgSentimentScore: 0
          });
          setSentimentTrend([]);
          setLoading(false);
          return;
        }

        // Fetch all messages with sentiment in metadata
        const { data: messages, error: msgError } = await supabase
          .from('messages')
          .select('role, metadata, created_at, conversation_id')
          .in('conversation_id', conversationIds)
          .eq('role', 'assistant')
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString())
          .order('created_at', { ascending: true });

        if (msgError) throw msgError;

        // Count sentiments from metadata
        const messagesWithSentiment = (messages || []).filter((m: any) => m.metadata?.sentiment);
        let totalPositive = 0;
        let totalNeutral = 0;
        let totalNegative = 0;
        let sentimentScores: number[] = [];

        messagesWithSentiment.forEach((msg: any) => {
          const sentiment = msg.metadata?.sentiment;
          if (sentiment === 'positive') totalPositive++;
          else if (sentiment === 'neutral') totalNeutral++;
          else if (sentiment === 'negative') totalNegative++;

          // Calculate score (positive=5, neutral=3, negative=1)
          const score = sentiment === 'positive' ? 5 : sentiment === 'neutral' ? 3 : 1;
          sentimentScores.push(score);
        });

        const total = totalPositive + totalNeutral + totalNegative || 1;
        const avgScore = sentimentScores.length > 0 
          ? sentimentScores.reduce((a, b) => a + b, 0) / sentimentScores.length 
          : 0;
        
        setSentimentOverview({
          positive: Math.round((totalPositive / total) * 100),
          neutral: Math.round((totalNeutral / total) * 100),
          negative: Math.round((totalNegative / total) * 100),
          totalChats: conversationIds.length,
          avgSentimentScore: Number(avgScore.toFixed(1))
        });

        // Generate trend data
        const trend = generateTrendDataFromMessages(messagesWithSentiment, timeRange, startDate, endDate);
        setSentimentTrend(trend);
      } catch (err: any) {
        console.error('Error fetching sentiment data:', err);
        setError(err.message || 'Failed to load sentiment data');
      } finally {
        setLoading(false);
      }
    }

    fetchSentimentData();
  }, [agentId, timeRange]);

  const handleRefresh = async () => {
    setRefreshing(true);
    setError(null);
    
    try {
      const endDate = new Date();
      const startDate = new Date();
      
      switch (timeRange) {
        case '24hours':
          startDate.setHours(startDate.getHours() - 24);
          break;
        case '7days':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case '30days':
          startDate.setDate(startDate.getDate() - 30);
          break;
        case '90days':
          startDate.setDate(startDate.getDate() - 90);
          break;
      }

      const { data: conversations, error: convError } = await db.conversations.list(agentId!, {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        limit: 1000
      });

      if (convError) throw convError;

      const conversationIds = ((conversations as any[]) || []).map((c: any) => c.id);
      
      if (conversationIds.length === 0) {
        setSentimentOverview({
          positive: 0,
          neutral: 0,
          negative: 0,
          totalChats: 0,
          avgSentimentScore: 0
        });
        setSentimentTrend([]);
        setRefreshing(false);
        return;
      }

      const { data: messages, error: msgError } = await supabase
        .from('messages')
        .select('role, metadata, created_at, conversation_id')
        .in('conversation_id', conversationIds)
        .eq('role', 'assistant')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: true });

      if (msgError) throw msgError;

      const messagesWithSentiment = (messages || []).filter((m: any) => m.metadata?.sentiment);
      let totalPositive = 0;
      let totalNeutral = 0;
      let totalNegative = 0;
      let sentimentScores: number[] = [];

      messagesWithSentiment.forEach((msg: any) => {
        const sentiment = msg.metadata?.sentiment;
        if (sentiment === 'positive') totalPositive++;
        else if (sentiment === 'neutral') totalNeutral++;
        else if (sentiment === 'negative') totalNegative++;

        const score = sentiment === 'positive' ? 5 : sentiment === 'neutral' ? 3 : 1;
        sentimentScores.push(score);
      });

      const total = totalPositive + totalNeutral + totalNegative || 1;
      const avgScore = sentimentScores.length > 0 
        ? sentimentScores.reduce((a, b) => a + b, 0) / sentimentScores.length 
        : 0;
      
      setSentimentOverview({
        positive: Math.round((totalPositive / total) * 100),
        neutral: Math.round((totalNeutral / total) * 100),
        negative: Math.round((totalNegative / total) * 100),
        totalChats: conversationIds.length,
        avgSentimentScore: Number(avgScore.toFixed(1))
      });

      const trend = generateTrendDataFromMessages(messagesWithSentiment, timeRange, startDate, endDate);
      setSentimentTrend(trend);
    } catch (err: any) {
      console.error('Error refreshing sentiment data:', err);
      setError(err.message || 'Failed to refresh sentiment data');
    } finally {
      setRefreshing(false);
    }
  };

  const generateTrendDataFromMessages = (messages: any[], range: string, startDate: Date, endDate: Date): SentimentTrendItem[] => {
    if (messages.length === 0) return [];

    // Group messages by time period
    const grouped: { [key: string]: { positive: number; neutral: number; negative: number } } = {};

    if (range === '24hours') {
      // Group by 4-hour intervals
      const hours = [0, 4, 8, 12, 16, 20];
      hours.forEach(hour => {
        const label = hour === 0 ? '12 AM' : hour === 12 ? '12 PM' : 
                      hour < 12 ? `${hour} AM` : `${hour - 12} PM`;
        grouped[label] = { positive: 0, neutral: 0, negative: 0 };
      });

      messages.forEach((msg: any) => {
        const msgDate = new Date(msg.created_at);
        const hour = msgDate.getHours();
        const interval = Math.floor(hour / 4) * 4;
        const label = interval === 0 ? '12 AM' : interval === 12 ? '12 PM' : 
                      interval < 12 ? `${interval} AM` : `${interval - 12} PM`;
        
        const sentiment = msg.metadata?.sentiment;
        if (sentiment === 'positive') grouped[label].positive++;
        else if (sentiment === 'neutral') grouped[label].neutral++;
        else if (sentiment === 'negative') grouped[label].negative++;
      });
    } else if (range === '7days') {
      // Group by day
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      for (let i = 0; i < 7; i++) {
        const date = new Date(endDate);
        date.setDate(date.getDate() - (6 - i));
        const dayName = days[date.getDay()];
        grouped[dayName] = { positive: 0, neutral: 0, negative: 0 };
      }

      messages.forEach((msg: any) => {
        const msgDate = new Date(msg.created_at);
        const dayName = days[msgDate.getDay()];
        
        const sentiment = msg.metadata?.sentiment;
        if (grouped[dayName]) {
          if (sentiment === 'positive') grouped[dayName].positive++;
          else if (sentiment === 'neutral') grouped[dayName].neutral++;
          else if (sentiment === 'negative') grouped[dayName].negative++;
        }
      });
    } else if (range === '30days') {
      // Group by weeks
      for (let i = 0; i < 4; i++) {
        grouped[`Week ${i + 1}`] = { positive: 0, neutral: 0, negative: 0 };
      }

      messages.forEach((msg: any) => {
        const msgDate = new Date(msg.created_at);
        const daysSinceStart = Math.floor((msgDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        const weekNum = Math.min(Math.floor(daysSinceStart / 7), 3);
        const label = `Week ${weekNum + 1}`;
        
        const sentiment = msg.metadata?.sentiment;
        if (sentiment === 'positive') grouped[label].positive++;
        else if (sentiment === 'neutral') grouped[label].neutral++;
        else if (sentiment === 'negative') grouped[label].negative++;
      });
    } else {
      // 90 days - group by months
      for (let i = 0; i < 3; i++) {
        grouped[`Month ${i + 1}`] = { positive: 0, neutral: 0, negative: 0 };
      }

      messages.forEach((msg: any) => {
        const msgDate = new Date(msg.created_at);
        const daysSinceStart = Math.floor((msgDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        const monthNum = Math.min(Math.floor(daysSinceStart / 30), 2);
        const label = `Month ${monthNum + 1}`;
        
        const sentiment = msg.metadata?.sentiment;
        if (sentiment === 'positive') grouped[label].positive++;
        else if (sentiment === 'neutral') grouped[label].neutral++;
        else if (sentiment === 'negative') grouped[label].negative++;
      });
    }

    // Convert to array with percentages
    return Object.keys(grouped).map(label => {
      const data = grouped[label];
      const total = data.positive + data.neutral + data.negative || 1;
      return {
        label,
        positive: Math.round((data.positive / total) * 100),
        neutral: Math.round((data.neutral / total) * 100),
        negative: Math.round((data.negative / total) * 100)
      };
    });
  };


  const getDescription = () => {
    switch (timeRange) {
      case '24hours': return 'Hourly sentiment distribution over the last 24 hours';
      case '7days': return 'Daily sentiment distribution over the last 7 days';
      case '30days': return 'Weekly sentiment distribution over the last 30 days';
      case '90days': return 'Monthly sentiment distribution over the last 90 days';
      default: return '';
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-primary-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-600 font-medium">Loading sentiment data...</p>
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
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Sentiment Data</h2>
            <p className="text-gray-600 mb-6">{error}</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Sentiment Analysis</h1>
            <p className="text-gray-600">Analyze the emotional tone of your customer conversations</p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="text-sm font-medium text-gray-700">
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </span>
          </button>
        </div>

        {/* Time Range Selector */}
        <div className="flex gap-2 mb-6">
          {['24hours', '7days', '30days', '90days'].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                timeRange === range
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {range === '24hours' ? 'Last 24 Hours' : 
               range === '7days' ? 'Last 7 Days' : 
               range === '30days' ? 'Last 30 Days' : 
               'Last 90 Days'}
            </button>
          ))}
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Positive Sentiment */}
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 border-2 border-green-200">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                <Smile className="w-6 h-6 text-white" />
              </div>
              <span className="text-3xl font-bold text-green-700">{sentimentOverview.positive}%</span>
            </div>
            <h3 className="text-lg font-semibold text-green-900 mb-1">Positive</h3>
            <p className="text-sm text-green-700">{Math.round(sentimentOverview.totalChats * sentimentOverview.positive / 100)} conversations</p>
          </div>

          {/* Neutral Sentiment */}
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 border-2 border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gray-500 rounded-xl flex items-center justify-center">
                <Meh className="w-6 h-6 text-white" />
              </div>
              <span className="text-3xl font-bold text-gray-700">{sentimentOverview.neutral}%</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Neutral</h3>
            <p className="text-sm text-gray-700">{Math.round(sentimentOverview.totalChats * sentimentOverview.neutral / 100)} conversations</p>
          </div>

          {/* Negative Sentiment */}
          <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-2xl p-6 border-2 border-red-200">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center">
                <Frown className="w-6 h-6 text-white" />
              </div>
              <span className="text-3xl font-bold text-red-700">{sentimentOverview.negative}%</span>
            </div>
            <h3 className="text-lg font-semibold text-red-900 mb-1">Negative</h3>
            <p className="text-sm text-red-700">{Math.round(sentimentOverview.totalChats * sentimentOverview.negative / 100)} conversations</p>
          </div>

          {/* Average Score */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 border-2 border-blue-200">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <span className="text-3xl font-bold text-blue-700">{sentimentOverview.avgSentimentScore}</span>
            </div>
            <h3 className="text-lg font-semibold text-blue-900 mb-1">Avg Score</h3>
            <p className="text-sm text-blue-700">Out of 5.0</p>
          </div>
        </div>

        {/* Sentiment Trend Chart */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Sentiment Trend</h2>
                <p className="text-sm text-gray-600">{getDescription()}</p>
              </div>
              <Calendar className="w-5 h-5 text-gray-400" />
            </div>

            {/* Bar Chart */}
            <div className="space-y-4">
              {sentimentTrend.length > 0 ? sentimentTrend.map((day) => (
                <div key={day.label}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700 w-20">{day.label}</span>
                    <div className="flex-1 mx-4">
                      <div className="h-8 flex rounded-lg overflow-hidden">
                        <div
                          className="bg-green-500 hover:bg-green-600 transition flex items-center justify-center text-xs text-white font-semibold"
                          style={{ width: `${day.positive}%` }}
                        >
                          {day.positive > 15 ? `${day.positive}%` : ''}
                        </div>
                        <div
                          className="bg-gray-400 hover:bg-gray-500 transition flex items-center justify-center text-xs text-white font-semibold"
                          style={{ width: `${day.neutral}%` }}
                        >
                          {day.neutral > 15 ? `${day.neutral}%` : ''}
                        </div>
                        <div
                          className="bg-red-500 hover:bg-red-600 transition flex items-center justify-center text-xs text-white font-semibold"
                          style={{ width: `${day.negative}%` }}
                        >
                          {day.negative > 5 ? `${day.negative}%` : ''}
                        </div>
                      </div>
                    </div>
                    <span className="text-sm text-gray-500 w-16 text-right">100%</span>
                  </div>
                </div>
              )) : (
                <div className="text-center py-12">
                  <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">No sentiment data available</p>
                  <p className="text-sm text-gray-400">Data will appear once conversations are analyzed</p>
                </div>
              )}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-6 mt-6 pt-6 border-t border-gray-200">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-500 rounded"></div>
                <span className="text-sm text-gray-700">Positive</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gray-400 rounded"></div>
                <span className="text-sm text-gray-700">Neutral</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-500 rounded"></div>
                <span className="text-sm text-gray-700">Negative</span>
              </div>
            </div>
          </div>
      </div>
    </DashboardLayout>
  );
}
