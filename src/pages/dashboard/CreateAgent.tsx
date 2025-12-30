import AgentCreationWizard from '../../components/AgentCreationWizard';

export default function CreateAgent() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-blue-50">
      <AgentCreationWizard redirectTo="/dashboard" />
    </div>
  );
}
