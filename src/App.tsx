import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryProvider } from './lib/providers/QueryProvider';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import Landing from './pages/public/Landing';
import Login from './pages/public/Login';
import Signup from './pages/public/Signup';
import Welcome from './pages/public/Welcome';
import OnboardingWizard from './pages/onboarding/OnboardingWizard';

// Main Dashboard (Level 1)
import AgentsListing from './pages/main/AgentsListing';
import Usage from './pages/main/Usage';
import AccountSettings from './pages/main/AccountSettings';

// Agent Dashboard (Level 2)
import AgentDashboard from './pages/agent/AgentDashboard';
import AgentTest from './pages/agent/AgentTest';
import AgentDetail from './pages/dashboard/AgentDetail';
import ConversationsInbox from './pages/dashboard/ConversationsInbox';
import ConversationDetail from './pages/dashboard/ConversationDetail';
import CorrectionsManager from './pages/dashboard/CorrectionsManager';
import KnowledgeManager from './pages/dashboard/KnowledgeManager';
import Publish from './pages/dashboard/Publish';
import EmbedInstructions from './pages/dashboard/EmbedInstructions';
import CreateAgent from './pages/dashboard/CreateAgent';
import SentimentAnalysis from './pages/dashboard/SentimentAnalysis';

function App() {
  return (
    <QueryProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/pricing" element={<Navigate to="/#pricing" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/welcome" element={<Welcome />} />
          
          {/* Onboarding */}
          <Route path="/onboarding" element={<ProtectedRoute><OnboardingWizard /></ProtectedRoute>} />
          
          {/* Main Dashboard (Level 1) - Protected */}
          <Route path="/dashboard" element={<ProtectedRoute><AgentsListing /></ProtectedRoute>} />
          <Route path="/dashboard/usage" element={<ProtectedRoute><Usage /></ProtectedRoute>} />
          <Route path="/dashboard/account" element={<ProtectedRoute><AccountSettings /></ProtectedRoute>} />
          
          {/* Agent Creation - Protected */}
          <Route path="/dashboard/agents/create" element={<ProtectedRoute><CreateAgent /></ProtectedRoute>} />
          
          {/* Agent-Specific Dashboard (Level 2) - Protected */}
          <Route path="/dashboard/agent/:agentId" element={<ProtectedRoute><AgentDashboard /></ProtectedRoute>} />
          <Route path="/dashboard/agent/:agentId/edit" element={<ProtectedRoute><AgentDetail /></ProtectedRoute>} />
          <Route path="/dashboard/agent/:agentId/test" element={<ProtectedRoute><AgentTest /></ProtectedRoute>} />
          <Route path="/dashboard/agent/:agentId/embed" element={<ProtectedRoute><EmbedInstructions /></ProtectedRoute>} />
          <Route path="/dashboard/agent/:agentId/conversations" element={<ProtectedRoute><ConversationsInbox /></ProtectedRoute>} />
          <Route path="/dashboard/agent/:agentId/conversations/:id" element={<ProtectedRoute><ConversationDetail /></ProtectedRoute>} />
          <Route path="/dashboard/agent/:agentId/sentiment" element={<ProtectedRoute><SentimentAnalysis /></ProtectedRoute>} />
          <Route path="/dashboard/agent/:agentId/corrections" element={<ProtectedRoute><CorrectionsManager /></ProtectedRoute>} />
          <Route path="/dashboard/agent/:agentId/knowledge" element={<ProtectedRoute><KnowledgeManager /></ProtectedRoute>} />
          <Route path="/dashboard/agent/:agentId/publish" element={<ProtectedRoute><Publish /></ProtectedRoute>} />
          <Route path="/dashboard/agent/:agentId/settings" element={<ProtectedRoute><AgentDetail /></ProtectedRoute>} />
          
          {/* Redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryProvider>
  );
}

export default App;
