import MainDashboardLayout from '../../components/MainDashboardLayout';
import { User, CreditCard, Mail, Phone, Sparkles, ArrowRight, CheckCircle, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { auth, db } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';

export default function AccountSettings() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [currentPlan, setCurrentPlan] = useState('Free');

  // Fetch user profile on mount
  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      
      // Get current user
      const { data: { user }, error: authError } = await auth.getUser();
      
      if (authError || !user) {
        console.error('Auth error:', authError);
        navigate('/auth/login');
        return;
      }

      setUserId(user.id);
      setEmail(user.email || '');

      // Fetch profile data
      const { data: profile, error: profileError } = await db.profiles.get(user.id);

      if (profileError) {
        console.error('Profile fetch error:', profileError);
        // Profile might not exist yet, that's okay
        return;
      }

      if (profile) {
        setName((profile as any).full_name || '');
        setPhone((profile as any).phone || '');
        // Normalize plan name to capitalize first letter
        const tier = (profile as any).subscription_tier || 'free';
        setCurrentPlan(tier.charAt(0).toUpperCase() + tier.slice(1).toLowerCase());
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!userId) return;

    try {
      setSaving(true);

      const { error } = await db.profiles.update(userId, {
        full_name: name,
        phone: phone,
      });

      if (error) {
        console.error('Save error:', error);
        alert('Failed to save profile. Please try again.');
        return;
      }

      alert('Profile saved successfully!');
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('An error occurred while saving.');
    } finally {
      setSaving(false);
    }
  };


  if (loading) {
    return (
      <MainDashboardLayout>
        <div className="max-w-7xl mx-auto flex items-center justify-center min-h-screen">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-primary-600 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">Loading your profile...</p>
          </div>
        </div>
      </MainDashboardLayout>
    );
  }

  return (
    <MainDashboardLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Account Settings</h1>
          <p className="text-lg text-gray-600">Manage your profile, billing, and subscription</p>
        </div>

        {/* Profile Information */}
        <div className="relative bg-white/70 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-200/50 p-8 mb-8 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-white rounded-3xl"></div>
          
          <div className="relative">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/30">
                <User className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">
                Profile Information
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-3">
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-5 py-4 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-primary-600 focus:border-primary-600 transition-all text-base shadow-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-900 mb-3">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    disabled
                    className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-2xl bg-gray-50 text-gray-500 cursor-not-allowed text-base shadow-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-900 mb-3">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-primary-600 focus:border-primary-600 transition-all text-base shadow-sm"
                  />
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-end">
              <button
                onClick={handleSaveProfile}
                disabled={saving}
                className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-2xl font-bold hover:shadow-xl hover:shadow-primary-600/30 transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Current Plan */}
        <div className="relative bg-white/70 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-200/50 p-8 mb-8 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 to-white rounded-3xl"></div>
          
          <div className="relative">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-purple-700 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-600/30">
                <CreditCard className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">
                Current Plan
              </h2>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">Your Plan</p>
                <div className="flex items-center gap-3">
                  <p className="text-4xl font-bold text-gray-900">{currentPlan}</p>
                  {currentPlan === 'Free' && (
                    <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-100 text-green-700 rounded-xl text-sm font-bold">
                      <Sparkles className="w-4 h-4" />
                      Active
                    </span>
                  )}
                </div>
              </div>
              {currentPlan === 'Free' && (
                <a
                  href="/#pricing"
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-primary-600 to-primary-700 text-white px-8 py-4 rounded-2xl font-bold hover:shadow-xl hover:shadow-primary-600/30 transition-all hover:scale-[1.02]"
                >
                  Upgrade to Pro
                  <ArrowRight className="w-5 h-5" />
                </a>
              )}
              {currentPlan === 'Pro' && (
                <a
                  href="/#pricing"
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-primary-600 to-primary-700 text-white px-8 py-4 rounded-2xl font-bold hover:shadow-xl hover:shadow-primary-600/30 transition-all hover:scale-[1.02]"
                >
                  Upgrade to Plus
                  <ArrowRight className="w-5 h-5" />
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Current Subscription */}
        {currentPlan !== 'Free' && (
          <div className="relative bg-white/70 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-200/50 p-8 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-green-50/50 to-white rounded-3xl"></div>
            
            <div className="relative">
              <h2 className="text-2xl font-bold text-gray-900 mb-8">Current Subscription</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white/80 p-6 rounded-2xl border border-gray-200/50 shadow-sm">
                  <p className="text-sm text-gray-600 mb-2">Plan</p>
                  <p className="text-2xl font-bold text-gray-900">{currentPlan}</p>
                </div>
                <div className="bg-white/80 p-6 rounded-2xl border border-gray-200/50 shadow-sm">
                  <p className="text-sm text-gray-600 mb-2">Billing Cycle</p>
                  <p className="text-2xl font-bold text-gray-900">Monthly</p>
                </div>
                <div className="bg-white/80 p-6 rounded-2xl border border-gray-200/50 shadow-sm">
                  <p className="text-sm text-gray-600 mb-2">Next Billing Date</p>
                  <p className="text-2xl font-bold text-gray-900">Jan 25, 2025</p>
                </div>
              </div>

              <div className="flex gap-4">
                <button className="px-8 py-4 border-2 border-gray-300 text-gray-700 rounded-2xl font-bold hover:bg-gray-50 transition-all hover:scale-[1.02]">
                  Manage Billing
                </button>
                <button className="px-8 py-4 border-2 border-red-300 text-red-600 rounded-2xl font-bold hover:bg-red-50 transition-all hover:scale-[1.02]">
                  Cancel Subscription
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainDashboardLayout>
  );
}
