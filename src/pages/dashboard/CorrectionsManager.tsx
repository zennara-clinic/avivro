import DashboardLayout from '../../components/DashboardLayout';
import { Brain, Plus, Search, Edit, Trash2, ToggleLeft, ToggleRight, X, Sparkles, TrendingUp, Loader2, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useCorrections, useCreateCorrection, useUpdateCorrection, useDeleteCorrection } from '../../lib/hooks/useCorrections';
import { formatDistanceToNow } from 'date-fns';
import type { Database } from '../../types/database.types';

type Correction = Database['public']['Tables']['corrections']['Row'];

export default function CorrectionsManager() {
  const { agentId } = useParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Fetch corrections from backend
  const { data: corrections, isLoading, error } = useCorrections(agentId!);
  const createCorrection = useCreateCorrection();
  const updateCorrection = useUpdateCorrection();
  const deleteCorrection = useDeleteCorrection();

  const [formData, setFormData] = useState({
    question: '',
    answer: '',
    enabled: true,
    reason: ''
  });

  const handleToggleStatus = async (correction: Correction) => {
    try {
      const newStatus = correction.status === 'active' ? 'disabled' : 'active';
      await updateCorrection.mutateAsync({
        correctionId: correction.id,
        data: { status: newStatus }
      });
    } catch (error: any) {
      alert('Failed to update correction status: ' + error.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this correction?')) {
      try {
        await deleteCorrection.mutateAsync(id);
      } catch (error: any) {
        alert('Failed to delete correction: ' + error.message);
      }
    }
  };

  const handleEdit = (correction: Correction) => {
    setEditingId(correction.id);
    setFormData({
      question: correction.original_response,
      answer: correction.corrected_response,
      enabled: correction.status === 'active',
      reason: correction.reason || ''
    });
    setShowAddModal(true);
  };

  const handleSubmit = async () => {
    if (!formData.question.trim() || !formData.answer.trim()) return;
    if (!agentId) return;

    try {
      if (editingId) {
        await updateCorrection.mutateAsync({
          correctionId: editingId,
          data: {
            original_response: formData.question,
            corrected_response: formData.answer,
            status: formData.enabled ? 'active' : 'disabled',
            reason: formData.reason || null
          }
        });
      } else {
        await createCorrection.mutateAsync({
          agent_id: agentId,
          original_response: formData.question,
          corrected_response: formData.answer,
          status: formData.enabled ? 'active' : 'disabled',
          reason: formData.reason || null,
          correction_type: 'manual'
        });
      }

      setShowAddModal(false);
      setEditingId(null);
      setFormData({ question: '', answer: '', enabled: true, reason: '' });
    } catch (error: any) {
      alert('Failed to save correction: ' + error.message);
    }
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setEditingId(null);
    setFormData({ question: '', answer: '', enabled: true, reason: '' });
  };

  const getRelativeTime = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return 'N/A';
    }
  };

  const correctionsData = (corrections || []) as Correction[];
  
  const filteredCorrections = correctionsData.filter(
    (correction) =>
      correction.original_response.toLowerCase().includes(searchQuery.toLowerCase()) ||
      correction.corrected_response.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-600 font-medium">Loading corrections...</p>
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
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Corrections</h2>
            <p className="text-gray-600 mb-6">{error.message || 'Failed to load corrections'}</p>
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
            <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-purple-700 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-600/30">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900">Corrections Manager</h1>
              <p className="text-lg text-gray-600">Teach your agents correct answers to improve accuracy over time</p>
            </div>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl font-bold hover:shadow-xl hover:shadow-purple-600/30 transition-all hover:scale-[1.02] flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add Correction
          </button>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search corrections by question or answer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-2xl text-sm focus:ring-2 focus:ring-purple-600 focus:border-purple-600 transition-all bg-white/80"
            />
          </div>
        </div>

        {/* Corrections Table */}
        <div className="relative bg-white/70 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-200/50 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-50/30 to-white rounded-3xl"></div>
          <div className="relative overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-200">
                  <th className="px-8 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Question
                  </th>
                  <th className="px-8 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Corrected Answer
                  </th>
                  <th className="px-8 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Helpful
                  </th>
                  <th className="px-8 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-8 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-8 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredCorrections.map((correction) => (
                  <tr key={correction.id} className="hover:bg-purple-50/30 transition-colors">
                    <td className="px-8 py-5">
                      <div className="text-base font-semibold text-gray-900 max-w-xs">
                        {correction.original_response}
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="text-sm text-gray-700 max-w-md line-clamp-2">
                        {correction.corrected_response}
                      </div>
                    </td>
                    <td className="px-8 py-5 whitespace-nowrap">
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-100 rounded-xl w-fit">
                        <TrendingUp className="w-4 h-4 text-purple-600" />
                        <span className="text-sm font-bold text-purple-900">
                          {correction.was_helpful !== null ? (correction.was_helpful ? 'Yes' : 'No') : 'N/A'}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-5 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-purple-600" />
                        <span className="text-sm font-medium text-gray-900">{getRelativeTime(correction.created_at)}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5 whitespace-nowrap">
                      <button 
                        onClick={() => handleToggleStatus(correction)}
                        className="flex items-center gap-2 transition-all hover:scale-105"
                      >
                        {correction.status === 'active' ? (
                          <>
                            <ToggleRight className="w-7 h-7 text-green-600" />
                            <span className="text-sm font-bold text-green-600 px-3 py-1 bg-green-100 rounded-xl">Enabled</span>
                          </>
                        ) : (
                          <>
                            <ToggleLeft className="w-7 h-7 text-gray-400" />
                            <span className="text-sm font-bold text-gray-500 px-3 py-1 bg-gray-100 rounded-xl">Disabled</span>
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-8 py-5 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(correction)}
                          className="p-2.5 text-gray-600 hover:text-purple-600 hover:bg-purple-100 rounded-xl transition-all hover:scale-110"
                          title="Edit"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(correction.id)}
                          className="p-2.5 text-gray-600 hover:text-red-600 hover:bg-red-100 rounded-xl transition-all hover:scale-110"
                          title="Delete"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredCorrections.length === 0 && (
            <div className="relative text-center py-16">
              <Brain className="w-20 h-20 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">No corrections found</h3>
              <p className="text-gray-600 mb-6">
                {searchQuery
                  ? 'Try a different search term'
                  : 'Create corrections to improve your agent responses'}
              </p>
              {!searchQuery && (
                <button
                  onClick={() => setShowAddModal(true)}
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white px-6 py-3 rounded-xl font-bold hover:shadow-xl hover:shadow-purple-600/30 transition-all hover:scale-[1.02]"
                >
                  <Plus className="w-5 h-5" />
                  Add First Correction
                </button>
              )}
            </div>
          )}
        </div>

        {/* Add/Edit Correction Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-8 animate-in slide-in-from-bottom-4 duration-300">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl flex items-center justify-center shadow-lg">
                    <Brain className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    {editingId ? 'Edit Correction' : 'Add New Correction'}
                  </h3>
                </div>
                <button
                  onClick={handleCloseModal}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Question / Trigger Phrase
                  </label>
                  <input
                    type="text"
                    value={formData.question}
                    onChange={(e) => setFormData({...formData, question: e.target.value})}
                    placeholder="e.g., How do I reset my password?"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-600 focus:border-purple-600 transition-all"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    The agent will use this correction when users ask similar questions
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Corrected Answer
                  </label>
                  <textarea
                    rows={5}
                    value={formData.answer}
                    onChange={(e) => setFormData({...formData, answer: e.target.value})}
                    placeholder="Enter the correct answer that should be used..."
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-600 focus:border-purple-600 transition-all"
                  />
                </div>
                <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-xl">
                  <input
                    type="checkbox"
                    id="enabled"
                    checked={formData.enabled}
                    onChange={(e) => setFormData({...formData, enabled: e.target.checked})}
                    className="w-5 h-5 text-purple-600 rounded"
                  />
                  <label htmlFor="enabled" className="text-sm font-medium text-gray-700">
                    Enable this correction immediately
                  </label>
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={handleCloseModal}
                    className="flex-1 px-6 py-3 border-2 border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={!formData.question.trim() || !formData.answer.trim()}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl font-bold hover:shadow-xl hover:shadow-purple-600/30 transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {editingId ? 'Update Correction' : 'Create Correction'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
