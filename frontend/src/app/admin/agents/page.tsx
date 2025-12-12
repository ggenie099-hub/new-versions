'use client';

import { useState } from 'react';
import { Bot, Plus, Edit3, Trash2, MoreHorizontal, Save, X, Sparkles, TrendingUp, Coins, Target, LineChart, BarChart3, Newspaper, Shield, Settings2, Zap, Check } from 'lucide-react';

interface Agent {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  enabled: boolean;
  promptCards: { id: string; title: string; prompt: string; }[];
  systemPrompt: string;
}

const iconMap: Record<string, any> = {
  Bot, TrendingUp, Coins, Target, LineChart, BarChart3, Newspaper, Shield, Settings2, Zap
};

const defaultAgents: Agent[] = [
  { id: 'general', name: 'General Assistant', description: 'General trading help', icon: 'Bot', color: 'text-primary-500', enabled: true, systemPrompt: 'You are a helpful trading assistant.', promptCards: [
    { id: 'g1', title: 'Trading basics', prompt: 'Explain the basics of trading for beginners' },
    { id: 'g2', title: 'Risk management', prompt: 'What are the best risk management practices?' },
  ]},
  { id: 'forex', name: 'Forex Expert', description: 'Currency analysis', icon: 'TrendingUp', color: 'text-green-500', enabled: true, systemPrompt: 'You are a forex trading expert.', promptCards: [
    { id: 'f1', title: 'EUR/USD Analysis', prompt: 'Analyze EUR/USD with key levels' },
    { id: 'f2', title: 'Support/Resistance', prompt: 'Key support resistance for GBP/JPY' },
  ]},
  { id: 'crypto', name: 'Crypto Expert', description: 'Crypto analysis', icon: 'Coins', color: 'text-orange-500', enabled: true, systemPrompt: 'You are a cryptocurrency expert.', promptCards: [
    { id: 'c1', title: 'BTC Analysis', prompt: 'Analyze BTC market structure' },
    { id: 'c2', title: 'Altcoin Picks', prompt: 'Bullish altcoins right now' },
  ]},
  { id: 'options', name: 'Options Analyst', description: 'Options & Greeks', icon: 'Target', color: 'text-purple-500', enabled: true, systemPrompt: 'You are an options trading expert.', promptCards: [
    { id: 'o1', title: 'Options Chain', prompt: 'Analyze NIFTY options chain' },
    { id: 'o2', title: 'Iron Condor', prompt: 'Iron condor strategy for BANKNIFTY' },
  ]},
  { id: 'technical', name: 'Technical Analysis', description: 'Charts & indicators', icon: 'LineChart', color: 'text-blue-500', enabled: true, systemPrompt: 'You are a technical analysis expert.', promptCards: [
    { id: 't1', title: 'Chart Patterns', prompt: 'Identify chart patterns' },
    { id: 't2', title: 'RSI & MACD', prompt: 'RSI and MACD signals' },
  ]},
];

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>(defaultAgents);
  const [showEditor, setShowEditor] = useState(false);
  const [editAgent, setEditAgent] = useState<Agent | null>(null);
  const [menuId, setMenuId] = useState<string | null>(null);

  // Editor state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('Bot');
  const [color, setColor] = useState('text-primary-500');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [promptCards, setPromptCards] = useState<{ id: string; title: string; prompt: string; }[]>([]);

  const colors = ['text-primary-500', 'text-green-500', 'text-orange-500', 'text-purple-500', 'text-blue-500', 'text-cyan-500', 'text-yellow-500', 'text-red-500', 'text-indigo-500', 'text-emerald-500'];

  const openEditor = (agent?: Agent) => {
    if (agent) {
      setEditAgent(agent);
      setName(agent.name);
      setDescription(agent.description);
      setIcon(agent.icon);
      setColor(agent.color);
      setSystemPrompt(agent.systemPrompt);
      setPromptCards([...agent.promptCards]);
    } else {
      setEditAgent(null);
      setName('');
      setDescription('');
      setIcon('Bot');
      setColor('text-primary-500');
      setSystemPrompt('');
      setPromptCards([{ id: Date.now().toString(), title: '', prompt: '' }]);
    }
    setShowEditor(true);
  };

  const saveAgent = () => {
    const newAgent: Agent = {
      id: editAgent?.id || name.toLowerCase().replace(/\s+/g, '-'),
      name,
      description,
      icon,
      color,
      enabled: editAgent?.enabled ?? true,
      systemPrompt,
      promptCards: promptCards.filter(p => p.title && p.prompt),
    };

    if (editAgent) {
      setAgents(agents.map(a => a.id === editAgent.id ? newAgent : a));
    } else {
      setAgents([...agents, newAgent]);
    }
    setShowEditor(false);
  };

  const toggleAgent = (id: string) => {
    setAgents(agents.map(a => a.id === id ? { ...a, enabled: !a.enabled } : a));
  };

  const deleteAgent = (id: string) => {
    if (confirm('Are you sure you want to delete this agent?')) {
      setAgents(agents.filter(a => a.id !== id));
    }
    setMenuId(null);
  };

  const addPromptCard = () => {
    setPromptCards([...promptCards, { id: Date.now().toString(), title: '', prompt: '' }]);
  };

  const updatePromptCard = (id: string, field: 'title' | 'prompt', value: string) => {
    setPromptCards(promptCards.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const removePromptCard = (id: string) => {
    setPromptCards(promptCards.filter(p => p.id !== id));
  };

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">AI Agents</h1>
          <p className="text-gray-400 text-sm">Manage AI agents and their prompt cards</p>
        </div>
        <button onClick={() => openEditor()} className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-all">
          <Plus size={18}/><span>New Agent</span>
        </button>
      </div>

      {/* Agents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {agents.map(agent => {
          const Icon = iconMap[agent.icon] || Bot;
          return (
            <div key={agent.id} className={`bg-gray-900 border rounded-xl p-5 transition-all ${agent.enabled ? 'border-gray-800 hover:border-gray-700' : 'border-gray-800/50 opacity-60'}`}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl bg-gray-800 flex items-center justify-center`}>
                    <Icon size={24} className={agent.color}/>
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{agent.name}</h3>
                    <p className="text-sm text-gray-500">{agent.description}</p>
                  </div>
                </div>
                <div className="relative">
                  <button onClick={() => setMenuId(menuId === agent.id ? null : agent.id)} className="p-2 hover:bg-gray-800 rounded-lg text-gray-400">
                    <MoreHorizontal size={18}/>
                  </button>
                  {menuId === agent.id && (
                    <div className="absolute right-0 top-full mt-1 w-40 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-10 py-1">
                      <button onClick={() => { openEditor(agent); setMenuId(null); }} className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-700 flex items-center gap-2">
                        <Edit3 size={14}/> Edit
                      </button>
                      <button onClick={() => { toggleAgent(agent.id); setMenuId(null); }} className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-700 flex items-center gap-2">
                        <Check size={14}/> {agent.enabled ? 'Disable' : 'Enable'}
                      </button>
                      <div className="border-t border-gray-700 my-1"/>
                      <button onClick={() => deleteAgent(agent.id)} className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-gray-700 flex items-center gap-2">
                        <Trash2 size={14}/> Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs text-gray-500">Prompt Cards ({agent.promptCards.length})</p>
                <div className="flex flex-wrap gap-2">
                  {agent.promptCards.slice(0, 3).map(card => (
                    <span key={card.id} className="px-2 py-1 text-xs bg-gray-800 text-gray-400 rounded">{card.title}</span>
                  ))}
                  {agent.promptCards.length > 3 && (
                    <span className="px-2 py-1 text-xs bg-gray-800 text-gray-500 rounded">+{agent.promptCards.length - 3} more</span>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-800 flex items-center justify-between">
                <span className={`px-2 py-1 text-xs rounded-full ${agent.enabled ? 'bg-green-500/20 text-green-400' : 'bg-gray-700 text-gray-500'}`}>
                  {agent.enabled ? 'Active' : 'Disabled'}
                </span>
                <button onClick={() => openEditor(agent)} className="text-sm text-primary-500 hover:text-primary-400">Edit Agent</button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Editor Modal */}
      {showEditor && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-800">
              <h2 className="text-lg font-semibold text-white">{editAgent ? 'Edit Agent' : 'New Agent'}</h2>
              <button onClick={() => setShowEditor(false)} className="p-2 hover:bg-gray-800 rounded-lg text-gray-400"><X size={20}/></button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Name</label>
                  <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Agent name..."
                    className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-primary-500 outline-none"/>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Description</label>
                  <input type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder="Short description..."
                    className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-primary-500 outline-none"/>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Icon</label>
                  <select value={icon} onChange={e => setIcon(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-primary-500 outline-none">
                    {Object.keys(iconMap).map(i => <option key={i} value={i}>{i}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Color</label>
                  <div className="flex gap-2 flex-wrap">
                    {colors.map(c => (
                      <button key={c} onClick={() => setColor(c)} className={`w-8 h-8 rounded-lg border-2 ${color === c ? 'border-white' : 'border-transparent'}`}>
                        <div className={`w-full h-full rounded-md ${c.replace('text-', 'bg-')}`}/>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">System Prompt</label>
                <textarea value={systemPrompt} onChange={e => setSystemPrompt(e.target.value)} placeholder="Define the agent's behavior..." rows={3}
                  className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-primary-500 outline-none resize-none"/>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm text-gray-400">Prompt Cards</label>
                  <button onClick={addPromptCard} className="text-sm text-primary-500 hover:text-primary-400 flex items-center gap-1">
                    <Plus size={14}/> Add Card
                  </button>
                </div>
                <div className="space-y-3">
                  {promptCards.map((card, i) => (
                    <div key={card.id} className="bg-gray-800 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-gray-500">Card {i + 1}</span>
                        <button onClick={() => removePromptCard(card.id)} className="text-gray-500 hover:text-red-400"><X size={14}/></button>
                      </div>
                      <input type="text" value={card.title} onChange={e => updatePromptCard(card.id, 'title', e.target.value)} placeholder="Card title..."
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm placeholder-gray-500 focus:border-primary-500 outline-none mb-2"/>
                      <input type="text" value={card.prompt} onChange={e => updatePromptCard(card.id, 'prompt', e.target.value)} placeholder="Prompt text..."
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm placeholder-gray-500 focus:border-primary-500 outline-none"/>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-800">
              <button onClick={() => setShowEditor(false)} className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg">Cancel</button>
              <button onClick={saveAgent} disabled={!name} className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg disabled:opacity-50">
                <Save size={18}/><span>Save Agent</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
