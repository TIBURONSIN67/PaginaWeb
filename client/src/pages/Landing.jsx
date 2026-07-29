import { Link } from 'react-router-dom';
import {
  MessageCircle,
  Search,
  Cpu,
  FileText,
  ShoppingCart,
  Zap,
  ArrowDown,
  Smartphone,
  Shield,
  ChevronRight,
  Battery,
  Wrench,
} from 'lucide-react';

const features = [
  {
    icon: MessageCircle,
    title: '24/7 WhatsApp Assistance',
    description: 'AI-powered chatbot responds instantly to customer inquiries on WhatsApp, day and night.',
    color: 'text-emerald-500',
    bg: 'bg-emerald-50',
  },
  {
    icon: Search,
    title: 'Inventory Search',
    description: 'Customers can search your entire inventory by model, brand, or part name — all through chat.',
    color: 'text-blue-500',
    bg: 'bg-blue-50',
  },
  {
    icon: Cpu,
    title: 'Smart Compatibility',
    description: 'AI automatically verifies part compatibility with the customer\'s phone model before suggesting.',
    color: 'text-purple-500',
    bg: 'bg-purple-50',
  },
  {
    icon: FileText,
    title: 'Automatic Quotations',
    description: 'Generate accurate price quotes instantly based on live product data and availability.',
    color: 'text-amber-500',
    bg: 'bg-amber-50',
  },
  {
    icon: ShoppingCart,
    title: 'Order Management',
    description: 'Create, track, and manage orders seamlessly without leaving the WhatsApp conversation.',
    color: 'text-rose-500',
    bg: 'bg-rose-50',
  },
  {
    icon: Zap,
    title: 'OpenAI Intelligence',
    description: 'Powered by advanced GPT models for natural, human-like conversations about spare parts.',
    color: 'text-indigo-500',
    bg: 'bg-indigo-50',
  },
];

const steps = [
  {
    number: 1,
    icon: MessageCircle,
    title: 'Customer Messages',
    description: 'A customer sends a message to your WhatsApp Business number asking about a spare part.',
  },
  {
    number: 2,
    icon: Smartphone,
    title: 'Meta Webhook Receives',
    description: 'The Meta WhatsApp Cloud API forwards the message to your server via a secure webhook.',
  },
  {
    number: 3,
    icon: Cpu,
    title: 'OpenAI Analyzes',
    description: 'OpenAI\'s GPT model processes the message, understanding intent, device model, and part needed.',
  },
  {
    number: 4,
    icon: Search,
    title: 'Inventory Check',
    description: 'The AI queries your product database in real time to find compatible parts and current stock.',
  },
  {
    number: 5,
    icon: Zap,
    title: 'AI Crafts Response',
    description: 'A natural, helpful reply is generated with product details, pricing, and availability.',
  },
  {
    number: 6,
    icon: ShoppingCart,
    title: 'Quotation & Order',
    description: 'The customer receives a quotation and can place an order or ask follow-up questions instantly.',
  },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-white">
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <Smartphone className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-gray-900">MobileParts AI</span>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">Features</a>
            <a href="#how-it-works" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">How It Works</a>
            <a href="#footer" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">Contact</a>
          </nav>
          <Link to="/dashboard" className="btn-primary text-sm px-5 py-2">
            Open Dashboard
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </header>

      <section className="relative pt-32 pb-20 sm:pt-40 sm:pb-28 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-white to-blue-50" />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-400/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary-50 border border-primary-100 rounded-full text-xs font-semibold text-primary-700 mb-8">
            <Zap className="w-3.5 h-3.5" />
            AI-Powered WhatsApp Commerce
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 tracking-tight leading-tight max-w-4xl mx-auto">
            The Smart AI Assistant for
            <br />
            <span className="text-primary-600">Mobile Phone Spare Parts</span>
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed">
            Help customers instantly through WhatsApp using AI powered by OpenAI and Meta WhatsApp Cloud API.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/dashboard" className="btn-primary text-base px-8 py-3 shadow-lg shadow-primary-500/25">
              Open Dashboard
              <ChevronRight className="w-5 h-5" />
            </Link>
            <a href="#features" className="btn-secondary text-base px-8 py-3">
              Learn More
              <ArrowDown className="w-5 h-5" />
            </a>
          </div>
        </div>
      </section>

      <section id="features" className="py-20 sm:py-28 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
              Everything you need to sell spare parts
            </h2>
            <p className="mt-4 text-lg text-gray-500 max-w-2xl mx-auto">
              An intelligent platform that transforms WhatsApp into your most powerful sales channel.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <div key={feature.title} className="card p-6 hover:shadow-md transition-shadow duration-300 group">
                <div className={`w-12 h-12 ${feature.bg} rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className={`w-6 h-6 ${feature.color}`} />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="py-20 sm:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
              How it works
            </h2>
            <p className="mt-4 text-lg text-gray-500 max-w-2xl mx-auto">
              From WhatsApp message to completed order in seconds — fully automated.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {steps.map((step) => (
              <div key={step.number} className="relative card p-6 group">
                <div className="absolute -top-4 -left-4 w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-lg">
                  {step.number}
                </div>
                <div className="w-11 h-11 bg-primary-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-primary-100 transition-colors duration-300">
                  <step.icon className="w-5 h-5 text-primary-600" />
                </div>
                <h3 className="text-base font-semibold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 sm:py-28 bg-primary-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.1),transparent_50%)]" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
            Ready to transform your spare parts business?
          </h2>
          <p className="mt-5 text-lg text-primary-100 max-w-2xl mx-auto leading-relaxed">
            Join hundreds of mobile parts stores using AI to handle customer inquiries and boost sales through WhatsApp.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/dashboard" className="inline-flex items-center gap-2 px-8 py-3 bg-white text-primary-600 rounded-xl font-medium text-base hover:bg-gray-50 transition-all duration-200 shadow-lg shadow-black/10">
              Get Started Free
              <ChevronRight className="w-5 h-5" />
            </Link>
            <a href="#features" className="inline-flex items-center gap-2 px-8 py-3 border border-primary-400/50 text-white rounded-xl font-medium text-base hover:bg-primary-500 transition-all duration-200">
              See Features
            </a>
          </div>
        </div>
      </section>

      <section className="py-20 sm:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
              Trusted by mobile parts stores
            </h2>
            <p className="mt-4 text-lg text-gray-500 max-w-2xl mx-auto">
              Built for the mobile repair and spare parts industry.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            <div className="card p-8 text-center">
              <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Shield className="w-6 h-6 text-emerald-500" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">99.9%</h3>
              <p className="text-sm text-gray-500 mt-1">Uptime Guaranteed</p>
            </div>
            <div className="card p-8 text-center">
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Battery className="w-6 h-6 text-blue-500" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">&lt; 3 sec</h3>
              <p className="text-sm text-gray-500 mt-1">Average Response Time</p>
            </div>
            <div className="card p-8 text-center">
              <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Wrench className="w-6 h-6 text-purple-500" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">10K+</h3>
              <p className="text-sm text-gray-500 mt-1">Parts Catalogued</p>
            </div>
          </div>
        </div>
      </section>

      <footer id="footer" className="bg-gray-900 text-gray-400 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
            <div className="lg:col-span-2">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                  <Smartphone className="w-5 h-5 text-white" />
                </div>
                <span className="text-lg font-bold text-white">MobileParts AI</span>
              </div>
              <p className="text-sm leading-relaxed max-w-sm">
                The smart AI assistant for mobile phone spare parts businesses. Powered by OpenAI and Meta WhatsApp Cloud API.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white mb-4">Product</h4>
              <ul className="space-y-3 text-sm">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a></li>
                <li><Link to="/dashboard" className="hover:text-white transition-colors">Dashboard</Link></li>
                <li><Link to="/products" className="hover:text-white transition-colors">Products</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white mb-4">Support</h4>
              <ul className="space-y-3 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API Documentation</a></li>
                <li><a href="#" className="hover:text-white transition-colors">WhatsApp Setup</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact Support</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm">
            <p>&copy; 2025 MobileParts AI. All rights reserved.</p>

            <div className="flex items-center gap-6">
              <Link to="/privacy" className="hover:text-white transition-colors">
                Privacy Policy
              </Link>

              <a href="#" className="hover:text-white transition-colors">
                Terms of Service
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
