'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, Plus, Play, Power, Trash2, Zap, TrendingUp, 
  Bell, Shield, Clock, BarChart3, Target, AlertTriangle, X, Brain
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Workflow {
  id: number;
  name: string;
  description: string;
  is_active: boolean;
  trigger_type: string;
  created_at: string;
  updated_at: string;
}

interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  icon: any;
  color: string;
  category: string;
  nodes: any[];
  connections: any[];
  trigger_type: string;
}

// WORKING TEMPLATES - All use real backend node types
const WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
  // ===== TRADING STRATEGIES =====
  {
    id: 'rsi-scalper',
    name: 'RSI Scalper Bot',
    description: 'Buy when RSI < 30 (oversold), Sell when RSI > 70 (overbought)',
    icon: TrendingUp,
    color: 'green',
    category: 'Trading',
    trigger_type: 'manual',
    nodes: [
      { id: 'trigger-1', type: 'ManualTrigger', data: {}, position: { x: 50, y: 150 } },
      { id: 'price-1', type: 'GetLivePrice', data: { symbol: 'EURUSD' }, position: { x: 250, y: 150 } },
      { id: 'rsi-1', type: 'RSI', data: { symbol: 'EURUSD', period: '14', timeframe: 'M15' }, position: { x: 450, y: 150 } },
      { id: 'order-1', type: 'MarketOrder', data: { symbol: 'EURUSD', order_type: 'BUY', volume: '0.01', stop_loss: '30', take_profit: '60', comment: 'RSI Scalper' }, position: { x: 650, y: 150 } },
      { id: 'notify-1', type: 'DashboardNotification', data: { title: 'RSI Trade!', message: 'RSI Scalper executed BUY on EURUSD', type: 'success' }, position: { x: 850, y: 150 } }
    ],
    connections: [
      { id: 'c1', source: 'trigger-1', target: 'price-1' },
      { id: 'c2', source: 'price-1', target: 'rsi-1' },
      { id: 'c3', source: 'rsi-1', target: 'order-1' },
      { id: 'c4', source: 'order-1', target: 'notify-1' }
    ]
  },
  {
    id: 'macd-trader',
    name: 'MACD Crossover Bot',
    description: 'Trade on MACD signal line crossovers for trend following',
    icon: TrendingUp,
    color: 'blue',
    category: 'Trading',
    trigger_type: 'manual',
    nodes: [
      { id: 'trigger-1', type: 'ManualTrigger', data: {}, position: { x: 50, y: 150 } },
      { id: 'price-1', type: 'GetLivePrice', data: { symbol: 'GBPUSD' }, position: { x: 250, y: 150 } },
      { id: 'macd-1', type: 'MACD', data: { symbol: 'GBPUSD', fast_period: '12', slow_period: '26', signal_period: '9', timeframe: 'H1' }, position: { x: 450, y: 150 } },
      { id: 'order-1', type: 'MarketOrder', data: { symbol: 'GBPUSD', order_type: 'BUY', volume: '0.01', stop_loss: '40', take_profit: '80', comment: 'MACD Crossover' }, position: { x: 650, y: 150 } },
      { id: 'notify-1', type: 'DashboardNotification', data: { title: 'MACD Signal!', message: 'MACD Crossover trade on GBPUSD', type: 'success' }, position: { x: 850, y: 150 } }
    ],
    connections: [
      { id: 'c1', source: 'trigger-1', target: 'price-1' },
      { id: 'c2', source: 'price-1', target: 'macd-1' },
      { id: 'c3', source: 'macd-1', target: 'order-1' },
      { id: 'c4', source: 'order-1', target: 'notify-1' }
    ]
  },
  {
    id: 'bollinger-bounce',
    name: 'Bollinger Bounce Bot',
    description: 'Trade bounces from Bollinger Band extremes',
    icon: Target,
    color: 'purple',
    category: 'Trading',
    trigger_type: 'manual',
    nodes: [
      { id: 'trigger-1', type: 'ManualTrigger', data: {}, position: { x: 50, y: 150 } },
      { id: 'price-1', type: 'GetLivePrice', data: { symbol: 'USDJPY' }, position: { x: 250, y: 150 } },
      { id: 'bb-1', type: 'BollingerBands', data: { symbol: 'USDJPY', period: '20', deviation: '2', timeframe: 'M30' }, position: { x: 450, y: 150 } },
      { id: 'order-1', type: 'MarketOrder', data: { symbol: 'USDJPY', order_type: 'BUY', volume: '0.01', stop_loss: '25', take_profit: '50', comment: 'BB Bounce' }, position: { x: 650, y: 150 } },
      { id: 'notify-1', type: 'DashboardNotification', data: { title: 'BB Trade!', message: 'Bollinger Bounce on USDJPY', type: 'success' }, position: { x: 850, y: 150 } }
    ],
    connections: [
      { id: 'c1', source: 'trigger-1', target: 'price-1' },
      { id: 'c2', source: 'price-1', target: 'bb-1' },
      { id: 'c3', source: 'bb-1', target: 'order-1' },
      { id: 'c4', source: 'order-1', target: 'notify-1' }
    ]
  },
  {
    id: 'quick-buy',
    name: 'Quick BUY Bot',
    description: 'Instant 1-click BUY order execution on EURUSD',
    icon: Zap,
    color: 'green',
    category: 'Trading',
    trigger_type: 'manual',
    nodes: [
      { id: 'trigger-1', type: 'ManualTrigger', data: {}, position: { x: 100, y: 150 } },
      { id: 'order-1', type: 'MarketOrder', data: { symbol: 'EURUSD', order_type: 'BUY', volume: '0.01', comment: 'Quick Buy' }, position: { x: 350, y: 150 } },
      { id: 'notify-1', type: 'DashboardNotification', data: { title: 'Order Placed!', message: 'Quick BUY executed on EURUSD', type: 'success' }, position: { x: 600, y: 150 } }
    ],
    connections: [
      { id: 'c1', source: 'trigger-1', target: 'order-1' },
      { id: 'c2', source: 'order-1', target: 'notify-1' }
    ]
  },
  {
    id: 'quick-sell',
    name: 'Quick SELL Bot',
    description: 'Instant 1-click SELL order execution on EURUSD',
    icon: Zap,
    color: 'red',
    category: 'Trading',
    trigger_type: 'manual',
    nodes: [
      { id: 'trigger-1', type: 'ManualTrigger', data: {}, position: { x: 100, y: 150 } },
      { id: 'order-1', type: 'MarketOrder', data: { symbol: 'EURUSD', order_type: 'SELL', volume: '0.01', comment: 'Quick Sell' }, position: { x: 350, y: 150 } },
      { id: 'notify-1', type: 'DashboardNotification', data: { title: 'Order Placed!', message: 'Quick SELL executed on EURUSD', type: 'success' }, position: { x: 600, y: 150 } }
    ],
    connections: [
      { id: 'c1', source: 'trigger-1', target: 'order-1' },
      { id: 'c2', source: 'order-1', target: 'notify-1' }
    ]
  },
  {
    id: 'gold-scalper',
    name: 'Gold Scalper Bot',
    description: 'Quick scalping strategy for XAUUSD with tight stops',
    icon: Target,
    color: 'yellow',
    category: 'Trading',
    trigger_type: 'manual',
    nodes: [
      { id: 'trigger-1', type: 'ManualTrigger', data: {}, position: { x: 50, y: 150 } },
      { id: 'price-1', type: 'GetLivePrice', data: { symbol: 'XAUUSD' }, position: { x: 250, y: 150 } },
      { id: 'rsi-1', type: 'RSI', data: { symbol: 'XAUUSD', period: '7', timeframe: 'M5' }, position: { x: 450, y: 150 } },
      { id: 'order-1', type: 'MarketOrder', data: { symbol: 'XAUUSD', order_type: 'BUY', volume: '0.01', stop_loss: '100', take_profit: '200', comment: 'Gold Scalper' }, position: { x: 650, y: 150 } },
      { id: 'notify-1', type: 'DashboardNotification', data: { title: 'Gold Trade!', message: 'Gold Scalper executed on XAUUSD', type: 'success' }, position: { x: 850, y: 150 } }
    ],
    connections: [
      { id: 'c1', source: 'trigger-1', target: 'price-1' },
      { id: 'c2', source: 'price-1', target: 'rsi-1' },
      { id: 'c3', source: 'rsi-1', target: 'order-1' },
      { id: 'c4', source: 'order-1', target: 'notify-1' }
    ]
  },
  // ===== ALERTS =====
  {
    id: 'price-alert',
    name: 'Price Alert System',
    description: 'Get notified with current price of any symbol',
    icon: Bell,
    color: 'blue',
    category: 'Alerts',
    trigger_type: 'manual',
    nodes: [
      { id: 'trigger-1', type: 'ManualTrigger', data: {}, position: { x: 100, y: 150 } },
      { id: 'price-1', type: 'GetLivePrice', data: { symbol: 'EURUSD' }, position: { x: 350, y: 150 } },
      { id: 'notify-1', type: 'DashboardNotification', data: { title: 'Price Alert', message: 'Current EURUSD price fetched!', type: 'info' }, position: { x: 600, y: 150 } }
    ],
    connections: [
      { id: 'c1', source: 'trigger-1', target: 'price-1' },
      { id: 'c2', source: 'price-1', target: 'notify-1' }
    ]
  },
  // ===== RISK MANAGEMENT =====
  {
    id: 'risk-check',
    name: 'Risk Check Bot',
    description: 'Check account status and risk metrics before trading',
    icon: Shield,
    color: 'red',
    category: 'Risk',
    trigger_type: 'manual',
    nodes: [
      { id: 'trigger-1', type: 'ManualTrigger', data: {}, position: { x: 50, y: 150 } },
      { id: 'account-1', type: 'GetAccountInfo', data: {}, position: { x: 250, y: 150 } },
      { id: 'risk-1', type: 'SmartRiskManager', data: { max_risk_percent: '2', max_daily_loss: '5', max_positions: '3' }, position: { x: 450, y: 150 } },
      { id: 'notify-1', type: 'DashboardNotification', data: { title: 'Risk Status', message: 'Account risk check completed', type: 'info' }, position: { x: 650, y: 150 } }
    ],
    connections: [
      { id: 'c1', source: 'trigger-1', target: 'account-1' },
      { id: 'c2', source: 'account-1', target: 'risk-1' },
      { id: 'c3', source: 'risk-1', target: 'notify-1' }
    ]
  },
  {
    id: 'drawdown-monitor',
    name: 'Drawdown Monitor',
    description: 'Monitor account drawdown and get alerts',
    icon: AlertTriangle,
    color: 'orange',
    category: 'Risk',
    trigger_type: 'manual',
    nodes: [
      { id: 'trigger-1', type: 'ManualTrigger', data: {}, position: { x: 100, y: 150 } },
      { id: 'account-1', type: 'GetAccountInfo', data: {}, position: { x: 300, y: 150 } },
      { id: 'dd-1', type: 'DrawdownMonitor', data: { max_drawdown_percent: '10' }, position: { x: 500, y: 150 } },
      { id: 'notify-1', type: 'DashboardNotification', data: { title: 'Drawdown Alert', message: 'Drawdown status checked', type: 'warning' }, position: { x: 700, y: 150 } }
    ],
    connections: [
      { id: 'c1', source: 'trigger-1', target: 'account-1' },
      { id: 'c2', source: 'account-1', target: 'dd-1' },
      { id: 'c3', source: 'dd-1', target: 'notify-1' }
    ]
  },
  // ===== REPORTS =====
  {
    id: 'account-report',
    name: 'Account Status Report',
    description: 'Get complete account balance and equity report',
    icon: BarChart3,
    color: 'cyan',
    category: 'Reports',
    trigger_type: 'manual',
    nodes: [
      { id: 'trigger-1', type: 'ManualTrigger', data: {}, position: { x: 100, y: 150 } },
      { id: 'account-1', type: 'GetAccountInfo', data: {}, position: { x: 350, y: 150 } },
      { id: 'notify-1', type: 'DashboardNotification', data: { title: 'Account Report', message: 'Account status report generated', type: 'info' }, position: { x: 600, y: 150 } }
    ],
    connections: [
      { id: 'c1', source: 'trigger-1', target: 'account-1' },
      { id: 'c2', source: 'account-1', target: 'notify-1' }
    ]
  },
  // ===== AI AGENTS =====
  {
    id: 'ai-trader-ollama',
    name: 'AI Trader (FREE Ollama)',
    description: 'AI-powered trading using FREE local Ollama LLM',
    icon: Brain,
    color: 'purple',
    category: 'AI',
    trigger_type: 'manual',
    nodes: [
      { id: 'trigger-1', type: 'ManualTrigger', data: {}, position: { x: 50, y: 150 } },
      { id: 'price-1', type: 'GetLivePrice', data: { symbol: 'EURUSD' }, position: { x: 250, y: 100 } },
      { id: 'rsi-1', type: 'RSI', data: { symbol: 'EURUSD', period: '14', timeframe: 'M15' }, position: { x: 250, y: 200 } },
      { id: 'ai-1', type: 'AITradingAnalyst', data: { llm_provider: 'ollama', model: 'llama3', symbol: 'EURUSD' }, position: { x: 500, y: 150 } },
      { id: 'decision-1', type: 'AIDecision', data: { min_confidence: '70' }, position: { x: 750, y: 150 } },
      { id: 'notify-1', type: 'DashboardNotification', data: { title: 'AI Analysis', message: 'AI trading analysis complete', type: 'info' }, position: { x: 1000, y: 150 } }
    ],
    connections: [
      { id: 'c1', source: 'trigger-1', target: 'price-1' },
      { id: 'c2', source: 'trigger-1', target: 'rsi-1' },
      { id: 'c3', source: 'price-1', target: 'ai-1' },
      { id: 'c4', source: 'rsi-1', target: 'ai-1' },
      { id: 'c5', source: 'ai-1', target: 'decision-1' },
      { id: 'c6', source: 'decision-1', target: 'notify-1' }
    ]
  },
  {
    id: 'ai-trader-groq',
    name: 'AI Trader (FREE Groq)',
    description: 'AI-powered trading using FREE Groq cloud LLM (fast!)',
    icon: Brain,
    color: 'green',
    category: 'AI',
    trigger_type: 'manual',
    nodes: [
      { id: 'trigger-1', type: 'ManualTrigger', data: {}, position: { x: 50, y: 150 } },
      { id: 'price-1', type: 'GetLivePrice', data: { symbol: 'EURUSD' }, position: { x: 250, y: 150 } },
      { id: 'ai-1', type: 'AITradingAnalyst', data: { llm_provider: 'groq', model: 'llama3-70b-8192', symbol: 'EURUSD', api_key: '' }, position: { x: 500, y: 150 } },
      { id: 'notify-1', type: 'DashboardNotification', data: { title: 'AI Groq Analysis', message: 'Groq AI analysis complete', type: 'success' }, position: { x: 750, y: 150 } }
    ],
    connections: [
      { id: 'c1', source: 'trigger-1', target: 'price-1' },
      { id: 'c2', source: 'price-1', target: 'ai-1' },
      { id: 'c3', source: 'ai-1', target: 'notify-1' }
    ]
  },
  {
    id: 'custom-agent',
    name: 'Custom AI Agent Builder',
    description: 'Build your own AI trading agent with custom personality',
    icon: Brain,
    color: 'blue',
    category: 'AI',
    trigger_type: 'manual',
    nodes: [
      { id: 'trigger-1', type: 'ManualTrigger', data: {}, position: { x: 50, y: 150 } },
      { id: 'price-1', type: 'GetLivePrice', data: { symbol: 'EURUSD' }, position: { x: 250, y: 150 } },
      { id: 'agent-1', type: 'CustomAgent', data: { agent_name: 'My Trading Bot', agent_personality: 'aggressive but calculated', trading_style: 'day trader', risk_tolerance: 'medium', llm_provider: 'ollama', model: 'llama3', prompt: 'Based on current price {price}, what trade should I make?' }, position: { x: 500, y: 150 } },
      { id: 'notify-1', type: 'DashboardNotification', data: { title: 'Custom Agent', message: 'Your AI agent has responded', type: 'info' }, position: { x: 750, y: 150 } }
    ],
    connections: [
      { id: 'c1', source: 'trigger-1', target: 'price-1' },
      { id: 'c2', source: 'price-1', target: 'agent-1' },
      { id: 'c3', source: 'agent-1', target: 'notify-1' }
    ]
  }
];

export default function AgenticPage() {
  const router = useRouter();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTemplates, setShowTemplates] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');

  const categories = ['All', 'Trading', 'Alerts', 'Risk', 'Reports', 'AI'];

  useEffect(() => {
    fetchWorkflows();
  }, []);

  const fetchWorkflows = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('http://localhost:8000/api/agentic/workflows', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setWorkflows(data);
      }
    } catch (error) {
      console.error('Failed to fetch workflows:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleWorkflow = async (workflowId: number) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`http://localhost:8000/api/agentic/workflows/${workflowId}/toggle`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        fetchWorkflows();
        toast.success('Workflow status updated');
      }
    } catch (error) {
      toast.error('Failed to toggle workflow');
    }
  };

  const createFromTemplate = async (template: WorkflowTemplate) => {
    try {
      const token = localStorage.getItem('access_token');
      
      const workflow = {
        name: template.name,
        description: template.description,
        nodes: template.nodes,
        connections: template.connections,
        settings: {},
        trigger_type: template.trigger_type
      };
      
      const response = await fetch('http://localhost:8000/api/agentic/workflows', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(workflow)
      });
      
      if (response.ok) {
        toast.success(`${template.name} created successfully!`);
        setShowTemplates(false);
        fetchWorkflows();
      } else {
        toast.error('Failed to create workflow');
      }
    } catch (error) {
      toast.error('Failed to create workflow');
    }
  };

  const executeWorkflow = async (workflowId: number) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`http://localhost:8000/api/agentic/executions/workflows/${workflowId}/execute`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ test_mode: false })
      });
      
      if (response.ok) {
        toast.success('Workflow executed successfully!');
      } else {
        toast.error('Failed to execute workflow');
      }
    } catch (error) {
      toast.error('Failed to execute workflow');
    }
  };

  const deleteWorkflow = async (workflowId: number) => {
    if (!confirm('Are you sure you want to delete this workflow?')) return;
    
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`http://localhost:8000/api/agentic/workflows/${workflowId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        toast.success('Workflow deleted');
        fetchWorkflows();
      }
    } catch (error) {
      toast.error('Failed to delete workflow');
    }
  };

  const filteredTemplates = selectedCategory === 'All' 
    ? WORKFLOW_TEMPLATES 
    : WORKFLOW_TEMPLATES.filter(t => t.category === selectedCategory);

  const getColorClasses = (color: string) => {
    const colors: Record<string, string> = {
      blue: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      green: 'bg-green-500/20 text-green-400 border-green-500/30',
      red: 'bg-red-500/20 text-red-400 border-red-500/30',
      yellow: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      purple: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      orange: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      cyan: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    };
    return colors[color] || colors.blue;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-xl text-white">Loading workflows...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
            <span>Back to Dashboard</span>
          </button>
          <h1 className="text-3xl font-bold">Agentic Trading System</h1>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => router.push('/dashboard/agentic/builder')}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Plus size={20} />
            Create New Workflow
          </button>
          <button
            onClick={() => setShowTemplates(true)}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Zap size={20} />
            Use Template
          </button>
        </div>
      </div>

      {/* Templates Modal */}
      {showTemplates && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <h2 className="text-xl font-bold">Ready-to-Use Templates</h2>
              <button onClick={() => setShowTemplates(false)} className="p-2 hover:bg-gray-700 rounded-lg">
                <X size={20} />
              </button>
            </div>
            
            {/* Category Filter */}
            <div className="flex gap-2 p-4 border-b border-gray-700">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedCategory === cat 
                      ? 'bg-green-600 text-white' 
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
            
            {/* Templates Grid */}
            <div className="p-4 overflow-y-auto max-h-[60vh]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredTemplates.map(template => {
                  const Icon = template.icon;
                  return (
                    <div
                      key={template.id}
                      className={`p-4 rounded-xl border ${getColorClasses(template.color)} hover:scale-[1.02] transition-transform cursor-pointer`}
                      onClick={() => createFromTemplate(template)}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-3 rounded-lg ${getColorClasses(template.color)}`}>
                          <Icon size={24} />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-white mb-1">{template.name}</h3>
                          <p className="text-sm text-gray-400 mb-2">{template.description}</p>
                          <div className="flex items-center gap-2">
                            <span className="text-xs px-2 py-1 bg-gray-700 rounded">{template.category}</span>
                            <span className="text-xs px-2 py-1 bg-gray-700 rounded">{template.trigger_type}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Workflows List */}
      {workflows.length === 0 ? (
        <div className="text-center py-20 bg-gray-800 rounded-lg border border-gray-700">
          <div className="mb-6">
            <div className="w-24 h-24 mx-auto mb-4 bg-gray-700 rounded-full flex items-center justify-center">
              <Plus size={48} className="text-gray-500" />
            </div>
            <p className="text-2xl mb-2">No workflows yet</p>
            <p className="text-gray-400 mb-8">Create your first automated trading workflow</p>
          </div>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => router.push('/dashboard/agentic/builder')}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
            >
              <Plus size={20} />
              Create New Workflow
            </button>
            <button
              onClick={() => setShowTemplates(true)}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg transition-colors"
            >
              <Zap size={20} />
              Use Template
            </button>
          </div>
          
          {/* Quick Templates Preview */}
          <div className="mt-12 px-8">
            <h3 className="text-lg font-semibold mb-4 text-gray-300">Popular Templates</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {WORKFLOW_TEMPLATES.slice(0, 3).map(template => {
                const Icon = template.icon;
                return (
                  <div
                    key={template.id}
                    onClick={() => createFromTemplate(template)}
                    className={`p-4 rounded-xl border ${getColorClasses(template.color)} hover:scale-[1.02] transition-transform cursor-pointer text-left`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <Icon size={20} />
                      <span className="font-medium">{template.name}</span>
                    </div>
                    <p className="text-sm text-gray-400">{template.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="grid gap-4">
          {workflows.map((workflow) => (
            <div key={workflow.id} className="bg-gray-800 border border-gray-700 p-6 rounded-lg hover:border-gray-600 transition-colors">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-semibold">{workflow.name}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      workflow.is_active 
                        ? 'bg-green-600 text-white' 
                        : 'bg-gray-600 text-gray-300'
                    }`}>
                      {workflow.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <p className="text-gray-400">{workflow.description}</p>
                  <p className="text-xs text-gray-500 mt-2">
                    Trigger: {workflow.trigger_type} • Created: {new Date(workflow.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={() => executeWorkflow(workflow.id)}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  <Play size={16} />
                  Execute Now
                </button>
                <button
                  onClick={() => toggleWorkflow(workflow.id)}
                  className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  <Power size={16} />
                  {workflow.is_active ? 'Deactivate' : 'Activate'}
                </button>
                <button
                  onClick={() => router.push(`/dashboard/agentic/builder?id=${workflow.id}`)}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => deleteWorkflow(workflow.id)}
                  className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors ml-auto"
                >
                  <Trash2 size={16} />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
