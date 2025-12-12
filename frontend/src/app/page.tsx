'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { TrendingUp, Zap, Shield, BarChart3, Menu, X } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('');
  const featuresRef = useRef<HTMLElement | null>(null);
  const pricingRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('access_token');
    if (token) {
      router.push('/dashboard');
    }
  }, [router]);

  // Scrollspy for active section
  useEffect(() => {
    const sections: { id: string; el: HTMLElement | null }[] = [
      { id: 'features', el: featuresRef.current },
      { id: 'pricing', el: pricingRef.current },
    ];

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.getAttribute('id');
            if (id) setActiveSection(id);
          }
        });
      },
      { threshold: 0.5 }
    );

    sections.forEach((s) => {
      if (s.el) observer.observe(s.el);
    });

    return () => observer.disconnect();
  }, []);

  // Highlight Blog when on blog route
  useEffect(() => {
    if (pathname?.startsWith('/blog')) {
      setActiveSection('blog');
    }
  }, [pathname]);

  return (
    <div className="min-h-screen bg-black pt-[var(--nav-height)]">
      {/* Top Navigation */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[var(--nav-bg)] border-b" style={{ borderColor: 'var(--nav-border)' }}>
        <div className="container mx-auto px-4 h-[var(--nav-height)] flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <TrendingUp size={28} className="text-primary-500" aria-hidden="true" />
            <span className="text-xl font-bold text-white">Trading Maven</span>
          </div>
          <nav aria-label="Main navigation" className="hidden md:flex">
            <ul id="primary-navigation" className="flex items-center space-x-6">
              <li>
                <a
                  href="#features"
                  className={`text-sm ${activeSection === 'features' ? 'text-primary-500' : 'text-gray-300'} hover:text-primary-400 transition-colors`}
                  aria-current={activeSection === 'features' ? 'page' : undefined}
                >
                  Features
                </a>
              </li>
              <li>
                <a
                  href="#pricing"
                  className={`text-sm ${activeSection === 'pricing' ? 'text-primary-500' : 'text-gray-300'} hover:text-primary-400 transition-colors`}
                  aria-current={activeSection === 'pricing' ? 'page' : undefined}
                >
                  Pricing
                </a>
              </li>
              <li>
                <a
                  href="/blog"
                  className={`text-sm ${activeSection === 'blog' ? 'text-primary-500' : 'text-gray-300'} hover:text-primary-400 transition-colors`}
                  aria-current={activeSection === 'blog' ? 'page' : undefined}
                >
                  Blog
                </a>
              </li>
            </ul>
          </nav>

          {/* Right actions */}
          <div className="hidden md:flex items-center space-x-4">
            <button
              onClick={() => router.push('/login')}
              className="px-4 py-2 text-white hover:text-primary-400 transition-colors"
              aria-label="Log in to your account"
            >
              Login
            </button>
            <button
              onClick={() => router.push('/register')}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              aria-label="Create a new account"
            >
              Get Started
            </button>
          </div>

          {/* Mobile menu toggle */}
          <button
            className="md:hidden inline-flex items-center justify-center p-2 rounded-lg border border-gray-700 text-white hover:bg-gray-800"
            aria-label="Toggle navigation menu"
            aria-expanded={isMenuOpen}
            aria-controls="mobile-navigation"
            onClick={() => setIsMenuOpen((o) => !o)}
          >
            {isMenuOpen ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
          </button>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div id="mobile-navigation" className="md:hidden border-t" style={{ borderColor: 'var(--nav-border)' }}>
            <div className="container mx-auto px-4 py-3 space-y-2">
              <a
                href="#features"
                className={`block text-sm ${activeSection === 'features' ? 'text-primary-500' : 'text-gray-300'} hover:text-primary-400 transition-colors`}
                aria-current={activeSection === 'features' ? 'page' : undefined}
                onClick={() => setIsMenuOpen(false)}
              >
                Features
              </a>
              <a
                href="#pricing"
                className={`block text-sm ${activeSection === 'pricing' ? 'text-primary-500' : 'text-gray-300'} hover:text-primary-400 transition-colors`}
                aria-current={activeSection === 'pricing' ? 'page' : undefined}
                onClick={() => setIsMenuOpen(false)}
              >
                Pricing
              </a>
              <a
                href="/blog"
                className={`block text-sm ${activeSection === 'blog' ? 'text-primary-500' : 'text-gray-300'} hover:text-primary-400 transition-colors`}
                aria-current={activeSection === 'blog' ? 'page' : undefined}
                onClick={() => setIsMenuOpen(false)}
              >
                Blog
              </a>
              <div className="flex items-center space-x-3 pt-2">
                <button
                  onClick={() => { setIsMenuOpen(false); router.push('/login'); }}
                  className="px-3 py-2 text-white hover:text-primary-400 transition-colors text-sm"
                  aria-label="Log in to your account"
                >
                  Login
                </button>
                <button
                  onClick={() => { setIsMenuOpen(false); router.push('/register'); }}
                  className="px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm"
                  aria-label="Create a new account"
                >
                  Get Started
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
          TradingView to MT5
          <br />
          <span className="text-primary-500">Ultra-Low Latency Bridge</span>
        </h1>
        <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto">
          Execute your TradingView signals automatically on MT5 with WebSocket-powered,
          lightning-fast execution. No delays, no missed opportunities.
        </p>
        <button
          onClick={() => router.push('/register')}
          className="px-8 py-4 bg-primary-600 text-white text-lg font-semibold rounded-lg hover:bg-primary-700 transition-colors shadow-lg"
        >
          Start Trading Now
        </button>
      </section>

      {/* How It Works */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-4xl font-bold text-white mb-12">How It Works</h2>
        <div className="grid md:grid-cols-3 gap-6 text-left">
          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
            <h3 className="text-xl font-bold text-white mb-3">1. Connect</h3>
            <p className="text-gray-300 text-sm leading-relaxed">
              Securely connect your MT5 account using our encrypted bridge. Your credentials are safe and never exposed.
            </p>
          </div>
          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
            <h3 className="text-xl font-bold text-white mb-3">2. Configure</h3>
            <p className="text-gray-300 text-sm leading-relaxed">
              Set up your TradingView alerts to send webhook notifications to your unique Trading Maven endpoint.
            </p>
          </div>
          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
            <h3 className="text-xl font-bold text-white mb-3">3. Trade</h3>
            <p className="text-gray-300 text-sm leading-relaxed">
              Your alerts are instantly converted into trades on your MT5 account. Monitor everything from your dashboard.
            </p>
          </div>
        </div>
      </section>

      {/* Forex Trading Section */}
      <section className="container mx-auto px-4 py-20 bg-gray-900/50">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-4xl font-bold text-white mb-6">Professional Forex Trading Platform</h2>
            <p className="text-gray-300 mb-6 leading-relaxed">
              Trade major, minor, and exotic currency pairs with institutional-grade execution. 
              Access real-time market data, advanced charting, and professional trading tools.
            </p>
            <ul className="space-y-3 text-gray-300">
              <li className="flex items-start">
                <span className="text-primary-500 mr-2">✓</span>
                <span>50+ Currency Pairs including EUR/USD, GBP/USD, USD/JPY</span>
              </li>
              <li className="flex items-start">
                <span className="text-primary-500 mr-2">✓</span>
                <span>Tight spreads starting from 0.1 pips</span>
              </li>
              <li className="flex items-start">
                <span className="text-primary-500 mr-2">✓</span>
                <span>Leverage up to 1:500 for maximum flexibility</span>
              </li>
              <li className="flex items-start">
                <span className="text-primary-500 mr-2">✓</span>
                <span>24/5 market access with instant execution</span>
              </li>
            </ul>
          </div>
          <div className="bg-gray-800 p-8 rounded-xl border border-gray-700">
            <div className="aspect-video bg-gradient-to-br from-primary-900/20 to-gray-900 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <TrendingUp size={80} className="text-primary-500 mx-auto mb-4" />
                <p className="text-gray-400 text-sm">Live Forex Charts</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MT5 Platform Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="order-2 md:order-1 bg-gray-800 p-8 rounded-xl border border-gray-700">
            <div className="aspect-video bg-gradient-to-br from-blue-900/20 to-gray-900 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <BarChart3 size={80} className="text-primary-500 mx-auto mb-4" />
                <p className="text-gray-400 text-sm">MT5 Trading Terminal</p>
              </div>
            </div>
          </div>
          <div className="order-1 md:order-2">
            <h2 className="text-4xl font-bold text-white mb-6">MetaTrader 5 Integration</h2>
            <p className="text-gray-300 mb-6 leading-relaxed">
              Seamlessly connect your MT5 accounts and execute trades with lightning-fast speed. 
              Our platform provides full MT5 integration with advanced order management.
            </p>
            <ul className="space-y-3 text-gray-300">
              <li className="flex items-start">
                <span className="text-primary-500 mr-2">✓</span>
                <span>Direct MT5 connection with secure authentication</span>
              </li>
              <li className="flex items-start">
                <span className="text-primary-500 mr-2">✓</span>
                <span>Support for all order types (Market, Limit, Stop)</span>
              </li>
              <li className="flex items-start">
                <span className="text-primary-500 mr-2">✓</span>
                <span>Real-time account monitoring and trade history</span>
              </li>
              <li className="flex items-start">
                <span className="text-primary-500 mr-2">✓</span>
                <span>Multi-account management from single dashboard</span>
              </li>
              <li className="flex items-start">
                <span className="text-primary-500 mr-2">✓</span>
                <span>Automated position sizing and risk management</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Agentic Trading Section */}
      <section className="container mx-auto px-4 py-20 bg-gray-900/50 overflow-hidden">
        <div className="text-center mb-12 animate-fade-in">
          <h2 className="text-4xl font-bold text-white mb-4 animate-slide-down">AI-Powered Agentic Trading</h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto animate-slide-up">
            Build sophisticated trading workflows with our visual automation builder. 
            No coding required - just drag, drop, and deploy your strategies.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 hover:border-primary-500 transition-all duration-300 hover:transform hover:scale-105 hover:shadow-xl hover:shadow-primary-500/20 animate-slide-in-left">
            <div className="w-12 h-12 bg-primary-500/10 rounded-lg flex items-center justify-center mb-4 animate-pulse-slow">
              <Zap size={24} className="text-primary-500" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Visual Workflow Builder</h3>
            <p className="text-gray-300 text-sm leading-relaxed">
              Create complex trading strategies using our n8n-style drag-and-drop interface. 
              Connect nodes, set conditions, and automate your entire trading process.
            </p>
          </div>

          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 hover:border-primary-500 transition-all duration-300 hover:transform hover:scale-105 hover:shadow-xl hover:shadow-primary-500/20 animate-slide-in-up delay-100">
            <div className="w-12 h-12 bg-primary-500/10 rounded-lg flex items-center justify-center mb-4 animate-pulse-slow delay-200">
              <Shield size={24} className="text-primary-500" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">23+ Trading Nodes</h3>
            <p className="text-gray-300 text-sm leading-relaxed">
              Access technical indicators (RSI, MACD, Bollinger Bands), risk management tools, 
              order execution, and AI analysis nodes. Everything you need in one platform.
            </p>
          </div>

          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 hover:border-primary-500 transition-all duration-300 hover:transform hover:scale-105 hover:shadow-xl hover:shadow-primary-500/20 animate-slide-in-right delay-200">
            <div className="w-12 h-12 bg-primary-500/10 rounded-lg flex items-center justify-center mb-4 animate-pulse-slow delay-400">
              <BarChart3 size={24} className="text-primary-500" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Automated Execution</h3>
            <p className="text-gray-300 text-sm leading-relaxed">
              Schedule workflows with cron expressions, price triggers, or time intervals. 
              Your strategies run 24/7 without manual intervention.
            </p>
          </div>
        </div>

        {/* Workflow Templates */}
        <div className="bg-gray-800 p-8 rounded-xl border border-gray-700 mb-8">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="text-2xl font-bold text-white mb-4">Ready-to-Use Templates</h3>
              <p className="text-gray-400 mb-6">Start trading in minutes with our pre-built strategies</p>
              <ul className="space-y-3 text-gray-300">
                <li className="flex items-start">
                  <span className="text-primary-500 mr-2">→</span>
                  <span><strong>RSI Oversold Strategy:</strong> Buy when RSI drops below 30</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary-500 mr-2">→</span>
                  <span><strong>Price Breakout:</strong> Auto-trade on resistance breaks</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary-500 mr-2">→</span>
                  <span><strong>Daily Risk Check:</strong> Monitor account health automatically</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary-500 mr-2">→</span>
                  <span><strong>15-Min Scalping:</strong> Quick trades every 15 minutes</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary-500 mr-2">→</span>
                  <span><strong>MACD Crossover:</strong> Trade on bullish/bearish signals</span>
                </li>
              </ul>
            </div>
            <div className="bg-gradient-to-br from-primary-900/20 to-gray-900 rounded-lg p-8">
              <div className="text-center">
                {/* Simple horizontal flow */}
                <div className="flex items-center justify-center gap-4 mb-6">
                  <div className="w-20 h-20 bg-primary-500/20 rounded-lg flex items-center justify-center hover:bg-primary-500/40 transition-all duration-300 animate-bounce-slow border-2 border-primary-500/30">
                    <span className="text-primary-500 text-xs font-semibold">Trigger</span>
                  </div>
                  <div className="text-primary-500 text-2xl animate-pulse">→</div>
                  <div className="w-20 h-20 bg-primary-500/20 rounded-lg flex items-center justify-center hover:bg-primary-500/40 transition-all duration-300 animate-bounce-slow delay-100 border-2 border-primary-500/30">
                    <span className="text-primary-500 text-xs font-semibold">Price</span>
                  </div>
                  <div className="text-primary-500 text-2xl animate-pulse">→</div>
                  <div className="w-20 h-20 bg-primary-500/20 rounded-lg flex items-center justify-center hover:bg-primary-500/40 transition-all duration-300 animate-bounce-slow delay-200 border-2 border-primary-500/30">
                    <span className="text-primary-500 text-xs font-semibold">RSI</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-center gap-4 mb-4">
                  <div className="w-20 h-20 bg-primary-500/20 rounded-lg flex items-center justify-center hover:bg-primary-500/40 transition-all duration-300 animate-bounce-slow delay-300 border-2 border-primary-500/30">
                    <span className="text-primary-500 text-xs font-semibold">Risk</span>
                  </div>
                  <div className="text-primary-500 text-2xl animate-pulse">→</div>
                  <div className="w-20 h-20 bg-primary-500/40 rounded-lg flex items-center justify-center hover:bg-primary-500/60 transition-all duration-300 animate-pulse border-2 border-primary-500 shadow-lg shadow-primary-500/50">
                    <span className="text-primary-400 text-xs font-bold">Order</span>
                  </div>
                  <div className="text-primary-500 text-2xl animate-pulse">→</div>
                  <div className="w-20 h-20 bg-primary-500/20 rounded-lg flex items-center justify-center hover:bg-primary-500/40 transition-all duration-300 animate-bounce-slow delay-500 border-2 border-primary-500/30">
                    <span className="text-primary-500 text-xs font-semibold">Alert</span>
                  </div>
                </div>
                
                <p className="text-gray-400 text-sm animate-fade-in mt-4">Visual Workflow: Trigger → Analyze → Execute → Notify</p>
              </div>
            </div>
          </div>
        </div>

        {/* Available Nodes */}
        <div className="grid md:grid-cols-4 gap-4">
          <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
            <h4 className="font-bold text-white mb-2 text-sm">Triggers (6)</h4>
            <ul className="text-xs text-gray-400 space-y-1">
              <li>• Manual Trigger</li>
              <li>• Schedule (Cron)</li>
              <li>• Price Alert</li>
              <li>• Indicator Signal</li>
              <li>• Time Interval</li>
              <li>• Webhook</li>
            </ul>
          </div>

          <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
            <h4 className="font-bold text-white mb-2 text-sm">Indicators (5)</h4>
            <ul className="text-xs text-gray-400 space-y-1">
              <li>• RSI</li>
              <li>• MACD</li>
              <li>• Moving Average</li>
              <li>• Bollinger Bands</li>
              <li>• ATR</li>
            </ul>
          </div>

          <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
            <h4 className="font-bold text-white mb-2 text-sm">Risk Management (5)</h4>
            <ul className="text-xs text-gray-400 space-y-1">
              <li>• Position Sizer</li>
              <li>• R:R Calculator</li>
              <li>• Drawdown Monitor</li>
              <li>• Loss Limit</li>
              <li>• Max Positions</li>
            </ul>
          </div>

          <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
            <h4 className="font-bold text-white mb-2 text-sm">AI & More (7)</h4>
            <ul className="text-xs text-gray-400 space-y-1">
              <li>• OpenAI Analysis</li>
              <li>• Local LLM</li>
              <li>• Market Orders</li>
              <li>• Conditions</li>
              <li>• Notifications</li>
              <li>• Telegram Bot</li>
              <li>• Email Alerts</li>
            </ul>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-12 text-center">
          <button
            onClick={() => router.push('/register')}
            className="px-8 py-4 bg-primary-600 text-white text-lg font-semibold rounded-lg hover:bg-primary-700 transition-colors shadow-lg"
          >
            Start Building Workflows Free
          </button>
          <p className="text-gray-400 text-sm mt-4">No credit card required • 3 workflows included in free plan</p>
        </div>
      </section>

      {/* Features */}
      <section id="features" ref={featuresRef} className="section-anchor container mx-auto px-4 py-20">
        <h2 className="text-4xl font-bold text-white text-center mb-12">Platform Features</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
            <Zap size={40} className="text-primary-500 mb-3" />
            <h3 className="text-xl font-bold text-white mb-3">Ultra-Low Latency</h3>
            <p className="text-gray-300 text-sm leading-relaxed">
              WebSocket-based real-time execution ensures your trades are executed instantly
              with minimal delay.
            </p>
          </div>

          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
            <Shield size={40} className="text-primary-500 mb-3" />
            <h3 className="text-xl font-bold text-white mb-3">Secure & Encrypted</h3>
            <p className="text-gray-300 text-sm leading-relaxed">
              Bank-level encryption protects your MT5 credentials and trading data at all times.
            </p>
          </div>

          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
            <BarChart3 size={40} className="text-primary-500 mb-3" />
            <h3 className="text-xl font-bold text-white mb-3">Real-Time Monitoring</h3>
            <p className="text-gray-300 text-sm leading-relaxed">
              Track your equity, trades, and P&L in real-time with our intuitive dashboard.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" ref={pricingRef} className="section-anchor container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-white mb-4">Simple, Transparent Pricing</h2>
          <p className="text-xl text-gray-300">Choose the plan that fits your trading needs</p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Free Plan */}
          <div className="bg-gray-800 p-8 rounded-2xl border border-gray-700 hover:border-gray-600 transition-all">
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-white mb-2">Starter</h3>
              <p className="text-gray-400 text-sm">Perfect for beginners</p>
            </div>
            <div className="mb-6">
              <p className="text-5xl font-bold text-white">$0</p>
              <p className="text-gray-400 text-sm mt-1">Forever free</p>
            </div>
            <ul className="space-y-4 mb-8 text-gray-300">
              <li className="flex items-start">
                <span className="text-primary-500 mr-3 mt-1">✓</span>
                <span>1 MT5 Account Connection</span>
              </li>
              <li className="flex items-start">
                <span className="text-primary-500 mr-3 mt-1">✓</span>
                <span>100 Trades per Month</span>
              </li>
              <li className="flex items-start">
                <span className="text-primary-500 mr-3 mt-1">✓</span>
                <span>3 Agentic Workflows</span>
              </li>
              <li className="flex items-start">
                <span className="text-primary-500 mr-3 mt-1">✓</span>
                <span>Basic Technical Indicators</span>
              </li>
              <li className="flex items-start">
                <span className="text-primary-500 mr-3 mt-1">✓</span>
                <span>Email Support</span>
              </li>
            </ul>
            <button 
              onClick={() => router.push('/register')}
              className="w-full px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors font-semibold"
            >
              Get Started Free
            </button>
          </div>

          {/* Pro Plan */}
          <div className="bg-gradient-to-b from-primary-900/50 to-gray-800 p-8 rounded-2xl border-2 border-primary-500 relative hover:shadow-2xl hover:shadow-primary-500/20 transition-all transform hover:scale-105">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <span className="bg-primary-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                Most Popular
              </span>
            </div>
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-white mb-2">Professional</h3>
              <p className="text-gray-300 text-sm">For serious traders</p>
            </div>
            <div className="mb-6">
              <p className="text-5xl font-bold text-white">$29</p>
              <p className="text-gray-300 text-sm mt-1">per month, billed monthly</p>
            </div>
            <ul className="space-y-4 mb-8 text-white">
              <li className="flex items-start">
                <span className="text-primary-400 mr-3 mt-1">✓</span>
                <span><strong>5 MT5 Accounts</strong></span>
              </li>
              <li className="flex items-start">
                <span className="text-primary-400 mr-3 mt-1">✓</span>
                <span><strong>Unlimited Trades</strong></span>
              </li>
              <li className="flex items-start">
                <span className="text-primary-400 mr-3 mt-1">✓</span>
                <span><strong>20 Agentic Workflows</strong></span>
              </li>
              <li className="flex items-start">
                <span className="text-primary-400 mr-3 mt-1">✓</span>
                <span>All Technical Indicators</span>
              </li>
              <li className="flex items-start">
                <span className="text-primary-400 mr-3 mt-1">✓</span>
                <span>AI-Powered Analysis (OpenAI)</span>
              </li>
              <li className="flex items-start">
                <span className="text-primary-400 mr-3 mt-1">✓</span>
                <span>Advanced Risk Management</span>
              </li>
              <li className="flex items-start">
                <span className="text-primary-400 mr-3 mt-1">✓</span>
                <span>Telegram & Email Alerts</span>
              </li>
              <li className="flex items-start">
                <span className="text-primary-400 mr-3 mt-1">✓</span>
                <span>Priority Support (24/7)</span>
              </li>
            </ul>
            <button 
              onClick={() => router.push('/register')}
              className="w-full px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-semibold shadow-lg"
            >
              Start Pro Trial
            </button>
          </div>

          {/* Enterprise Plan */}
          <div className="bg-gray-800 p-8 rounded-2xl border border-gray-700 hover:border-gray-600 transition-all">
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-white mb-2">Enterprise</h3>
              <p className="text-gray-400 text-sm">For institutions & teams</p>
            </div>
            <div className="mb-6">
              <p className="text-3xl font-bold text-white">Custom</p>
              <p className="text-gray-400 text-sm mt-1">Tailored to your needs</p>
            </div>
            <ul className="space-y-4 mb-8 text-gray-300">
              <li className="flex items-start">
                <span className="text-primary-500 mr-3 mt-1">✓</span>
                <span><strong>Unlimited MT5 Accounts</strong></span>
              </li>
              <li className="flex items-start">
                <span className="text-primary-500 mr-3 mt-1">✓</span>
                <span><strong>Unlimited Everything</strong></span>
              </li>
              <li className="flex items-start">
                <span className="text-primary-500 mr-3 mt-1">✓</span>
                <span>Dedicated Infrastructure</span>
              </li>
              <li className="flex items-start">
                <span className="text-primary-500 mr-3 mt-1">✓</span>
                <span>Custom Node Development</span>
              </li>
              <li className="flex items-start">
                <span className="text-primary-500 mr-3 mt-1">✓</span>
                <span>White-Label Solution</span>
              </li>
              <li className="flex items-start">
                <span className="text-primary-500 mr-3 mt-1">✓</span>
                <span>API Access & Webhooks</span>
              </li>
              <li className="flex items-start">
                <span className="text-primary-500 mr-3 mt-1">✓</span>
                <span>Dedicated Account Manager</span>
              </li>
              <li className="flex items-start">
                <span className="text-primary-500 mr-3 mt-1">✓</span>
                <span>SLA Guarantee</span>
              </li>
            </ul>
            <button className="w-full px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors font-semibold">
              Contact Sales
            </button>
          </div>
        </div>

        {/* Pricing FAQ */}
        <div className="mt-16 max-w-3xl mx-auto">
          <div className="bg-gray-800 p-8 rounded-xl border border-gray-700">
            <h3 className="text-2xl font-bold text-white mb-6 text-center">Frequently Asked Questions</h3>
            <div className="space-y-4 text-left">
              <div>
                <p className="font-semibold text-white mb-2">Can I upgrade or downgrade anytime?</p>
                <p className="text-gray-400 text-sm">Yes! You can change your plan at any time. Upgrades take effect immediately, and downgrades at the end of your billing cycle.</p>
              </div>
              <div>
                <p className="font-semibold text-white mb-2">What payment methods do you accept?</p>
                <p className="text-gray-400 text-sm">We accept all major credit cards, PayPal, and cryptocurrency payments.</p>
              </div>
              <div>
                <p className="font-semibold text-white mb-2">Is there a free trial for Pro plan?</p>
                <p className="text-gray-400 text-sm">Yes! Get 14 days free trial with full access to all Pro features. No credit card required.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-4xl font-bold text-white text-center mb-12">What Our Users Say</h2>
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
            <p className="text-gray-300 mb-4 text-sm leading-relaxed">"TradingMaven has completely transformed my trading workflow. The ability to manage multiple MT5 accounts from a single interface is a game-changer. Highly recommended!"</p>
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-primary-500 flex-shrink-0"></div>
              <div className="ml-3">
                <p className="font-bold text-white text-sm">John Doe</p>
                <p className="text-xs text-gray-400">Day Trader</p>
              </div>
            </div>
          </div>
          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
            <p className="text-gray-300 mb-4 text-sm leading-relaxed">"The automated trading and risk management features have saved me countless hours and improved my profitability. The platform is stable, fast, and reliable."</p>
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-primary-500 flex-shrink-0"></div>
              <div className="ml-3">
                <p className="font-bold text-white text-sm">Jane Smith</p>
                <p className="text-xs text-gray-400">Algorithmic Trader</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 border-t border-gray-800">
        <p className="text-center text-gray-400">
          © 2024 Trading Maven. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
