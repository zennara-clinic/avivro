import { useState } from 'react';
import { useParams } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import { Database, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { db } from '../../lib/supabase';

export default function MigrateKnowledge() {
  const { agentId } = useParams();
  const [migrating, setMigrating] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleMigrate = async () => {
    if (!agentId) return;
    
    setMigrating(true);
    setResult(null);

    try {
      // 1. Get agent data
      const { data: agent, error: agentError } = await db.agents.get(agentId);
      if (agentError) throw agentError;
      if (!agent) throw new Error('Agent not found');

      // 2. Check if agent has system_prompt
      const systemPrompt = (agent as any).system_prompt;
      if (!systemPrompt || systemPrompt.trim() === '') {
        setResult({ 
          success: false, 
          message: 'Agent has no knowledge to migrate (system_prompt is empty)' 
        });
        setMigrating(false);
        return;
      }

      // 3. Check if knowledge source already exists
      const { data: existingSources } = await db.knowledge.listSources(agentId);
      if (existingSources && existingSources.length > 0) {
        setResult({ 
          success: false, 
          message: `Agent already has ${existingSources.length} knowledge source(s). Migration not needed.` 
        });
        setMigrating(false);
        return;
      }

      // 4. Create knowledge source from system_prompt
      await db.knowledge.createSource({
        agent_id: agentId,
        name: 'Migrated Knowledge from Agent Creation',
        type: 'text',
        content: systemPrompt,
        status: 'completed'
      });

      setResult({ 
        success: true, 
        message: 'Successfully migrated agent knowledge to knowledge_sources table!' 
      });
    } catch (error: any) {
      setResult({ 
        success: false, 
        message: `Migration failed: ${error.message}` 
      });
    } finally {
      setMigrating(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-3xl shadow-xl border border-gray-200 p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center shadow-lg">
              <Database className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Migrate Knowledge</h1>
              <p className="text-gray-600">One-time migration for existing agents</p>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 mb-6">
            <h3 className="font-bold text-blue-900 mb-2">What does this do?</h3>
            <p className="text-sm text-blue-800 mb-3">
              This tool migrates your agent's knowledge from the old storage format (system_prompt) 
              to the new knowledge_sources table so it appears in the Knowledge Manager.
            </p>
            <p className="text-xs text-blue-700">
              ✓ Safe to run - only creates new records, doesn't delete anything<br/>
              ✓ One-time migration - no need to run again<br/>
              ✓ Works for agents created before the Knowledge Manager update
            </p>
          </div>

          {result && (
            <div className={`rounded-2xl p-6 mb-6 ${
              result.success 
                ? 'bg-green-50 border border-green-200' 
                : 'bg-red-50 border border-red-200'
            }`}>
              <div className="flex items-center gap-3">
                {result.success ? (
                  <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
                )}
                <p className={`font-medium ${
                  result.success ? 'text-green-900' : 'text-red-900'
                }`}>
                  {result.message}
                </p>
              </div>
            </div>
          )}

          <button
            onClick={handleMigrate}
            disabled={migrating || (result?.success === true)}
            className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-bold hover:shadow-xl hover:shadow-blue-600/30 transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
          >
            {migrating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Migrating...
              </>
            ) : result?.success ? (
              <>
                <CheckCircle className="w-5 h-5" />
                Migration Complete
              </>
            ) : (
              <>
                <Database className="w-5 h-5" />
                Migrate Agent Knowledge
              </>
            )}
          </button>

          {result?.success && (
            <p className="text-center text-sm text-gray-600 mt-4">
              You can now go back to the Knowledge Manager to see your migrated knowledge!
            </p>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
