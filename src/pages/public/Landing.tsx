import { Link } from 'react-router-dom';
import { Bot, Zap, Globe, MessageSquare, Check, ArrowRight, Menu, X, Clock, Users, Building2, ShoppingCart, Briefcase, Code, Shield, TrendingUp, FileText, Upload, Link2 } from 'lucide-react';
import { useState } from 'react';

export default function Landing() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 pt-4 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white/70 backdrop-blur-xl border border-gray-200/50 rounded-full shadow-lg shadow-black/5">
            <div className="flex justify-between items-center h-16 px-6">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-primary-600 to-primary-700 rounded-lg flex items-center justify-center">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-gray-900">Avivro</span>
              </div>
              
              <nav className="hidden md:flex items-center gap-6">
                <a href="#features" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">Features</a>
                <a href="#how-it-works" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">How it Works</a>
                <a href="#pricing" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">Pricing</a>
                <Link to="/login" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">Login</Link>
                <Link to="/signup" className="bg-primary-600 text-white px-6 py-2.5 rounded-full hover:bg-primary-700 transition-all hover:shadow-lg hover:shadow-primary-600/30 font-medium">
                  Get Started Free
                </Link>
              </nav>

              <button className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-2">
            <div className="bg-white/70 backdrop-blur-xl border border-gray-200/50 rounded-3xl shadow-lg shadow-black/5 mx-4 p-6">
              <div className="space-y-4">
                <a href="#features" className="block text-gray-600 hover:text-gray-900 font-medium transition-colors">Features</a>
                <a href="#how-it-works" className="block text-gray-600 hover:text-gray-900 font-medium transition-colors">How it Works</a>
                <a href="#pricing" className="block text-gray-600 hover:text-gray-900 font-medium transition-colors">Pricing</a>
                <Link to="/login" className="block text-gray-600 hover:text-gray-900 font-medium transition-colors">Login</Link>
                <Link to="/signup" className="block bg-primary-600 text-white px-6 py-2.5 rounded-full text-center hover:bg-primary-700 font-medium transition-all hover:shadow-lg hover:shadow-primary-600/30">
                  Get Started Free
                </Link>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-primary-50 to-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-white border border-primary-200 px-6 py-3 rounded-full mb-8 shadow-sm">
              <Clock className="w-5 h-5 text-primary-600" />
              <span className="text-base font-bold text-primary-600">Live in 60 Seconds • No Credit Card Required</span>
            </div>
            
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-gray-900 mb-8 leading-tight">
              Get Your AI Chat Agent
              <span className="block text-primary-600 mt-2">On Your Data in 60 Seconds</span>
            </h1>
            
            <p className="text-xl sm:text-2xl text-gray-600 mb-12 leading-relaxed max-w-3xl mx-auto">
              Embed an intelligent chatbot on your website that instantly learns from your content. 
              Answer questions and engage visitors 24/7.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link
                to="/signup"
                className="inline-flex items-center gap-2 bg-primary-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-primary-700 transition text-lg shadow-lg shadow-primary-600/30"
              >
                Get Started Free
                <ArrowRight className="w-5 h-5" />
              </Link>
              <a
                href="#pricing"
                className="inline-flex items-center justify-center gap-2 bg-white border-2 border-gray-300 text-gray-900 px-10 py-5 rounded-xl text-lg font-bold hover:border-primary-600 hover:text-primary-600 transition-all"
              >
                See Pricing
              </a>
            </div>
            
            {/* Trust Indicators */}
            <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-green-600" />
                <span>No coding required</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-green-600" />
                <span>Free plan available</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-green-600" />
                <span>Setup in 60 seconds</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What It Does */}
      <section id="features" className="py-24 bg-white px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-4">
              What Your Chat Agent Can Do
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Everything you need to engage visitors and convert them into customers
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-gradient-to-br from-blue-50 to-white p-8 rounded-2xl border border-blue-100 hover:shadow-xl transition-all hover:-translate-y-1">
              <div className="w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center mb-6">
                <MessageSquare className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Answer Questions 24/7</h3>
              <p className="text-gray-600 leading-relaxed">
                Your AI agent instantly responds to visitor queries using your website content and documents. No more waiting for support.
              </p>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-white p-8 rounded-2xl border border-green-100 hover:shadow-xl transition-all hover:-translate-y-1">
              <div className="w-16 h-16 bg-green-600 rounded-2xl flex items-center justify-center mb-6">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Engage Visitors</h3>
              <p className="text-gray-600 leading-relaxed">
                Build meaningful connections with your website visitors through intelligent conversations 24/7.
              </p>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-white p-8 rounded-2xl border border-purple-100 hover:shadow-xl transition-all hover:-translate-y-1">
              <div className="w-16 h-16 bg-purple-600 rounded-2xl flex items-center justify-center mb-6">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Setup in 60 Seconds</h3>
              <p className="text-gray-600 leading-relaxed">
                Name your agent, add your data source, and embed. That's it. Your AI chat agent is live on your website.
              </p>
            </div>

            <div className="bg-gradient-to-br from-amber-50 to-white p-8 rounded-2xl border border-amber-100 hover:shadow-xl transition-all hover:-translate-y-1">
              <div className="w-16 h-16 bg-amber-600 rounded-2xl flex items-center justify-center mb-6">
                <Globe className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Works on Any Website</h3>
              <p className="text-gray-600 leading-relaxed">
                Simple embed code works on WordPress, Shopify, custom websites, and any HTML page. No technical expertise needed.
              </p>
            </div>

            <div className="bg-gradient-to-br from-red-50 to-white p-8 rounded-2xl border border-red-100 hover:shadow-xl transition-all hover:-translate-y-1">
              <div className="w-16 h-16 bg-red-600 rounded-2xl flex items-center justify-center mb-6">
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Analytics & Insights</h3>
              <p className="text-gray-600 leading-relaxed">
                Track conversations, monitor performance, and understand what your visitors are asking about.
              </p>
            </div>

            <div className="bg-gradient-to-br from-indigo-50 to-white p-8 rounded-2xl border border-indigo-100 hover:shadow-xl transition-all hover:-translate-y-1">
              <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mb-6">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Your Brand, Your Style</h3>
              <p className="text-gray-600 leading-relaxed">
                Customize colors, logo, and messaging to match your brand. Make it look like it's part of your website.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Who It's For */}
      <section className="py-24 bg-gray-50 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-4">
              Perfect For Every Business
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Whether you're a small business or enterprise, Avivro helps you engage visitors
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-xl border-2 border-gray-200 hover:border-primary-600 transition-all hover:shadow-lg">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <ShoppingCart className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">E-commerce</h3>
              <p className="text-sm text-gray-600">
                Help customers find products, answer questions, and increase sales
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl border-2 border-gray-200 hover:border-primary-600 transition-all hover:shadow-lg">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <Briefcase className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">SaaS Companies</h3>
              <p className="text-sm text-gray-600">
                Provide instant support, reduce tickets, and onboard users faster
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl border-2 border-gray-200 hover:border-primary-600 transition-all hover:shadow-lg">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <Building2 className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Agencies</h3>
              <p className="text-sm text-gray-600">
                Schedule consultations and showcase services instantly
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl border-2 border-gray-200 hover:border-primary-600 transition-all hover:shadow-lg">
              <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center mb-4">
                <Code className="w-6 h-6 text-amber-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Developers</h3>
              <p className="text-sm text-gray-600">
                Add AI chat to client projects with simple embed code
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="py-24 bg-white px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Get your AI chat agent live on your website in just 3 simple steps
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <div className="relative">
              <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-primary-600 text-white rounded-full flex items-center justify-center text-3xl font-bold mb-6 shadow-lg">
                  1
                </div>
                <div className="bg-gradient-to-br from-primary-50 to-white p-8 rounded-2xl border border-primary-100 h-full">
                  <div className="w-14 h-14 bg-primary-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <FileText className="w-7 h-7 text-primary-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Name & Add Data</h3>
                  <p className="text-gray-600">
                    Name your agent and choose your data source: paste a website link, upload documents, or add text directly.
                  </p>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-primary-600 text-white rounded-full flex items-center justify-center text-3xl font-bold mb-6 shadow-lg">
                  2
                </div>
                <div className="bg-gradient-to-br from-primary-50 to-white p-8 rounded-2xl border border-primary-100 h-full">
                  <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Zap className="w-7 h-7 text-green-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">AI Learns Instantly</h3>
                  <p className="text-gray-600">
                    Our AI instantly processes your data and trains your chat agent. Takes less than 60 seconds to be ready.
                  </p>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-primary-600 text-white rounded-full flex items-center justify-center text-3xl font-bold mb-6 shadow-lg">
                  3
                </div>
                <div className="bg-gradient-to-br from-primary-50 to-white p-8 rounded-2xl border border-primary-100 h-full">
                  <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Code className="w-7 h-7 text-purple-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Embed & Go Live</h3>
                  <p className="text-gray-600">
                    Copy the simple embed code and paste it on your website. Your AI agent is now live and ready to chat!
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-12 text-center text-white shadow-2xl">
            <h3 className="text-3xl font-bold mb-4">Ready to Transform Your Website?</h3>
            <p className="text-xl mb-8 opacity-90">Join thousands of businesses using AI chat agents</p>
            <Link
              to="/signup"
              className="inline-flex items-center gap-2 bg-white text-primary-600 px-8 py-4 rounded-lg font-semibold hover:bg-gray-50 transition text-lg border-2 border-primary-600"
            >
              Start Free Now
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 bg-gray-50 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Choose the plan that fits your needs. All plans include the 60-second setup.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Free Plan */}
            <div className="bg-white rounded-2xl shadow-lg p-8 border-2 border-gray-200 hover:border-primary-600 transition-all">
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Free</h3>
                <p className="text-gray-600">Perfect for trying out Avivro</p>
              </div>
              
              <div className="mb-8">
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-bold text-gray-900">₹0</span>
                  <span className="text-gray-600">/forever</span>
                </div>
              </div>

              <ul className="space-y-4 mb-8">
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">100 chats/month</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">5 LLM requests/month</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">1 agent</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Logo upload only</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">"Powered By Avivro" branding</span>
                </li>
              </ul>

              <Link
                to="/signup"
                className="block w-full py-3 rounded-lg text-center font-semibold bg-white text-primary-600 hover:bg-gray-50 transition border-2 border-primary-600"
              >
                Start Free Now
              </Link>
            </div>

            {/* Pro Plan */}
            <div className="bg-white rounded-2xl shadow-2xl p-8 border-2 border-primary-600 relative transform scale-105">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <span className="bg-primary-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                  Most Popular
                </span>
              </div>
              
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Pro</h3>
                <p className="text-gray-600">For growing businesses</p>
              </div>
              
              <div className="mb-8">
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-bold text-gray-900">₹1,999</span>
                  <span className="text-gray-600">/month</span>
                </div>
              </div>

              <ul className="space-y-4 mb-8">
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">500 chats/month</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">All LLM models</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">5 agents</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Full branding customization</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Remove "Powered By Avivro"</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Corrections feature</span>
                </li>
              </ul>

              <Link
                to="/signup"
                className="block w-full py-3 rounded-lg text-center font-semibold bg-primary-600 text-white hover:bg-primary-700 transition"
              >
                Upgrade to Pro
              </Link>
            </div>

            {/* Plus Plan */}
            <div className="bg-white rounded-2xl shadow-lg p-8 border-2 border-gray-200 hover:border-primary-600 transition-all">
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Plus</h3>
                <p className="text-gray-600">For scaling businesses</p>
              </div>
              
              <div className="mb-8">
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-bold text-gray-900">₹3,500</span>
                  <span className="text-gray-600">/month</span>
                </div>
              </div>

              <ul className="space-y-4 mb-8">
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Everything in Pro</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">1,000 chats/month</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">200 extra chats for free</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Priority support</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">10 agents</span>
                </li>
              </ul>

              <Link
                to="/signup"
                className="block w-full py-3 rounded-lg text-center font-semibold bg-gray-100 text-gray-900 hover:bg-gray-200 transition"
              >
                Upgrade to Plus
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0B1120] text-gray-300 py-20 px-4 sm:px-6 lg:px-8 border-t border-gray-800">
        <div className="max-w-7xl mx-auto">
          {/* Main Footer Content */}
          <div className="grid md:grid-cols-4 gap-16 mb-16">
            {/* Brand Column */}
            <div className="md:col-span-1">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-primary-700 rounded-xl flex items-center justify-center shadow-lg shadow-primary-600/20">
                  <Bot className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-bold text-white">Avivro</span>
              </div>
              <p className="text-gray-400 text-base leading-relaxed mb-6">
                AI agents and chatbots for modern websites.
              </p>
              <p className="text-gray-500 text-sm">
                Get your chat agent live in 60 seconds.
              </p>
            </div>
            
            {/* Product Column */}
            <div>
              <h4 className="text-white font-bold text-base uppercase tracking-wider mb-6">Product</h4>
              <ul className="space-y-4">
                <li>
                  <a href="#features" className="text-gray-400 hover:text-white transition-colors duration-200 text-base flex items-center gap-2 group">
                    <span className="w-1 h-1 bg-primary-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    Features
                  </a>
                </li>
                <li>
                  <a href="#pricing" className="text-gray-400 hover:text-white transition-colors duration-200 text-base flex items-center gap-2 group">
                    <span className="w-1 h-1 bg-primary-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    Pricing
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-white transition-colors duration-200 text-base flex items-center gap-2 group">
                    <span className="w-1 h-1 bg-primary-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    Documentation
                  </a>
                </li>
              </ul>
            </div>
            
            {/* Company Column */}
            <div>
              <h4 className="text-white font-bold text-base uppercase tracking-wider mb-6">Company</h4>
              <ul className="space-y-4">
                <li>
                  <a href="#" className="text-gray-400 hover:text-white transition-colors duration-200 text-base flex items-center gap-2 group">
                    <span className="w-1 h-1 bg-primary-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    About
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-white transition-colors duration-200 text-base flex items-center gap-2 group">
                    <span className="w-1 h-1 bg-primary-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    Blog
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-white transition-colors duration-200 text-base flex items-center gap-2 group">
                    <span className="w-1 h-1 bg-primary-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    Contact
                  </a>
                </li>
              </ul>
            </div>
            
            {/* Legal Column */}
            <div>
              <h4 className="text-white font-bold text-base uppercase tracking-wider mb-6">Legal</h4>
              <ul className="space-y-4">
                <li>
                  <a href="#" className="text-gray-400 hover:text-white transition-colors duration-200 text-base flex items-center gap-2 group">
                    <span className="w-1 h-1 bg-primary-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-white transition-colors duration-200 text-base flex items-center gap-2 group">
                    <span className="w-1 h-1 bg-primary-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-white transition-colors duration-200 text-base flex items-center gap-2 group">
                    <span className="w-1 h-1 bg-primary-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    Cookie Policy
                  </a>
                </li>
              </ul>
            </div>
          </div>
          
          {/* Bottom Bar */}
          <div className="border-t border-gray-800 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-gray-400 text-base">
                &copy; 2025 Avivro. All rights reserved.
              </p>
              <p className="text-gray-500 text-base flex items-center gap-2">
                <span className="text-gray-600">Made with</span>
                <span className="text-red-500">&hearts;</span>
                <span className="text-gray-600">by</span>
                <a href="https://sizid.com/" className="text-primary-400 hover:text-primary-300 font-semibold transition-colors">Sizid</a>
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
