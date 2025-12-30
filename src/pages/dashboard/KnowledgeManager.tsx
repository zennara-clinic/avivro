import DashboardLayout from '../../components/DashboardLayout';
import { Database, Search, Filter, FileText, Globe, Brain, RefreshCw, Trash2, Plus, X, Link2, Type, Upload, Eye, TrendingUp, Loader2, AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useKnowledgeSources, useCreateKnowledgeSource, useUpdateKnowledgeSource, useDeleteKnowledgeSource } from '../../lib/hooks/useKnowledge';
import { formatDistanceToNow } from 'date-fns';
import type { Database as DB } from '../../types/database.types';
import { db } from '../../lib/supabase';
import { crawlWebsite, extractTextFromFile } from '../../lib/firecrawl';
import { toast } from 'sonner';

type KnowledgeSource = DB['public']['Tables']['knowledge_sources']['Row'];

type KnowledgeType = 'all' | 'url' | 'file' | 'text';

export default function KnowledgeManager() {
  const { agentId } = useParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<KnowledgeType>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<KnowledgeSource | null>(null);
  const [isEditingContent, setIsEditingContent] = useState(false);
  const [editedContent, setEditedContent] = useState('');
  const [isSavingContent, setIsSavingContent] = useState(false);
  const [isRetraining, setIsRetraining] = useState(false);
  const [addType, setAddType] = useState<'link' | 'text' | 'document'>('link');
  const [formData, setFormData] = useState({
    url: '',
    text: '',
    title: '',
    name: ''
  });
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Debug logging
  useEffect(() => {
    console.log('KnowledgeManager - agentId from URL:', agentId);
    console.log('KnowledgeManager - agentId type:', typeof agentId);
  }, [agentId]);

  // Fetch knowledge sources from backend
  const { data: knowledgeSources, isLoading, error, refetch } = useKnowledgeSources(agentId!);
  const createSource = useCreateKnowledgeSource();
  const updateSource = useUpdateKnowledgeSource();
  const deleteSource = useDeleteKnowledgeSource();

  // Debug logging for data
  useEffect(() => {
    console.log('KnowledgeManager - knowledgeSources:', knowledgeSources);
    console.log('KnowledgeManager - isLoading:', isLoading);
    console.log('KnowledgeManager - error:', error);
  }, [knowledgeSources, isLoading, error]);

  // Force refetch when component mounts or agentId changes
  useEffect(() => {
    if (agentId) {
      console.log('KnowledgeManager - Forcing refetch for agentId:', agentId);
      refetch();
    }
  }, [agentId, refetch]);



  const handleAddSource = async () => {
    if (!agentId) return;

    setIsProcessing(true);
    let knowledgeContent = '';
    let sourceName = '';

    try {
      // Process knowledge source based on type
      if (addType === 'link' && formData.url) {
        toast.info('Crawling website...');
        const result = await crawlWebsite(formData.url);
        if (!result) {
          toast.error('Failed to crawl website. Please check the URL and try again.');
          setIsProcessing(false);
          return;
        }
        knowledgeContent = result.content;
        sourceName = formData.name || result.title || formData.url;
        
        if (!knowledgeContent || knowledgeContent.trim() === '') {
          toast.error('No content extracted from website. The site may be blocking crawlers.');
          setIsProcessing(false);
          return;
        }
        
        toast.success('Website crawled successfully!');
      } else if (addType === 'text' && formData.text) {
        knowledgeContent = formData.text;
        sourceName = formData.name;
      } else if (addType === 'document' && uploadedFiles.length > 0) {
        // Process files
        toast.info(`Processing ${uploadedFiles.length} document(s)...`);
        
        const fileContents = await Promise.all(
          uploadedFiles.map(async (file) => {
            try {
              const text = await extractTextFromFile(file);
              if (!text) {
                toast.warning(`Failed to extract text from ${file.name}`);
              }
              return text;
            } catch (err: any) {
              console.error(`Error processing file ${file.name}:`, err);
              toast.error(`Error processing ${file.name}: ${err.message}`);
              return null;
            }
          })
        );
        
        const validContents = fileContents.filter(Boolean);
        
        if (validContents.length === 0) {
          toast.error('Could not extract text from any uploaded documents. Please ensure files are valid DOCX, DOC, or TXT files.');
          setIsProcessing(false);
          return;
        }
        
        if (validContents.length < uploadedFiles.length) {
          toast.warning(`Successfully processed ${validContents.length} of ${uploadedFiles.length} documents`);
        }
        
        knowledgeContent = validContents.join('\n\n');
        sourceName = formData.name || uploadedFiles.map(f => f.name).join(', ');
        toast.success(`Extracted text from ${validContents.length} document(s)`);
      }

      if (!knowledgeContent || knowledgeContent.trim() === '') {
        toast.error('Please provide knowledge source content');
        setIsProcessing(false);
        return;
      }

      // Create knowledge source with token count
      const wordCount = knowledgeContent.split(/\s+/).filter(w => w.length > 0).length;
      
      // Map frontend types to database types
      const dbType = addType === 'link' ? 'url' : addType === 'document' ? 'file' : 'text';
      
      const sourceData: any = {
        agent_id: agentId,
        name: sourceName,
        type: dbType,
        status: 'completed',
        tokens_count: wordCount,
        content: knowledgeContent
      };

      if (addType === 'link') {
        sourceData.url = formData.url;
      } else if (addType === 'document') {
        sourceData.file_name = uploadedFiles[0]?.name || 'Uploaded Documents';
      }

      console.log('Creating knowledge source with data:', sourceData);
      const result = await createSource.mutateAsync(sourceData);
      const newSourceId = (result as any)?.source?.id;
      
      toast.success('Knowledge source added successfully!');
      
      // Trigger knowledge processing to create chunks and embeddings
      if (newSourceId) {
        toast.info('Processing knowledge and generating embeddings...');
        try {
          const processResponse = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-knowledge`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
              },
              body: JSON.stringify({ sourceId: newSourceId }),
            }
          );

          if (processResponse.ok) {
            const processResult = await processResponse.json();
            toast.success(`Processed into ${processResult.chunksCreated} searchable chunks!`);
          } else {
            const errorData = await processResponse.json();
            toast.error(`Processing failed: ${errorData.error || 'Unknown error'}`);
          }
        } catch (processError: any) {
          console.error('Processing error:', processError);
          toast.error('Failed to process knowledge. It was saved but needs manual processing.');
        }
      }
      
      refetch(); // Refresh the list to show the new source
      handleCloseAddModal();
    } catch (error: any) {
      console.error('Error adding knowledge source:', error);
      toast.error('Failed to add knowledge source: ' + (error.message || 'Unknown error'));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCloseAddModal = () => {
    setShowAddModal(false);
    setFormData({ url: '', text: '', title: '', name: '' });
    setUploadedFiles([]);
    setAddType('link');
    setIsProcessing(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file => {
      const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
      const isValid = validTypes.includes(file.type) && file.size <= 10 * 1024 * 1024; // 10MB max
      if (!isValid) {
        toast.error(`Invalid file: ${file.name}`);
      }
      return isValid;
    });
    setUploadedFiles(prev => [...prev, ...validFiles]);
  };

  const handleRemoveFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this data source?')) {
      try {
        await deleteSource.mutateAsync(id);
      } catch (error: any) {
        alert('Failed to delete knowledge source: ' + error.message);
      }
    }
  };


  const handleSaveContent = async () => {
    if (!selectedItem || !agentId) return;
    
    setIsSavingContent(true);
    try {
      const wordCount = editedContent.split(/\s+/).filter(w => w.length > 0).length;
      
      await updateSource.mutateAsync({
        sourceId: selectedItem.id,
        data: {
          content: editedContent,
          tokens_count: wordCount,
        }
      });

      toast.success('Content updated successfully!');
      setIsEditingContent(false);
      setSelectedItem({ ...selectedItem, content: editedContent, tokens_count: wordCount });
    } catch (error: any) {
      toast.error('Failed to update content: ' + error.message);
    } finally {
      setIsSavingContent(false);
    }
  };

  const handleRetrain = async () => {
    if (!selectedItem || !agentId) return;
    
    setIsRetraining(true);
    try {
      // Get the current content (edited or original)
      const contentToUse = isEditingContent ? editedContent : (selectedItem.content || '');
      
      if (!contentToUse.trim()) {
        toast.error('No content to retrain with');
        setIsRetraining(false);
        return;
      }
      
      // Re-process and update the source
      const wordCount = contentToUse.split(/\s+/).filter(w => w.length > 0).length;
      
      await updateSource.mutateAsync({
        sourceId: selectedItem.id,
        data: {
          content: contentToUse,
          tokens_count: wordCount,
        }
      });

      // Trigger reprocessing to regenerate chunks and embeddings
      toast.info('Regenerating embeddings...');
      try {
        const processResponse = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-knowledge`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            },
            body: JSON.stringify({ sourceId: selectedItem.id }),
          }
        );

        if (processResponse.ok) {
          const processResult = await processResponse.json();
          toast.success(`Reprocessed into ${processResult.chunksCreated} searchable chunks!`);
        } else {
          toast.error('Failed to regenerate embeddings');
        }
      } catch (processError) {
        console.error('Processing error:', processError);
        toast.error('Failed to process knowledge');
      }

      toast.success('Agent retrained with updated knowledge!');
      setShowDetailModal(false);
      setIsEditingContent(false);
    } catch (error: any) {
      toast.error('Failed to retrain agent: ' + error.message);
    } finally {
      setIsRetraining(false);
    }
  };

  const handleViewDetail = (item: KnowledgeSource) => {
    setSelectedItem(item);
    setEditedContent(item.content || '');
    setIsEditingContent(false);
    setShowDetailModal(true);
  };

  const getRelativeTime = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return 'N/A';
    }
  };

  const getSourceDisplay = (source: KnowledgeSource) => {
    if (source.type === 'url' && source.url) return source.url;
    if (source.type === 'file' && source.file_name) return source.file_name;
    if (source.type === 'text') return source.name;
    return source.name || 'Unknown';
  };

  const knowledgeItems = (knowledgeSources || []) as KnowledgeSource[];

  const filteredItems = knowledgeItems.filter((item) => {
    const sourceDisplay = getSourceDisplay(item);
    const matchesSearch = sourceDisplay.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'all' || item.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const getIcon = (type: string) => {
    switch (type) {
      case 'url':
        return Globe;
      case 'file':
        return FileText;
      case 'text':
        return Brain;
      default:
        return Database;
    }
  };

  const stats = {
    totalItems: knowledgeItems.length,
    totalWords: knowledgeItems.reduce((sum, item) => sum + (item.tokens_count || 0), 0),
    links: knowledgeItems.filter((i) => i.type === 'url').length,
    documents: knowledgeItems.filter((i) => i.type === 'file').length,
    texts: knowledgeItems.filter((i) => i.type === 'text').length,
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-600 font-medium">Loading knowledge sources...</p>
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
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Knowledge Sources</h2>
            <p className="text-gray-600 mb-6">{error.message || 'Failed to load knowledge sources'}</p>
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
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/30">
              <Database className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900">Knowledge Manager</h1>
              <p className="text-lg text-gray-600">View and manage all knowledge sources across your agents</p>
            </div>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-bold hover:shadow-xl hover:shadow-blue-600/30 transition-all hover:scale-[1.02] flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add Data Source
          </button>
        </div>


        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 p-5">
            <div className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Total Items</div>
            <div className="text-3xl font-bold text-gray-900">{stats.totalItems}</div>
          </div>
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 p-5">
            <div className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Total Words</div>
            <div className="text-3xl font-bold text-gray-900">
              {stats.totalWords.toLocaleString()}
            </div>
          </div>
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-blue-200/50 p-5">
            <div className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-2">Links</div>
            <div className="text-3xl font-bold text-blue-900">{stats.links}</div>
          </div>
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-green-200/50 p-5">
            <div className="text-xs font-bold text-green-600 uppercase tracking-wider mb-2">Documents</div>
            <div className="text-3xl font-bold text-green-900">{stats.documents}</div>
          </div>
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-purple-200/50 p-5">
            <div className="text-xs font-bold text-purple-600 uppercase tracking-wider mb-2">Text</div>
            <div className="text-3xl font-bold text-purple-900">{stats.texts}</div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 p-6 mb-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search knowledge items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all"
              />
            </div>

            <div className="relative">
              <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as KnowledgeType)}
                className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-blue-600 appearance-none transition-all"
              >
                <option value="all">All Types</option>
                <option value="url">Links</option>
                <option value="file">Documents</option>
                <option value="text">Text</option>
              </select>
            </div>
          </div>
        </div>

        {/* Knowledge Table */}
        <div className="relative bg-white/70 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-200/50 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 to-white rounded-3xl"></div>
          <div className="relative overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-200">
                  <th className="px-8 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-8 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Source
                  </th>
                  <th className="px-8 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Words
                  </th>
                  <th className="px-8 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Last Updated
                  </th>
                  <th className="px-8 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredItems.map((item) => {
                  const Icon = getIcon(item.type);
                  return (
                    <tr key={item.id} className="hover:bg-blue-50/30 transition-colors">
                      <td className="px-8 py-5 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-md ${
                              item.type === 'url'
                                ? 'bg-gradient-to-br from-blue-500 to-blue-600'
                                : item.type === 'file'
                                ? 'bg-gradient-to-br from-green-500 to-green-600'
                                : 'bg-gradient-to-br from-purple-500 to-purple-600'
                            }`}
                          >
                            <Icon className="w-5 h-5 text-white" />
                          </div>
                          <span className="text-sm font-bold text-gray-900 capitalize">
                            {item.type}
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="text-base font-semibold text-gray-900 max-w-md truncate">
                          {getSourceDisplay(item)}
                        </div>
                      </td>
                      <td className="px-8 py-5 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-blue-600" />
                          <span className="text-sm font-bold text-gray-900">
                            {item.tokens_count ? item.tokens_count.toLocaleString() : '-'}
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-5 whitespace-nowrap text-sm text-gray-500 font-medium">
                        {getRelativeTime(item.updated_at)}
                      </td>
                      <td className="px-8 py-5 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleViewDetail(item)}
                            className="p-2.5 text-gray-600 hover:text-blue-600 hover:bg-blue-100 rounded-xl transition-all hover:scale-110"
                            title="View Details"
                          >
                            <Eye className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="p-2.5 text-gray-600 hover:text-red-600 hover:bg-red-100 rounded-xl transition-all hover:scale-110"
                            title="Delete"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredItems.length === 0 && (
            <div className="relative text-center py-16">
              <Database className="w-20 h-20 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">No knowledge items found</h3>
              <p className="text-gray-600 mb-6">
                {searchQuery || typeFilter !== 'all' 
                  ? 'Try adjusting your filters or search terms'
                  : 'Add knowledge sources to train your agent'}
              </p>
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-xl font-bold hover:shadow-xl hover:shadow-blue-600/30 transition-all hover:scale-[1.02]"
              >
                <Plus className="w-5 h-5" />
                Add First Data Source
              </button>
            </div>
          )}
        </div>

        {/* Add Data Source Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-8 animate-in slide-in-from-bottom-4 duration-300">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
                    <Database className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">Add Data Source</h3>
                </div>
                <button
                  onClick={handleCloseAddModal}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Type Selection */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                <button
                  onClick={() => setAddType('link')}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    addType === 'link'
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <Link2 className={`w-8 h-8 mx-auto mb-2 ${addType === 'link' ? 'text-blue-600' : 'text-gray-400'}`} />
                  <div className={`text-sm font-bold ${addType === 'link' ? 'text-blue-600' : 'text-gray-600'}`}>Website Link</div>
                </button>
                <button
                  onClick={() => setAddType('text')}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    addType === 'text'
                      ? 'border-purple-600 bg-purple-50'
                      : 'border-gray-200 hover:border-purple-300'
                  }`}
                >
                  <Type className={`w-8 h-8 mx-auto mb-2 ${addType === 'text' ? 'text-purple-600' : 'text-gray-400'}`} />
                  <div className={`text-sm font-bold ${addType === 'text' ? 'text-purple-600' : 'text-gray-600'}`}>Text Content</div>
                </button>
                <button
                  onClick={() => setAddType('document')}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    addType === 'document'
                      ? 'border-green-600 bg-green-50'
                      : 'border-gray-200 hover:border-green-300'
                  }`}
                >
                  <Upload className={`w-8 h-8 mx-auto mb-2 ${addType === 'document' ? 'text-green-600' : 'text-gray-400'}`} />
                  <div className={`text-sm font-bold ${addType === 'document' ? 'text-green-600' : 'text-gray-600'}`}>Upload File</div>
                </button>
              </div>

              <div className="space-y-5">
                {addType === 'link' && (
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Website URL</label>
                    <input
                      type="url"
                      value={formData.url}
                      onChange={(e) => setFormData({...formData, url: e.target.value})}
                      placeholder="https://example.com"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all"
                    />
                  </div>
                )}

                {addType === 'text' && (
                  <>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Name</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        placeholder="e.g., FAQ Content"
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-600 focus:border-purple-600 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Text Content</label>
                      <textarea
                        rows={6}
                        value={formData.text}
                        onChange={(e) => setFormData({...formData, text: e.target.value})}
                        placeholder="Paste your text content here..."
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-600 focus:border-purple-600 transition-all"
                      />
                    </div>
                  </>
                )}

                {addType === 'document' && (
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Upload Document</label>
                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-green-600 transition-colors cursor-pointer">
                      <input
                        type="file"
                        accept=".pdf,.docx,.doc,.txt"
                        onChange={handleFileUpload}
                        className="hidden"
                        id="file-upload"
                        multiple
                      />
                      <label htmlFor="file-upload" className="cursor-pointer">
                        <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-sm font-medium text-gray-700 mb-1">Click to upload or drag and drop</p>
                        <p className="text-xs text-gray-500">PDF, DOCX, DOC, TXT (max 10MB each)</p>
                      </label>
                    </div>
                    {uploadedFiles.length > 0 && (
                      <div className="mt-4 space-y-2">
                        {uploadedFiles.map((file, index) => (
                          <div key={index} className="flex items-center justify-between px-4 py-2 bg-green-50 border border-green-200 rounded-xl">
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4 text-green-600" />
                              <span className="text-sm font-medium text-green-700">{file.name}</span>
                              <span className="text-xs text-green-600">({(file.size / 1024).toFixed(1)} KB)</span>
                            </div>
                            <button
                              onClick={() => handleRemoveFile(index)}
                              className="p-1 text-green-600 hover:text-green-800 hover:bg-green-100 rounded"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={handleCloseAddModal}
                    disabled={isProcessing}
                    className="flex-1 px-6 py-3 border-2 border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddSource}
                    disabled={isProcessing || createSource.isPending ||
                      (addType === 'link' && !formData.url) || 
                      (addType === 'text' && (!formData.name || !formData.text)) || 
                      (addType === 'document' && uploadedFiles.length === 0)
                    }
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-bold hover:shadow-xl hover:shadow-blue-600/30 transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {(isProcessing || createSource.isPending) && <Loader2 className="w-5 h-5 animate-spin" />}
                    {isProcessing 
                      ? (addType === 'link' ? 'Crawling Website...' : addType === 'document' ? 'Processing Documents...' : 'Processing...')
                      : createSource.isPending 
                        ? 'Adding Source...' 
                        : 'Add Source'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Detail View Modal */}
        {showDetailModal && selectedItem && (
          <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full p-8 animate-in slide-in-from-bottom-4 duration-300 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg ${
                    selectedItem.type === 'url'
                      ? 'bg-gradient-to-br from-blue-500 to-blue-600'
                      : selectedItem.type === 'file'
                      ? 'bg-gradient-to-br from-green-500 to-green-600'
                      : 'bg-gradient-to-br from-purple-500 to-purple-600'
                  }`}>
                    {selectedItem.type === 'url' && <Globe className="w-6 h-6 text-white" />}
                    {selectedItem.type === 'file' && <FileText className="w-6 h-6 text-white" />}
                    {selectedItem.type === 'text' && <Brain className="w-6 h-6 text-white" />}
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">Data Source Details</h3>
                    <p className="text-sm text-gray-600 capitalize">{selectedItem.type}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-4">
                  <div className="p-4 bg-purple-50 rounded-xl">
                    <div className="text-xs font-bold text-purple-600 uppercase tracking-wider mb-1">Token Count</div>
                    <div className="text-2xl font-bold text-gray-900">
                      {selectedItem.tokens_count ? selectedItem.tokens_count.toLocaleString() : '-'}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Source</label>
                  <div className="p-4 bg-gray-50 rounded-xl text-gray-900 font-mono text-sm break-all">
                    {getSourceDisplay(selectedItem)}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Last Updated</label>
                  <div className="p-4 bg-gray-50 rounded-xl text-gray-700 font-medium">
                    {getRelativeTime(selectedItem.updated_at)}
                  </div>
                </div>

                {selectedItem.content && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-bold text-gray-700">Content</label>
                      {!isEditingContent ? (
                        <button
                          onClick={() => setIsEditingContent(true)}
                          className="px-3 py-1.5 text-xs font-bold text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-all"
                        >
                          Edit Content
                        </button>
                      ) : (
                        <div className="flex gap-2">
                          <button
                            onClick={handleSaveContent}
                            disabled={isSavingContent || updateSource.isPending}
                            className="px-3 py-1.5 text-xs font-bold text-white bg-green-600 rounded-lg hover:bg-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                          >
                            {(isSavingContent || updateSource.isPending) && <Loader2 className="w-3 h-3 animate-spin" />}
                            Save
                          </button>
                          <button
                            onClick={() => {
                              setIsEditingContent(false);
                              setEditedContent(selectedItem.content || '');
                            }}
                            disabled={isSavingContent || updateSource.isPending}
                            className="px-3 py-1.5 text-xs font-bold text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>
                    {isEditingContent ? (
                      <textarea
                        value={editedContent}
                        onChange={(e) => setEditedContent(e.target.value)}
                        className="w-full p-4 bg-white border-2 border-blue-300 rounded-xl text-gray-700 text-sm max-h-96 min-h-[200px] focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      />
                    ) : (
                      <div className="p-4 bg-gray-50 rounded-xl text-gray-700 text-sm max-h-96 overflow-y-auto whitespace-pre-wrap">
                        {selectedItem.content}
                      </div>
                    )}
                  </div>
                )}

                <div className="pt-4 border-t border-gray-200">
                  <button
                    onClick={handleRetrain}
                    disabled={isRetraining || updateSource.isPending || isSavingContent}
                    className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-bold hover:shadow-xl hover:shadow-blue-600/30 transition-all hover:scale-[1.02] flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {(isRetraining || updateSource.isPending) ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Retraining Agent...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-5 h-5" />
                        Retrain Agent with This Source
                      </>
                    )}
                  </button>
                  <p className="text-xs text-gray-500 text-center mt-3">
                    {isEditingContent 
                      ? 'Save your changes first, then retrain the agent with the updated content'
                      : 'This will re-process the data source and update the agent\'s knowledge base'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
