import { useState, useEffect } from 'react';
import { Upload, Loader2, Check, X, Sparkles } from 'lucide-react';
import { db, supabase } from '../../lib/supabase';
import { toast } from 'sonner';
import { OPENROUTER_MODELS } from '../../config/llm-models';
import { openRouterClient } from '../../lib/openrouter';
import type { Database } from '../../types/database.types';
import LLMSelector from '../LLMSelector';

type Agent = Database['public']['Tables']['agents']['Row'];

interface AgentConfigurationProps {
  agentId: string;
  onSave?: () => void;
}

export default function AgentConfiguration({ agentId, onSave }: AgentConfigurationProps) {
  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [generatingInstructions, setGeneratingInstructions] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    widget_position: 'bottom-right',
    tone: 'professional',
    welcome_message: 'Hello! How can I help you today?',
    custom_instructions: '',
    ai_model: '',
    primary_color: '#3B82F6',
    avatar_url: '',
    show_branding: true,
    enable_lead_capture: true,
  });

  useEffect(() => {
    fetchAgent();
  }, [agentId]);

  const fetchAgent = async () => {
    try {
      setLoading(true);
      const { data, error } = await db.agents.get(agentId);
      if (error) throw error;
      if (!data) throw new Error('Agent not found');
      
      setAgent(data);
      setFormData({
        name: data.name || '',
        widget_position: (data.widget_position as string) || 'bottom-right',
        tone: (data.tone as string) || 'professional',
        welcome_message: (data.welcome_message as string) || 'Hello! How can I help you today?',
        custom_instructions: (data.custom_instructions as string) || '',
        ai_model: (data.ai_model as string) || '',
        primary_color: (data.primary_color as string) || '#3B82F6',
        avatar_url: (data.avatar_url as string) || '',
        show_branding: data.show_branding !== false,
        enable_lead_capture: data.enable_lead_capture !== false,
      });
    } catch (error: any) {
      console.error('Error fetching agent:', error);
      toast.error('Failed to load agent configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error('File size must be less than 2MB');
      return;
    }

    try {
      setUploadingLogo(true);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('You must be logged in to upload a logo');
        return;
      }

      // Delete old logo if exists
      if (formData.avatar_url) {
        const oldPathMatch = formData.avatar_url.match(/agent-logos\/(.+)$/);
        if (oldPathMatch) {
          await supabase.storage.from('agent-logos').remove([oldPathMatch[1]]);
        }
      }

      // Upload new logo using user ID as folder name (required by RLS policy)
      const fileExt = file.name.split('.').pop();
      const fileName = `${agentId}-${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('agent-logos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('agent-logos')
        .getPublicUrl(filePath);

      setFormData({ ...formData, avatar_url: publicUrl });
      toast.success('Logo uploaded successfully!');
    } catch (error: any) {
      console.error('Error uploading logo:', error);
      toast.error('Failed to upload logo: ' + error.message);
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleGenerateInstructions = async () => {
    try {
      setGeneratingInstructions(true);
      toast.info('Analyzing knowledge base...');

      // Check if OpenRouter is configured
      if (!openRouterClient.isConfigured()) {
        toast.error('OpenRouter API key not configured. Please set VITE_OPENROUTER_API_KEY.');
        return;
      }

      // Fetch knowledge sources for this agent
      const { data: knowledgeSources, error: fetchError } = await supabase
        .from('knowledge_sources')
        .select('content, name, type')
        .eq('agent_id', agentId);

      if (fetchError) throw fetchError;

      if (!knowledgeSources || knowledgeSources.length === 0) {
        toast.error('No knowledge sources found. Please add knowledge sources first.');
        return;
      }

      // Combine all knowledge content
      const combinedKnowledge = knowledgeSources
        .map(source => source.content)
        .filter(Boolean)
        .join('\n\n');

      if (!combinedKnowledge.trim()) {
        toast.error('No content found in knowledge sources.');
        return;
      }

      // Use OpenRouter client to generate instructions with Claude Haiku (best for this task)
      const result = await openRouterClient.chat(
        'anthropic/claude-3-haiku',
        [
          {
            role: 'system',
            content: 'You are an AI assistant that helps create custom instructions for chatbots based on their knowledge base. Generate concise, clear instructions that describe what the agent should know and how it should behave based on the provided knowledge.',
          },
          {
            role: 'user',
            content: `Based on the following knowledge base content, generate custom instructions for a ${formData.tone} chatbot. The instructions should be concise (2-4 sentences) and describe:\n1. What the agent knows about\n2. How it should help users\n3. Any specific behaviors or limitations\n\nKnowledge Base:\n${combinedKnowledge.slice(0, 8000)}\n\nGenerate only the custom instructions, nothing else.`,
          },
        ],
        {
          temperature: 0.7,
          max_tokens: 500,
        }
      );

      const generatedInstructions = result.content.trim();

      if (generatedInstructions) {
        setFormData({ ...formData, custom_instructions: generatedInstructions });
        toast.success('Custom instructions generated successfully!');
      } else {
        throw new Error('No instructions generated');
      }
    } catch (error: any) {
      console.error('Error generating instructions:', error);
      toast.error('Failed to generate instructions: ' + (error.message || 'Unknown error'));
    } finally {
      setGeneratingInstructions(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      const updateData: Database['public']['Tables']['agents']['Update'] = {
        name: formData.name,
        widget_position: formData.widget_position,
        tone: formData.tone,
        welcome_message: formData.welcome_message,
        custom_instructions: formData.custom_instructions,
        ai_model: formData.ai_model,
        primary_color: formData.primary_color,
        avatar_url: formData.avatar_url,
        show_branding: formData.show_branding,
        enable_lead_capture: formData.enable_lead_capture,
      };

      const { error } = await db.agents.update(agentId, updateData);
      if (error) throw error;

      toast.success('Configuration saved successfully!');
      if (onSave) onSave();
    } catch (error: any) {
      console.error('Error saving configuration:', error);
      toast.error('Failed to save configuration: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Agent Name */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-2">Agent Name</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all"
          placeholder="e.g., Support Assistant"
        />
      </div>

      {/* Widget Position and Personality in row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Widget Position */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">Widget Position</label>
          <select
            value={formData.widget_position}
            onChange={(e) => setFormData({ ...formData, widget_position: e.target.value })}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all appearance-none bg-white"
          >
            <option value="bottom-right">Bottom Right</option>
            <option value="bottom-left">Bottom Left</option>
            <option value="top-right">Top Right</option>
            <option value="top-left">Top Left</option>
          </select>
        </div>

        {/* Personality Preset */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">Personality Preset</label>
          <select
            value={formData.tone}
            onChange={(e) => setFormData({ ...formData, tone: e.target.value })}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all appearance-none bg-white"
          >
            <option value="professional">Professional</option>
            <option value="friendly">Friendly</option>
            <option value="casual">Casual</option>
            <option value="helpful">Helpful</option>
          </select>
        </div>
      </div>

      {/* Welcome Message */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-2">Welcome Message</label>
        <textarea
          value={formData.welcome_message}
          onChange={(e) => setFormData({ ...formData, welcome_message: e.target.value })}
          rows={2}
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all resize-none"
          placeholder="Hello! How can I help you today?"
        />
        <p className="mt-2 text-sm text-gray-500">This message will be displayed when users first open the chatbot</p>
      </div>

      {/* Custom Instructions */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-semibold text-gray-900">Custom Instructions</label>
          <button
            type="button"
            onClick={handleGenerateInstructions}
            disabled={generatingInstructions}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-medium hover:shadow-lg hover:shadow-purple-600/30 transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {generatingInstructions ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Generate with AI
              </>
            )}
          </button>
        </div>
        <textarea
          value={formData.custom_instructions}
          onChange={(e) => setFormData({ ...formData, custom_instructions: e.target.value })}
          rows={4}
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all resize-none"
          placeholder="Add specific instructions for how your agent should behave..."
        />
        <p className="mt-2 text-sm text-gray-500">
          Click "Generate with AI" to automatically create instructions based on your knowledge base
        </p>
      </div>

      {/* AI Model */}
      <div>
        <LLMSelector
          selectedModel={formData.ai_model || OPENROUTER_MODELS[0].id}
          onModelChange={(modelId) => setFormData({ ...formData, ai_model: modelId })}
          label="AI Model"
          showPricing={true}
        />
        <p className="mt-2 text-sm text-gray-500">
          {OPENROUTER_MODELS.find(m => m.id === formData.ai_model)?.description || 'Select a model for your agent'}
        </p>
        <p className="mt-2 text-xs font-medium text-blue-600">
          💡 Best for Knowledge Base: Claude 3 Haiku or Gemini 1.5 Flash
        </p>
      </div>

      {/* Brand Color */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-3">Brand Color</label>
        <p className="text-sm text-gray-600 mb-3">Choose your chatbot's primary color theme</p>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-xl border-2 border-gray-200 shadow-sm"
              style={{ backgroundColor: formData.primary_color }}
            />
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Primary Color</label>
              <input
                type="text"
                value={formData.primary_color}
                onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                className="w-32 px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 font-mono text-sm"
                placeholder="#3B82F6"
              />
            </div>
          </div>
          <input
            type="color"
            value={formData.primary_color}
            onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
            className="w-12 h-12 rounded-xl border-2 border-gray-200 cursor-pointer"
          />
        </div>
        <p className="mt-2 text-sm text-gray-500">This color will be used for the chatbot header, buttons, and user messages.</p>
      </div>

      {/* Brand Logo */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-3">Brand Logo</label>
        <p className="text-sm text-gray-600 mb-3">Upload your company logo for the chatbot</p>
        
        <div className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center hover:border-blue-600 transition-colors bg-gray-50">
          <input
            type="file"
            accept="image/*"
            onChange={handleLogoUpload}
            className="hidden"
            id="logo-upload"
            disabled={uploadingLogo}
          />
          
          {formData.avatar_url ? (
            <div className="space-y-4">
              <div className="inline-block relative">
                <img
                  src={formData.avatar_url}
                  alt="Agent logo"
                  className="w-24 h-24 rounded-xl object-cover border-2 border-gray-200"
                />
                <button
                  onClick={() => setFormData({ ...formData, avatar_url: '' })}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <label
                htmlFor="logo-upload"
                className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors cursor-pointer"
              >
                Change Logo
              </label>
            </div>
          ) : (
            <label htmlFor="logo-upload" className="cursor-pointer">
              {uploadingLogo ? (
                <Loader2 className="w-12 h-12 text-blue-600 mx-auto mb-4 animate-spin" />
              ) : (
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              )}
              <p className="text-sm font-medium text-gray-700 mb-1">Click to upload logo</p>
              <p className="text-xs text-gray-500">PNG, JPG (max 2MB)</p>
            </label>
          )}
        </div>
        <p className="mt-2 text-sm text-gray-500">Your logo will appear in the chatbot header. Recommended size: 200x200px</p>
      </div>

      {/* Branding Options */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-3">Branding Options</label>
        <p className="text-sm text-gray-600 mb-3">Control your chatbot's branding display</p>
        
        <div className="space-y-3">
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <div className="font-medium text-gray-900">Powered by Avivro</div>
                <div className="text-sm text-gray-600 mt-1">Show "Powered by Avivro" badge at the bottom of the chatbot</div>
              </div>
              <div className="relative">
                <input
                  type="checkbox"
                  checked={formData.show_branding}
                  onChange={(e) => setFormData({ ...formData, show_branding: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-300 rounded-full peer peer-checked:bg-blue-600 peer-focus:ring-4 peer-focus:ring-blue-100 transition-all">
                  <div className="w-5 h-5 bg-white rounded-full shadow-md transform transition-transform peer-checked:translate-x-5 translate-x-0.5 translate-y-0.5"></div>
                </div>
              </div>
            </label>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <div className="font-medium text-gray-900">Capture Leads</div>
                <div className="text-sm text-gray-600 mt-1">Show a form to collect Name, Email & Phone before chat starts</div>
              </div>
              <div className="relative">
                <input
                  type="checkbox"
                  checked={formData.enable_lead_capture}
                  onChange={(e) => setFormData({ ...formData, enable_lead_capture: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-300 rounded-full peer peer-checked:bg-green-600 peer-focus:ring-4 peer-focus:ring-green-100 transition-all">
                  <div className="w-5 h-5 bg-white rounded-full shadow-md transform transition-transform peer-checked:translate-x-5 translate-x-0.5 translate-y-0.5"></div>
                </div>
              </div>
            </label>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end pt-4 border-t border-gray-200">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-bold hover:shadow-xl hover:shadow-blue-600/30 transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {saving ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Check className="w-5 h-5" />
              Save Changes
            </>
          )}
        </button>
      </div>
    </div>
  );
}
