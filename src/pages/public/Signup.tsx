import { Link, useNavigate } from 'react-router-dom';
import { Bot, ArrowLeft, Mail, Lock, User } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../../lib/hooks';
import { toast } from 'sonner';

export default function Signup() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });
  const { signUp, loading } = useAuth();
  const [error, setError] = useState('');

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const { error } = await signUp(formData.email, formData.password, {
      full_name: formData.name,
    });
    
    if (error) {
      setError(error.message);
      toast.error(error.message);
    } else {
      toast.success('Account created! Check your email to verify.');
      navigate('/welcome');
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-blue-50 flex items-center justify-center p-4">
      {/* Back to Home */}
      <Link to="/" className="absolute top-8 left-8 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors">
        <ArrowLeft className="w-5 h-5" />
        <span className="font-medium">Back to Home</span>
      </Link>

      <div className="w-full max-w-md">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-6">
            <div className="w-14 h-14 bg-gradient-to-br from-primary-600 to-primary-700 rounded-2xl flex items-center justify-center shadow-lg shadow-primary-600/30">
              <Bot className="w-8 h-8 text-white" />
            </div>
            <span className="text-4xl font-bold text-gray-900">Avivro</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Your Account</h1>
          <p className="text-lg text-gray-600">Get your AI agent live in 60 seconds</p>
        </div>

        {/* Signup Card with Glassmorphism */}
        <div className="bg-white/70 backdrop-blur-xl border border-gray-200/50 rounded-3xl shadow-2xl shadow-black/10 p-8">
          {/* Email/Password Form */}
          <form onSubmit={handleEmailSignup} className="space-y-4">
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-600 text-sm">
                {error}
              </div>
            )}
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="John Doe"
                  required
                  className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-primary-600 focus:border-primary-600 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="your@email.com"
                  required
                  className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-primary-600 focus:border-primary-600 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Create a strong password"
                  required
                  minLength={8}
                  className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-primary-600 focus:border-primary-600 transition-all"
                />
              </div>
              <p className="mt-2 text-xs text-gray-500">Must be at least 8 characters</p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-primary-600 to-primary-700 text-white px-6 py-4 rounded-2xl text-lg font-bold hover:shadow-xl hover:shadow-primary-600/30 transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600">
            By signing up, you agree to Avivro's{' '}
            <a href="#" className="text-primary-600 hover:text-primary-700 font-semibold transition-colors">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="#" className="text-primary-600 hover:text-primary-700 font-semibold transition-colors">
              Privacy Policy
            </a>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-600 hover:text-primary-700 font-bold transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
