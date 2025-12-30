import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Link as LinkIcon, Upload, FileText, Check, Loader2, Briefcase, Smile, Heart, HandHeart, Brain, Cpu, Zap, Search } from 'lucide-react';
import { useAuth, useCreateAgent } from '../lib/hooks';
import { toast } from 'sonner';
import { crawlWebsite, extractTextFromFile } from '../lib/firecrawl';
import { OPENROUTER_MODELS, getRecommendedModels, type LLMModel } from '../config/llm-models';
import { db } from '../lib/supabase';
import LLMSelector from './LLMSelector';

type SourceType = 'link' | 'document' | 'text';
type Tone = 'professional' | 'friendly' | 'casual' | 'helpful';

interface AgentCreationWizardProps {
  onComplete?: (agentId: string) => void;
  redirectTo?: string;
}

export default function AgentCreationWizard({ 
  onComplete, 
  redirectTo = '/dashboard/agents'
}: AgentCreationWizardProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const createAgent = useCreateAgent();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    tone: 'professional' as Tone,
  });
  const [sourceType, setSourceType] = useState<SourceType>('link');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [textContent, setTextContent] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [selectedModel, setSelectedModel] = useState<LLMModel>(getRecommendedModels()[0]);
  const [modelSearch, setModelSearch] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async () => {
    if (!user?.id) {
      toast.error('You must be logged in');
      return;
    }

    setIsProcessing(true);
    let knowledgeContent = '';

    try {
      // Process knowledge source based on type
      if (sourceType === 'link' && websiteUrl) {
        const result = await crawlWebsite(websiteUrl);
        if (!result) {
          setIsProcessing(false);
          return;
        }
        knowledgeContent = result.content;
        toast.success('Website crawled successfully!');
      } else if (sourceType === 'text' && textContent) {
        knowledgeContent = textContent;
      } else if (sourceType === 'document' && uploadedFiles.length > 0) {
        // Process files
        toast.info(`Processing ${uploadedFiles.length} document(s)...`);
        
        const fileContents = await Promise.all(
          uploadedFiles.map(async (file) => {
            const text = await extractTextFromFile(file);
            if (!text) {
              toast.warning(`Failed to extract text from ${file.name}`);
            }
            return text;
          })
        );
        
        const validContents = fileContents.filter(Boolean);
        
        if (validContents.length === 0) {
          toast.error('Could not extract text from any uploaded documents. Please try a different file or use text paste.');
          setIsProcessing(false);
          return;
        }
        
        if (validContents.length < uploadedFiles.length) {
          toast.warning(`Successfully processed ${validContents.length} of ${uploadedFiles.length} documents`);
        }
        
        knowledgeContent = validContents.join('\n\n');
        toast.success(`Extracted text from ${validContents.length} document(s)`);
      }

      if (!knowledgeContent || knowledgeContent.trim() === '') {
        toast.error('Please provide knowledge source content');
        setIsProcessing(false);
        return;
      }

      // Create agent (without system_prompt - we'll use knowledge_sources instead)
      const result = await createAgent.mutateAsync({
        user_id: user.id,
        name: formData.name,
        tone: formData.tone,
        ai_model: selectedModel.id,
        temperature: 0.7,
        max_tokens: 2000,
        enable_lead_capture: true,
      });

      const agentId = (result as any)?.id;

      // Also create knowledge source record so it appears in Knowledge Manager
      if (agentId) {
        try {
          // Calculate word count for token tracking
          const wordCount = knowledgeContent.split(/\s+/).filter(w => w.length > 0).length;
          
          // Map frontend types to database types
          const dbType = sourceType === 'link' ? 'url' : sourceType === 'document' ? 'file' : 'text';
          
          const sourceData: any = {
            agent_id: agentId,
            type: dbType,
            status: 'completed',
            content: knowledgeContent,
            tokens_count: wordCount
          };

          if (sourceType === 'link') {
            sourceData.name = websiteUrl;
            sourceData.url = websiteUrl;
          } else if (sourceType === 'text') {
            sourceData.name = 'Text Content from Agent Creation';
          } else if (sourceType === 'document') {
            sourceData.name = uploadedFiles.map(f => f.name).join(', ');
            sourceData.file_name = uploadedFiles[0]?.name || 'Uploaded Documents';
          }

          await db.knowledge.createSource(sourceData);
          console.log('Knowledge source created successfully with type:', dbType);
        } catch (error) {
          console.error('Failed to create knowledge source record:', error);
          // Don't fail the whole process if this fails
        }
      }
      
      toast.success('Agent created successfully!');
      
      if (onComplete) {
        onComplete(agentId || '');
      } else {
        navigate(redirectTo);
      }
    } catch (error) {
      toast.error('Failed to create agent');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    console.log('Files selected:', files);
    
    const validFiles = files.filter(file => {
      const validTypes = ['application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
      const isValid = validTypes.includes(file.type) && file.size <= 10 * 1024 * 1024; // 10MB max
      
      console.log('File:', file.name, 'Type:', file.type, 'Size:', file.size, 'Valid:', isValid);
      
      if (!isValid) {
        if (!validTypes.includes(file.type)) {
          if (file.type === 'application/pdf') {
            toast.error(`PDF files are not supported. Please copy the text and use the "Text" option, or convert to DOCX/TXT.`);
          } else {
            toast.error(`Invalid file type for ${file.name}. Please use DOC, DOCX, or TXT files.`);
          }
        } else {
          toast.error(`File ${file.name} is too large. Maximum size is 10MB.`);
        }
      }
      return isValid;
    });
    
    if (validFiles.length > 0) {
      setUploadedFiles(prev => [...prev, ...validFiles]);
      toast.success(`${validFiles.length} file(s) added successfully!`);
    }
  };

  const tones = [
    { id: 'professional', name: 'Professional', icon: Briefcase, color: 'blue', desc: 'Formal and business-like' },
    { id: 'friendly', name: 'Friendly', icon: Smile, color: 'green', desc: 'Warm and approachable' },
    { id: 'casual', name: 'Casual', icon: Heart, color: 'purple', desc: 'Relaxed and conversational' },
    { id: 'helpful', name: 'Helpful', icon: HandHeart, color: 'yellow', desc: 'Supportive and informative' },
  ];

  const getFilteredModels = () => {
    let models = OPENROUTER_MODELS;
    
    if (modelSearch) {
      models = models.filter(m => 
        m.name.toLowerCase().includes(modelSearch.toLowerCase()) ||
        m.provider.toLowerCase().includes(modelSearch.toLowerCase()) ||
        m.description.toLowerCase().includes(modelSearch.toLowerCase())
      );
    }
    
    return models;
  };

  const filteredModels = getFilteredModels();

  return (
    <div className="max-w-4xl mx-auto py-8">
      {/* Progress Steps */}
      <div className="flex items-center justify-center mb-8">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
            step === 1 ? 'bg-primary-600 text-white' : 'bg-green-500 text-white'
          }`}>
            {step === 1 ? '1' : <Check className="w-6 h-6" />}
          </div>
          <div className={`w-24 h-1 ${
            step >= 2 ? 'bg-primary-600' : 'bg-gray-300'
          }`}></div>
          <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
            step === 2 ? 'bg-primary-600 text-white' : step > 2 ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'
          }`}>
            {step > 2 ? <Check className="w-6 h-6" /> : '2'}
          </div>
          <div className={`w-24 h-1 ${
            step === 3 ? 'bg-primary-600' : 'bg-gray-300'
          }`}></div>
          <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
            step === 3 ? 'bg-primary-600 text-white' : 'bg-gray-300 text-gray-600'
          }`}>
            3
          </div>
        </div>
      </div>

      <div className="text-center mb-6">
        <p className="text-sm font-semibold text-gray-500">Step {step} of 3</p>
        <p className="text-gray-600">{step === 1 ? 'Name & Tone' : step === 2 ? 'AI Model' : 'Knowledge Source'}</p>
      </div>

      {/* Form Card */}
      <div className="bg-white rounded-3xl shadow-xl border border-gray-200/50 p-12">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-2xl mb-4">
            {step === 1 ? <Sparkles className="w-8 h-8 text-blue-600" /> : step === 2 ? <Cpu className="w-8 h-8 text-purple-600" /> : <Brain className="w-8 h-8 text-green-600" />}
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            {step === 1 ? 'Create Your Agent' : step === 2 ? 'Choose AI Model' : 'Add Knowledge Source'}
          </h2>
          <p className="text-gray-600">
            {step === 1 ? 'Name your agent and choose its personality' : step === 2 ? 'Select the best model for your use case' : 'Tell your agent what it needs to know'}
          </p>
        </div>

        {/* Step 1: Agent Name & Tone */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-3">Agent Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Agent"
                className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-600 focus:border-primary-600 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-900 mb-3">Agent Tone</label>
              <div className="grid grid-cols-2 gap-4">
                {tones.map((tone) => {
                  const IconComponent = tone.icon;
                  return (
                    <button
                      key={tone.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, tone: tone.id as Tone })}
                      className={`p-4 border-2 rounded-2xl text-left transition-all ${
                        formData.tone === tone.id
                          ? 'border-primary-600 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${
                        tone.color === 'blue' ? 'bg-blue-100' :
                        tone.color === 'green' ? 'bg-green-100' :
                        tone.color === 'purple' ? 'bg-purple-100' : 'bg-yellow-100'
                      }`}>
                        <IconComponent className={`w-5 h-5 ${
                          tone.color === 'blue' ? 'text-blue-600' :
                          tone.color === 'green' ? 'text-green-600' :
                          tone.color === 'purple' ? 'text-purple-600' : 'text-yellow-600'
                        }`} />
                      </div>
                      <div className="font-bold text-gray-900 mb-1">{tone.name}</div>
                      <div className="text-sm text-gray-600">{tone.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              onClick={() => setStep(2)}
              disabled={!formData.name}
              className="w-full bg-primary-600 text-white px-6 py-4 rounded-2xl text-lg font-bold hover:bg-primary-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-8"
            >
              Continue to AI Model
            </button>
          </div>
        )}

        {/* Step 2: AI Model Selection */}
        {step === 2 && (
          <div className="space-y-6">
            <LLMSelector
              selectedModel={selectedModel.id}
              onModelChange={(modelId) => {
                const model = OPENROUTER_MODELS.find(m => m.id === modelId);
                if (model) setSelectedModel(model);
              }}
              label="Choose AI Model"
              showPricing={true}
            />

            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
              <div className="font-semibold text-blue-900 mb-2">{selectedModel.name}</div>
              <div className="text-sm text-blue-700 mb-2">{selectedModel.description}</div>
              <div className="text-xs text-blue-600">Context: {selectedModel.contextWindow.toLocaleString()} tokens</div>
            </div>

            <div className="flex gap-4 mt-8">
              <button
                onClick={() => setStep(1)}
                className="px-8 py-4 bg-white border-2 border-gray-300 text-gray-700 rounded-2xl text-lg font-bold hover:bg-gray-50 transition-all"
              >
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                className="flex-1 bg-primary-600 text-white px-6 py-4 rounded-2xl text-lg font-bold hover:bg-primary-700 transition-all"
              >
                Continue to Knowledge Source
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Knowledge Source */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-4">Choose Source Type</label>
              <div className="grid grid-cols-3 gap-4 mb-6">
                <button
                  type="button"
                  onClick={() => setSourceType('link')}
                  className={`p-6 border-2 rounded-2xl text-center transition-all ${
                    sourceType === 'link'
                      ? 'border-primary-600 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <LinkIcon className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="font-bold text-gray-900">Website Link</div>
                  <div className="text-xs text-gray-600 mt-1">Paste URL</div>
                </button>

                <button
                  type="button"
                  onClick={() => setSourceType('document')}
                  className={`p-6 border-2 rounded-2xl text-center transition-all ${
                    sourceType === 'document'
                      ? 'border-primary-600 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Upload className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="font-bold text-gray-900">Documents</div>
                  <div className="text-xs text-gray-600 mt-1">Upload files</div>
                </button>

                <button
                  type="button"
                  onClick={() => setSourceType('text')}
                  className={`p-6 border-2 rounded-2xl text-center transition-all ${
                    sourceType === 'text'
                      ? 'border-primary-600 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <FileText className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="font-bold text-gray-900">Text</div>
                  <div className="text-xs text-gray-600 mt-1">Paste content</div>
                </button>
              </div>
            </div>

            {/* Website URL Input */}
            {sourceType === 'link' && (
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-3">Website URL</label>
                <div className="relative">
                  <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="url"
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                    placeholder="https://yourwebsite.com"
                    className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-600 focus:border-primary-600 transition-all"
                  />
                </div>
                <p className="mt-2 text-sm text-gray-500 flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  We'll crawl your website and train your agent
                </p>
              </div>
            )}

            {/* Document Upload */}
            {sourceType === 'document' && (
              <div className="bg-green-50 p-6 rounded-2xl">
                <label className="block text-sm font-bold text-gray-900 mb-3">Upload Documents</label>
                <div className="border-2 border-dashed border-gray-300 rounded-2xl p-12 text-center hover:border-primary-600 transition-all bg-white">
                  <input
                    type="file"
                    multiple
                    accept=".doc,.docx,.txt"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Upload className="w-8 h-8 text-green-600" />
                    </div>
                    <p className="text-lg font-bold text-gray-900 mb-2">Click to upload or drag and drop</p>
                    <p className="text-sm text-gray-500">DOCX, DOC, TXT (max 10MB each)</p>
                    <p className="text-xs text-gray-400 mt-1">For PDFs: Copy text and use "Text" option instead</p>
                  </label>
                </div>
                {uploadedFiles.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {uploadedFiles.map((file, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                        <span className="text-sm text-gray-700">{file.name}</span>
                        <button
                          onClick={() => setUploadedFiles(files => files.filter((_, i) => i !== idx))}
                          className="text-red-600 hover:text-red-700 text-sm font-medium"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Text Content */}
            {sourceType === 'text' && (
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-3">Paste Your Content</label>
                <textarea
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  placeholder="Paste your content here...&#10;&#10;You can include FAQs, product information, company details, or any other text you want your agent to learn from."
                  rows={12}
                  className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-600 focus:border-primary-600 transition-all resize-none"
                />
                <p className="mt-2 text-sm text-gray-500">
                  {textContent.length}/100 characters
                </p>
              </div>
            )}

            <div className="flex gap-4 mt-8">
              <button
                onClick={() => setStep(2)}
                className="px-8 py-4 bg-white border-2 border-gray-300 text-gray-700 rounded-2xl text-lg font-bold hover:bg-gray-50 transition-all"
              >
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={isProcessing || createAgent.isPending || 
                  (sourceType === 'link' && !websiteUrl) ||
                  (sourceType === 'document' && uploadedFiles.length === 0) ||
                  (sourceType === 'text' && !textContent)
                }
                className="flex-1 bg-primary-600 text-white px-6 py-4 rounded-2xl text-lg font-bold hover:bg-primary-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {(isProcessing || createAgent.isPending) && <Loader2 className="w-5 h-5 animate-spin" />}
                {isProcessing 
                  ? (sourceType === 'link' ? 'Crawling Website...' : sourceType === 'document' ? 'Processing Documents...' : 'Processing...')
                  : createAgent.isPending 
                    ? 'Creating Agent...' 
                    : 'Create My Agent'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
