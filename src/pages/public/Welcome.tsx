import { Link } from 'react-router-dom';
import { Bot, Sparkles, ArrowRight, Zap, Check } from 'lucide-react';

export default function Welcome() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-primary-600 to-primary-700 rounded-2xl flex items-center justify-center shadow-lg shadow-primary-600/30">
              <Bot className="w-10 h-10 text-white" />
            </div>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            Welcome to Avivro! 🎉
          </h1>
          <p className="text-xl text-gray-600">
            You're all set. Let's create your first AI agent in 60 seconds.
          </p>
        </div>

        {/* Main Card with Glassmorphism */}
        <div className="bg-white/70 backdrop-blur-xl border border-gray-200/50 rounded-3xl shadow-2xl shadow-black/10 p-8 sm:p-12">
          <div className="flex items-start gap-4 mb-8">
            <div className="w-14 h-14 bg-gradient-to-br from-primary-100 to-primary-50 rounded-2xl flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-7 h-7 text-primary-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                Create Your First Agent
              </h2>
              <p className="text-gray-600 leading-relaxed">
                Simple 2-step process to get your AI chat agent live on your website. 
                Takes less than 60 seconds!
              </p>
            </div>
          </div>

          {/* Steps */}
          <div className="space-y-6 mb-8">
            <div className="flex items-start gap-4 p-4 bg-white/50 rounded-2xl border border-gray-200/50">
              <div className="w-10 h-10 bg-primary-600 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold">
                1
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-1">Name & Tone</h3>
                <p className="text-sm text-gray-600">Give your agent a name and choose its personality</p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-4 bg-white/50 rounded-2xl border border-gray-200/50">
              <div className="w-10 h-10 bg-primary-600 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold">
                2
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-1">Knowledge Source</h3>
                <p className="text-sm text-gray-600">Add your website link, upload documents, or paste text</p>
              </div>
            </div>
          </div>

          {/* CTA Button */}
          <Link
            to="/onboarding"
            className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white px-8 py-5 rounded-2xl text-lg font-bold hover:shadow-2xl hover:shadow-primary-600/40 transition-all hover:scale-[1.02]"
          >
            <Zap className="w-5 h-5" />
            Create My Agent Now
            <ArrowRight className="w-5 h-5" />
          </Link>

          {/* Features */}
          <div className="mt-8 pt-6 border-t border-gray-200/50">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Check className="w-5 h-5 text-green-600" />
                </div>
                <p className="text-xs text-gray-600 font-medium">60 seconds</p>
              </div>
              <div>
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Check className="w-5 h-5 text-blue-600" />
                </div>
                <p className="text-xs text-gray-600 font-medium">No coding</p>
              </div>
              <div>
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Check className="w-5 h-5 text-purple-600" />
                </div>
                <p className="text-xs text-gray-600 font-medium">Free to start</p>
              </div>
            </div>
          </div>

          <div className="mt-6 text-center">
            <Link to="/dashboard" className="text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors">
              Skip for now, go to dashboard →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
