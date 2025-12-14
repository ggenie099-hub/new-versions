'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, Plus, Play, Power, Trash2, Zap, TrendingUp, 
  Bell, Shield, Clock, BarChart3, Target, AlertTriangle, X
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

const WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
  {
    id: 'price-alert',
    name: 'Price Alert System',
    description: 'Get notified when price reaches your target level',
    icon: Bell,
    color: 'blue',
    category: 'Alerts',
    trigger_type: 'price_condition',
    nodes: [
      { id: 'node-1', type: 'GetLivePrice', data: { symbol: 'EURUSD' }, position: { x: 100, y: 100 } },
      { id: 'node-2', type: 'Condition', data: { condition: 'price > 1.1000', operator: '>' }, position: { x: 300, y: 100 } },
      { id: 'node-3', type: 'DashboardNotification', data: { title: 'Price Alert', message: 'EURUSD reached target!', type: 'success' }, position: { x: 500, y: 100 } }
    ],
    connections: [{ id: 'conn-1', source: 'node-1', target: 'node-2' }, { id: 'conn-2', source: 'node-2', target: 'node-3' }]
  },
  {
    id: 'trend-follower',
    name: 'Trend Following Bot',
    description: 'Auto-trade based on moving average crossover signals',
    icon: TrendingUp,
    color: 'green',
    category: 'Trading',
    trigger_type: 'scheduled',
    nodes: [
      { id: 'node-1', type: 'GetLivePrice', data: { symbol: 'EURUSD' }, position: { x: 100, y: 100 } },
      { id: 'node-2', type: 'TechnicalIndicator', data: { indicator: 'SMA', period: 20 }, position: { x: 300, y: 50 } },
      { id: 'node-3', type: 'TechnicalIndicator', data: { indicator: 'SMA', period: 50 }, position: { x: 300, y: 150 } },
      { id: 'node-4', type: 'Condition', data: { condition: 'sma20 > sma50', operator: 'crossover' }, position: { x: 500, y: 100 } },
      { id: 'node-5', type: 'PlaceOrder', data: { orderType: 'BUY', volume: 0.01, sl: 50, tp: 100 }, position: { x: 700, y: 100 } }
    ],
    connections: [
      { id: 'conn-1', source: 'node-1', target: 'node-2' }, { id: 'conn-2', source: 'node-1', target: 'node-3' },
      { id: 'conn-3', source: 'node-2', target: 'node-4' }, { id: 'conn-4', source: 'node-3', target: 'node-4' },
      { id: 'conn-5', source: 'node-4', target: 'node-5' }
    ]
  },
  {
    id: 'risk-manager',
    name: 'Risk Management Bot',
    description: 'Auto close trades when daily loss limit is reached',
    icon: Shield,
    color: 'red',
    category: 'Risk',
    trigger_type: 'scheduled',
    nodes: [
      { id: 'node-1', type: 'GetAccountInfo', data: {}, position: { x: 100, y: 100 } },
      { id: 'node-2', type: 'Condition', data: { condition: 'daily_loss > 100', operator: '>' }, position: { x: 300, y: 100 } },
      { id: 'node-3', type: 'CloseAllTrades', data: { reason: 'Daily loss limit reached' }, position: { x: 500, y: 50 } },
      { id: 'node-4', type: 'DashboardNotification', data: { title: 'Risk Alert', message: 'All trades closed - Loss limit reached', type: 'warning' }, position: { x: 500, y: 150 } }
    ],
    connections: [
      { id: 'conn-1', source: 'node-1', target: 'node-2' },
      { id: 'conn-2', source: 'node-2', target: 'node-3' }, { id: 'conn-3', source: 'node-2', target: 'node-4' }
    ]
  },
  {
    id: 'news-trader',
    name: 'News Event Trader',
    description: 'Trade automatically during high-impact news events',
    icon: Zap,
    color: 'yellow',
    category: 'Trading',
    trigger_type: 'news_event',
    nodes: [
      { id: 'node-1', type: 'NewsEvent', data: { impact: 'high', currency: 'USD' }, position: { x: 100, y: 100 } },
      { id: 'node-2', type: 'GetLivePrice', data: { symbol: 'EURUSD' }, position: { x: 300, y: 100 } },
      { id: 'node-3', type: 'PlaceOrder', data: { orderType: 'BUY_STOP', volume: 0.01, distance: 20 }, position: { x: 500, y: 50 } },
      { id: 'node-4', type: 'PlaceOrder', data: { orderType: 'SELL_STOP', volume: 0.01, distance: 20 }, position: { x: 500, y: 150 } }
    ],
    connections: [
      { id: 'conn-1', source: 'node-1', target: 'node-2' },
      { id: 'conn-2', source: 'node-2', target: 'node-3' }, { id: 'conn-3', source: 'node-2', target: 'node-4' }
    ]
  },
  {
    id: 'scalper',
    name: 'Quick Scalper Bot',
    description: 'Fast in-and-out trades with tight stop loss',
    icon: Clock,
    color: 'purple',
    category: 'Trading',
    trigger_type: 'scheduled',
    nodes: [
      { id: 'node-1', type: 'GetLivePrice', data: { symbol: 'EURUSD' }, position: { x: 100, y: 100 } },
      { id: 'node-2', type: 'TechnicalIndicator', data: { indicator: 'RSI', period: 7 }, position: { x: 300, y: 100 } },
      { id: 'node-3', type: 'Condition', data: { condition: 'rsi < 30', operator: '<' }, position: { x: 500, y: 100 } },
      { id: 'node-4', type: 'PlaceOrder', data: { orderType: 'BUY', volume: 0.05, sl: 10, tp: 15 }, position: { x: 700, y: 100 } }
    ],
    connections: [
      { id: 'conn-1', source: 'node-1', target: 'node-2' },
      { id: 'conn-2', source: 'node-2', target: 'node-3' },
      { id: 'conn-3', source: 'node-3', target: 'node-4' }
    ]
  },
  {
    id: 'breakout-trader',
    name: 'Breakout Trader',
    description: 'Trade breakouts from support/resistance levels',
    icon: Target,
    color: 'orange',
    category: 'Trading',
    trigger_type: 'price_condition',
    nodes: [
      { id: 'node-1', type: 'GetLivePrice', data: { symbol: 'XAUUSD' }, position: { x: 100, y: 100 } },
      { id: 'node-2', type: 'TechnicalIndicator', data: { indicator: 'Donchian', period: 20 }, position: { x: 300, y: 100 } },
      { id: 'node-3', type: 'Condition', data: { condition: 'price > upper_band', operator: 'breakout' }, position: { x: 500, y: 100 } },
      { id: 'node-4', type: 'PlaceOrder', data: { orderType: 'BUY', volume: 0.01, sl: 100, tp: 200 }, position: { x: 700, y: 100 } }
    ],
    connections: [
      { id: 'conn-1', source: 'node-1', target: 'node-2' },
      { id: 'conn-2', source: 'node-2', target: 'node-3' },
      { id: 'conn-3', source: 'node-3', target: 'node-4' }
    ]
  },
  {
    id: 'daily-report',
    name: 'Daily Trading Report',
    description: 'Get daily summary of your trading performance',
    icon: BarChart3,
    color: 'cyan',
    category: 'Reports',
    trigger_type: 'scheduled',
    nodes: [
      { id: 'node-1', type: 'GetAccountInfo', data: {}, position: { x: 100, y: 100 } },
      { id: 'node-2', type: 'GetTradeHistory', data: { period: 'today' }, position: { x: 100, y: 200 } },
      { id: 'node-3', type: 'GenerateReport', data: { type: 'daily_summary' }, position: { x: 300, y: 150 } },
      { id: 'node-4', type: 'DashboardNotification', data: { title: 'Daily Report', message: 'Your daily trading summary is ready', type: 'info' }, position: { x: 500, y: 150 } }
    ],
    connections: [
      { id: 'conn-1', source: 'node-1', target: 'node-3' },
      { id: 'conn-2', source: 'node-2', target: 'node-3' },
      { id: 'conn-3', source: 'node-3', target: 'node-4' }
    ]
  },
  {
    id: 'drawdown-alert',
    name: 'Drawdown Alert',
    description: 'Get warned when account drawdown exceeds limit',
    icon: AlertTriangle,
    color: 'red',
    category: 'Risk',
    trigger_type: 'scheduled',
    nodes: [
      { id: 'node-1', type: 'GetAccountInfo', data: {}, position: { x: 100, y: 100 } },
      { id: 'node-2', type: 'CalculateDrawdown', data: {}, position: { x: 300, y: 100 } },
      { id: 'node-3', type: 'Condition', data: { condition: 'drawdown > 10%', operator: '>' }, position: { x: 500, y: 100 } },
      { id: 'node-4', type: 'DashboardNotification', data: { title: 'Drawdown Alert', message: 'Account drawdown exceeded 10%!', type: 'error' }, position: { x: 700, y: 100 } }
    ],
    connections: [
      { id: 'conn-1', source: 'node-1', target: 'node-2' },
      { id: 'conn-2', source: 'node-2', target: 'node-3' },
      { id: 'conn-3', source: 'node-3', target: 'node-4' }
    ]
  }
];

export default function AgenticPage() {
  const router = useRouter();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTemplates, setShowTemplates] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');

  const categories = ['All', 'Trading', 'Alerts', 'Risk', 'Reports'];

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
