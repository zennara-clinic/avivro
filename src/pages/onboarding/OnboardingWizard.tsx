import { useNavigate } from 'react-router-dom';
import AgentCreationWizard from '../../components/AgentCreationWizard';

export default function OnboardingWizard() {
  const navigate = useNavigate();
  const handleComplete = () => {
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-blue-50 py-12">
      <AgentCreationWizard 
        onComplete={handleComplete}
        redirectTo="/dashboard"
      />
    </div>
  );
}
