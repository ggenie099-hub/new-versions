'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Send, Plus, Trash2, Bot, User, Copy, Check, Square, ChevronDown, Paperclip, X,
  PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen,
  Code, FileText, Table, Sparkles, MoreHorizontal, Edit3, Pin, Download, ArrowLeft,
  TrendingUp, BarChart3, Shield, Newspaper, Settings2, Zap, LineChart, Coins, Target, FileDown, FileSpreadsheet
} from 'lucide-react';

interface Message { id: string; role: 'user' | 'assistant'; content: string; timestamp: Date; artifacts?: Artifact[]; }
interface Artifact { id: string; type: 'code' | 'text' | 'table'; title: string; content: string; language?: string; }
interface Conversation { id: string; title: string; messages: Message[]; createdAt: Date; updatedAt: Date; isPinned?: boolean; agentId?: string; }
interface Model { id: string; name: string; provider: string; }
interface Agent { id: string; name: string; description: string; icon: any; color: string; promptCards: { id: string; title: string; prompt: string; }[]; }

const MODELS: Model[] = [
  { id: 'gpt-4.1', name: 'GPT-4.1', provider: 'OpenAI' },
  { id: 'gpt-4o', name: 'GPT-4o', provider: 'OpenAI' },
  { id: 'claude-3.5', name: 'Claude 3.5 Sonnet', provider: 'Anthropic' },
  { id: 'claude-3-opus', name: 'Claude 3 Opus', provider: 'Anthropic' },
  { id: 'mistral-large', name: 'Mistral Large', provider: 'Mistral' },
];

const AGENTS: Agent[] = [
  { id: 'general', name: 'General Assistant', description: 'General trading help', icon: Bot, color: 'text-primary-500', promptCards: [
    { id: 'g1', title: 'Trading basics', prompt: 'Explain the basics of trading for beginners' },
    { id: 'g2', title: 'Risk management', prompt: 'What are the best risk management practices?' },
    { id: 'g3', title: 'Trading plan', prompt: 'Help me create a trading plan' },
    { id: 'g4', title: 'Market overview', prompt: 'Give me a market overview' },
  ]},
  { id: 'forex', name: 'Forex Expert', description: 'Currency analysis', icon: TrendingUp, color: 'text-green-500', promptCards: [
    { id: 'f1', title: 'EUR/USD Analysis', prompt: 'Analyze EUR/USD with key levels' },
    { id: 'f2', title: 'Support/Resistance', prompt: 'Key support resistance for GBP/JPY' },
    { id: 'f3', title: 'Weekly Plan', prompt: 'Forex trading plan for this week' },
    { id: 'f4', title: 'Fed Impact', prompt: 'Impact of Fed decision on USD' },
  ]},
  { id: 'crypto', name: 'Crypto Expert', description: 'Crypto analysis', icon: Coins, color: 'text-orange-500', promptCards: [
    { id: 'c1', title: 'BTC Analysis', prompt: 'Analyze BTC market structure' },
    { id: 'c2', title: 'Altcoin Picks', prompt: 'Bullish altcoins right now' },
    { id: 'c3', title: 'DeFi Yields', prompt: 'Current DeFi opportunities' },
    { id: 'c4', title: 'Portfolio', prompt: 'Crypto portfolio rebalancing' },
  ]},
  { id: 'options', name: 'Options Analyst', description: 'Options & Greeks', icon: Target, color: 'text-purple-500', promptCards: [
    { id: 'o1', title: 'Options Chain', prompt: 'Analyze NIFTY options chain' },
    { id: 'o2', title: 'Iron Condor', prompt: 'Iron condor strategy for BANKNIFTY' },
    { id: 'o3', title: 'Greeks', prompt: 'Explain Greeks for my position' },
    { id: 'o4', title: 'IV Analysis', prompt: 'What is IV telling us?' },
  ]},
  { id: 'technical', name: 'Technical Analysis', description: 'Charts & indicators', icon: LineChart, color: 'text-blue-500', promptCards: [
    { id: 't1', title: 'Chart Patterns', prompt: 'Identify chart patterns' },
    { id: 't2', title: 'RSI & MACD', prompt: 'RSI and MACD signals' },
    { id: 't3', title: 'Bullish Setups', prompt: 'Find bullish setups' },
    { id: 't4', title: 'Market Structure', prompt: 'Current market structure' },
  ]},
  { id: 'fundamental', name: 'Fundamental Analysis', description: 'Company analysis', icon: BarChart3, color: 'text-cyan-500', promptCards: [
    { id: 'fu1', title: 'Quarterly Results', prompt: 'Analyze quarterly results' },
    { id: 'fu2', title: 'PE Comparison', prompt: 'Compare PE ratios' },
    { id: 'fu3', title: 'Intrinsic Value', prompt: 'Calculate intrinsic value' },
    { id: 'fu4', title: 'Undervalued', prompt: 'Find undervalued stocks' },
  ]},
  { id: 'news', name: 'News & Sentiment', description: 'Market news', icon: Newspaper, color: 'text-yellow-500', promptCards: [
    { id: 'n1', title: 'Market Movers', prompt: 'What is moving the market?' },
    { id: 'n2', title: 'Sector News', prompt: 'News affecting banking sector' },
    { id: 'n3', title: 'Sentiment', prompt: 'Social sentiment on stocks' },
    { id: 'n4', title: 'Breaking News', prompt: 'Breaking market news' },
  ]},
  { id: 'risk', name: 'Risk Management', description: 'Position sizing', icon: Shield, color: 'text-red-500', promptCards: [
    { id: 'r1', title: 'Position Size', prompt: 'Calculate position size for 2% risk' },
    { id: 'r2', title: 'Portfolio Risk', prompt: 'Analyze portfolio risk' },
    { id: 'r3', title: 'Stop Loss', prompt: 'Optimal stop-loss level' },
    { id: 'r4', title: 'Risk Plan', prompt: 'Risk management plan' },
  ]},
  { id: 'strategy', name: 'Strategy Builder', description: 'Create strategies', icon: Settings2, color: 'text-indigo-500', promptCards: [
    { id: 's1', title: 'Pine Script', prompt: 'Create Pine Script v6 EMA indicator' },
    { id: 's2', title: 'Mean Reversion', prompt: 'Design mean reversion strategy' },
    { id: 's3', title: 'Optimize', prompt: 'Optimize strategy parameters' },
    { id: 's4', title: 'Convert v6', prompt: 'Convert Pine Script to v6' },
  ]},
  { id: 'backtest', name: 'Backtest Analyst', description: 'Backtest results', icon: Zap, color: 'text-emerald-500', promptCards: [
    { id: 'b1', title: 'Explain Results', prompt: 'Explain backtest results' },
    { id: 'b2', title: 'Improve Sharpe', prompt: 'How to improve Sharpe ratio?' },
    { id: 'b3', title: 'Compare', prompt: 'Compare two strategies' },
    { id: 'b4', title: 'Reduce DD', prompt: 'Reduce maximum drawdown' },
  ]},
];

export default function AIChatPage() {
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [inputText, setInputText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [model, setModel] = useState<Model>(MODELS[0]);
  const [agent, setAgent] = useState<Agent>(AGENTS[0]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(false);
  const [artifact, setArtifact] = useState<Artifact | null>(null);
  const [leftWidth, setLeftWidth] = useState(280);
  const [rightWidth, setRightWidth] = useState(480);
  const [resizingLeft, setResizingLeft] = useState(false);
  const [resizingRight, setResizingRight] = useState(false);
  const [modelOpen, setModelOpen] = useState(false);
  const [agentOpen, setAgentOpen] = useState(false);
  const [menuId, setMenuId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);

  const endRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const editRef = useRef<HTMLInputElement>(null);

  const active = conversations.find(c => c.id === activeId);
  const AgentIcon = agent.icon;

  const onMouseMoveLeft = useCallback((e: MouseEvent) => { if (resizingLeft) setLeftWidth(Math.min(Math.max(200, e.clientX), 400)); }, [resizingLeft]);
  const onMouseMoveRight = useCallback((e: MouseEvent) => { if (resizingRight) setRightWidth(Math.min(Math.max(300, window.innerWidth - e.clientX), 700)); }, [resizingRight]);
  const onMouseUp = useCallback(() => { setResizingLeft(false); setResizingRight(false); document.body.style.cursor = ''; document.body.style.userSelect = ''; }, []);

  useEffect(() => {
    if (resizingLeft || resizingRight) {
      const handler = resizingLeft ? onMouseMoveLeft : onMouseMoveRight;
      document.addEventListener('mousemove', handler);
      document.addEventListener('mouseup', onMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      return () => { document.removeEventListener('mousemove', handler); document.removeEventListener('mouseup', onMouseUp); };
    }
  }, [resizingLeft, resizingRight, onMouseMoveLeft, onMouseMoveRight, onMouseUp]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [active?.messages, streamingContent]);
  useEffect(() => { if (textRef.current) { textRef.current.style.height = 'auto'; textRef.current.style.height = Math.min(textRef.current.scrollHeight, 150) + 'px'; } }, [inputText]);
  useEffect(() => { if (editId && editRef.current) { editRef.current.focus(); editRef.current.select(); } }, [editId]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.model-dropdown')) setModelOpen(false);
      if (!target.closest('.agent-dropdown')) setAgentOpen(false);
      if (!target.closest('.chat-menu')) setMenuId(null);
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  const newChat = () => { const c: Conversation = { id: Date.now().toString(), title: 'New Chat', messages: [], createdAt: new Date(), updatedAt: new Date(), agentId: agent.id }; setConversations(p => [c, ...p]); setActiveId(c.id); setInputText(''); };
  const deleteChat = (id: string) => { setConversations(p => p.filter(c => c.id !== id)); if (activeId === id) setActiveId(null); setMenuId(null); };
  const renameChat = (id: string) => { const c = conversations.find(x => x.id === id); if (c) { setEditId(id); setEditTitle(c.title); } setMenuId(null); };
  const saveRename = (id: string) => { if (editTitle.trim()) setConversations(p => p.map(c => c.id === id ? { ...c, title: editTitle.trim() } : c)); setEditId(null); };
  const togglePin = (id: string) => { setConversations(p => p.map(c => c.id === id ? { ...c, isPinned: !c.isPinned } : c)); setMenuId(null); };
  const duplicateChat = (id: string) => { const c = conversations.find(x => x.id === id); if (c) { const n = { ...c, id: Date.now().toString(), title: c.title + ' (Copy)', isPinned: false }; setConversations(p => [n, ...p]); setActiveId(n.id); } setMenuId(null); };
  const exportChat = (id: string) => { const c = conversations.find(x => x.id === id); if (c) { const t = c.messages.map(m => `${m.role}: ${m.content}`).join('\n\n'); const b = new Blob([t], { type: 'text/plain' }); const u = URL.createObjectURL(b); const a = document.createElement('a'); a.href = u; a.download = c.title + '.txt'; a.click(); URL.revokeObjectURL(u); } setMenuId(null); };
  const sorted = [...conversations].sort((a, b) => { if (a.isPinned && !b.isPinned) return -1; if (!a.isPinned && b.isPinned) return 1; return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(); });


  const genArtifact = (q: string): Artifact | null => {
    const ql = q.toLowerCase();
    if (ql.includes('code') || ql.includes('pine') || ql.includes('script') || ql.includes('indicator')) {
      return { id: Date.now().toString(), type: 'code', title: 'Pine Script v6', language: 'pine', content: `//@version=6
indicator("EMA Crossover Strategy", overlay=true)
fastLen = input.int(9, "Fast EMA")
slowLen = input.int(21, "Slow EMA")
fastEMA = ta.ema(close, fastLen)
slowEMA = ta.ema(close, slowLen)
plot(fastEMA, "Fast", color.green, 2)
plot(slowEMA, "Slow", color.red, 2)
buySignal = ta.crossover(fastEMA, slowEMA)
sellSignal = ta.crossunder(fastEMA, slowEMA)
plotshape(buySignal, "Buy", shape.triangleup, location.belowbar, color.green)
plotshape(sellSignal, "Sell", shape.triangledown, location.abovebar, color.red)` };
    }
    if (ql.includes('analysis') || ql.includes('analyze') || ql.includes('eur') || ql.includes('btc') || ql.includes('nifty')) {
      return { id: Date.now().toString(), type: 'text', title: 'Market Analysis', content: `# Market Analysis Report\n\n## Summary\nCurrent conditions show mixed signals with bullish bias.\n\n## Technical Indicators\n| Indicator | Value | Signal |\n|-----------|-------|--------|\n| RSI (14) | 52.3 | Neutral |\n| MACD | +0.0012 | Bullish |\n| 50 EMA | Above | Bullish |\n\n## Key Levels\n- **Resistance:** 1.1050, 1.1100\n- **Support:** 1.0950, 1.0900\n\n## Trade Setup\n| Parameter | Value |\n|-----------|-------|\n| Entry | Long above 1.1000 |\n| Stop Loss | 1.0950 |\n| Take Profit | 1.1100 |\n| Risk:Reward | 1:2 |` };
    }
    if (ql.includes('trading') || ql.includes('strategy') || ql.includes('risk') || ql.includes('plan')) {
      return { id: Date.now().toString(), type: 'text', title: 'Trading Guide', content: `# Trading Guide\n\n## Risk Management Rules\n| Rule | Description |\n|------|-------------|\n| Max Risk | 1-2% per trade |\n| Stop Loss | Always required |\n| Position Size | Based on risk |\n\n## Trading Checklist\n- Identify trend direction\n- Find key support/resistance\n- Wait for confirmation\n- Calculate position size\n- Set stop loss\n- Define take profit` };
    }
    return null;
  };

  const getResponse = (msg: string): string => {
    const responses: Record<string, string[]> = {
      forex: [`**Forex Analysis**\n\nBased on "${msg.slice(0,25)}...":\n\n**EUR/USD:**\n- Trend: Bullish above 1.0950\n- Resistance: 1.1050\n- Support: 1.0900\n\n**Recommendation:** Long on pullback to 1.0980`],
      crypto: [`**Crypto Analysis**\n\n**BTC/USD:**\n- Price: $67,500\n- 24h: +2.3%\n- Trend: Bullish\n\n**Setup:**\n- Target: $72,000\n- Stop: $64,000`],
      options: [`**Options Analysis**\n\n**Chain Data:**\n- Max Pain: 24,500\n- PCR: 0.85\n- IV: 45%\n\n**Strategy:** Bull Call Spread`],
      technical: [`**Technical Report**\n\n**Pattern:** Ascending Triangle\n- Breakout: 1850\n- Target: 1920\n\n**Indicators:**\n- RSI: 58\n- MACD: Bullish`],
      default: [`Based on "${msg.slice(0,25)}...":\n\n**Key Points:**\n- Use proper risk management\n- Set stop-loss orders\n- Consider RSI and MACD\n\n**Tip:** Start small and scale in.`]
    };
    return (responses[agent.id] || responses.default)[0];
  };

  const send = async () => {
    if (!inputText.trim() || isStreaming) return;
    let cid = activeId;
    if (!cid) { const c: Conversation = { id: Date.now().toString(), title: inputText.slice(0,30), messages: [], createdAt: new Date(), updatedAt: new Date(), agentId: agent.id }; setConversations(p => [c, ...p]); cid = c.id; setActiveId(cid); }
    const um: Message = { id: Date.now().toString(), role: 'user', content: inputText, timestamp: new Date() };
    setConversations(p => p.map(c => c.id === cid ? { ...c, messages: [...c.messages, um], title: c.messages.length === 0 ? inputText.slice(0,30) : c.title, updatedAt: new Date() } : c));
    const saved = inputText;
    setInputText(''); setAttachments([]); setIsStreaming(true); setStreamingContent('');
    try {
      const art = genArtifact(saved);
      const text = getResponse(saved);
      for (let i = 0; i < text.length; i++) { await new Promise(r => setTimeout(r, 8)); setStreamingContent(text.slice(0, i + 1)); }
      const am: Message = { id: (Date.now() + 1).toString(), role: 'assistant', content: text, timestamp: new Date(), artifacts: art ? [art] : undefined };
      if (art) { setArtifact(art); setRightOpen(true); }
      setConversations(p => p.map(c => c.id === cid ? { ...c, messages: [...c.messages, am], updatedAt: new Date() } : c));
    } finally { setIsStreaming(false); setStreamingContent(''); }
  };

  const downloadPDF = () => { if (!artifact) return; const content = `${artifact.title}\n${'='.repeat(50)}\n\n${artifact.content}`; const blob = new Blob([content], { type: 'text/plain' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `${artifact.title}.txt`; a.click(); URL.revokeObjectURL(url); };
  const downloadExcel = () => { if (!artifact) return; const csvContent = artifact.content.replace(/\|/g, ',').replace(/-+/g, ''); const blob = new Blob([csvContent], { type: 'text/csv' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `${artifact.title}.csv`; a.click(); URL.revokeObjectURL(url); };
  const copyArtifact = () => { if (artifact) { navigator.clipboard.writeText(artifact.content); setCopiedId('artifact'); setTimeout(() => setCopiedId(null), 2000); } };
  const onKey = (e: React.KeyboardEvent) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } };
  const time = (d: Date) => { const diff = Date.now() - new Date(d).getTime(); const m = Math.floor(diff/60000); if (m < 1) return 'Now'; if (m < 60) return m + 'm'; const h = Math.floor(diff/3600000); if (h < 24) return h + 'h'; return Math.floor(diff/86400000) + 'd'; };
  const artIcon = (t: string) => { if (t === 'code') return <Code size={16}/>; if (t === 'table') return <Table size={16}/>; return <FileText size={16}/>; };

  const renderChatItem = (c: Conversation) => {
    const chatAgent = AGENTS.find(a => a.id === c.agentId) || AGENTS[0];
    const ChatAgentIcon = chatAgent.icon;
    return (
      <div key={c.id} className={`chat-menu group relative flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-all ${activeId === c.id ? 'bg-gray-800' : 'hover:bg-gray-800/50'}`} onClick={() => editId !== c.id && setActiveId(c.id)}>
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${activeId === c.id ? 'bg-primary-600/20' : 'bg-gray-800'}`}>
          <ChatAgentIcon size={14} className={chatAgent.color}/>
        </div>
        <div className="flex-1 min-w-0">
          {editId === c.id ? (
            <input ref={editRef} value={editTitle} onChange={e => setEditTitle(e.target.value)} onBlur={() => saveRename(c.id)} onKeyDown={e => { if (e.key === 'Enter') saveRename(c.id); if (e.key === 'Escape') setEditId(null); }} className="w-full bg-gray-700 text-white text-sm px-2 py-1 rounded outline-none focus:ring-1 focus:ring-primary-500" onClick={e => e.stopPropagation()}/>
          ) : (<><p className="text-sm text-gray-200 truncate">{c.title}</p><p className="text-xs text-gray-500">{time(c.updatedAt)}</p></>)}
        </div>
        {c.isPinned && <Pin size={12} className="text-primary-500 flex-shrink-0"/>}
        <div className="relative">
          <button onClick={e => { e.stopPropagation(); setMenuId(menuId === c.id ? null : c.id); }} className={`p-1.5 rounded-lg transition-all ${menuId === c.id ? 'bg-gray-700 text-white' : 'opacity-0 group-hover:opacity-100 text-gray-400 hover:text-white hover:bg-gray-700'}`}><MoreHorizontal size={14}/></button>
          {menuId === c.id && (
            <div className="absolute right-0 top-full mt-1 w-40 bg-gray-900 border border-gray-700 rounded-lg shadow-xl z-50 py-1">
              <button onClick={e => { e.stopPropagation(); renameChat(c.id); }} className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-gray-800 flex items-center gap-2"><Edit3 size={14}/> Rename</button>
              <button onClick={e => { e.stopPropagation(); togglePin(c.id); }} className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-gray-800 flex items-center gap-2"><Pin size={14}/> {c.isPinned ? 'Unpin' : 'Pin'}</button>
              <button onClick={e => { e.stopPropagation(); duplicateChat(c.id); }} className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-gray-800 flex items-center gap-2"><Copy size={14}/> Duplicate</button>
              <button onClick={e => { e.stopPropagation(); exportChat(c.id); }} className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-gray-800 flex items-center gap-2"><Download size={14}/> Export</button>
              <div className="border-t border-gray-700 my-1"/>
              <button onClick={e => { e.stopPropagation(); deleteChat(c.id); }} className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-gray-800 flex items-center gap-2"><Trash2 size={14}/> Delete</button>
            </div>
          )}
        </div>
      </div>
    );
  };


  return (
    <div className="flex h-[calc(100vh-2rem)] bg-black overflow-hidden">
      {/* Left Sidebar */}
      <div style={{ width: leftOpen ? leftWidth : 0 }} className="border-r border-gray-800 flex flex-col bg-gray-950 transition-all duration-300 overflow-hidden relative">
        <div style={{ minWidth: leftWidth }} className="h-full flex flex-col">
          <div className="p-3 border-b border-gray-800">
            <button onClick={newChat} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-all font-medium">
              <Plus size={18}/><span>New Chat</span>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {sorted.length === 0 ? <div className="p-4 text-center text-gray-500 text-sm">No conversations</div> : (
              <>
                {sorted.some(c => c.isPinned) && <div className="px-2 py-1 text-xs text-gray-500">Pinned</div>}
                {sorted.filter(c => c.isPinned).map(renderChatItem)}
                {sorted.some(c => !c.isPinned) && <div className="px-2 py-1 text-xs text-gray-500 mt-2">Recent</div>}
                {sorted.filter(c => !c.isPinned).map(renderChatItem)}
              </>
            )}
          </div>
          <div className="p-3 border-t border-gray-800">
            <div className="text-xs text-gray-500 mb-1">Model</div>
            <div className="text-sm text-primary-500 font-medium">{model.name}</div>
          </div>
        </div>
        {leftOpen && <div className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary-600/50" onMouseDown={() => setResizingLeft(true)}/>}
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="h-14 border-b border-gray-800 flex items-center justify-between px-4 bg-gray-950/50">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/dashboard')} className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg" title="Back"><ArrowLeft size={20}/></button>
            <div className="h-6 w-px bg-gray-700"/>
            <button onClick={() => setLeftOpen(!leftOpen)} className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg">{leftOpen ? <PanelLeftClose size={20}/> : <PanelLeftOpen size={20}/>}</button>
            
            {/* Model Dropdown */}
            <div className="relative model-dropdown">
              <button onClick={(e) => { e.stopPropagation(); setModelOpen(!modelOpen); setAgentOpen(false); }} className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-full text-sm text-gray-300">
                <span>{model.name}</span><ChevronDown size={14} className={`transition-transform ${modelOpen ? 'rotate-180' : ''}`}/>
              </button>
              {modelOpen && (
                <div className="absolute left-0 top-full mt-2 w-56 bg-gray-900 border border-gray-700 rounded-lg shadow-xl z-50">
                  {MODELS.map(m => (
                    <button key={m.id} onClick={() => { setModel(m); setModelOpen(false); }} className={`w-full px-4 py-3 text-left hover:bg-gray-800 first:rounded-t-lg last:rounded-b-lg ${model.id === m.id ? 'bg-gray-800' : ''}`}>
                      <div className="flex items-center justify-between"><span className="text-sm font-medium text-white">{m.name}</span>{model.id === m.id && <Check size={14} className="text-primary-500"/>}</div>
                      <p className="text-xs text-gray-500">{m.provider}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="h-6 w-px bg-gray-700"/>
            {/* Agent Dropdown */}
            <div className="relative agent-dropdown">
              <button onClick={(e) => { e.stopPropagation(); setAgentOpen(!agentOpen); setModelOpen(false); }} className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-full text-sm">
                <AgentIcon size={16} className={agent.color}/><span className="text-gray-300">{agent.name}</span><ChevronDown size={14} className={`text-gray-400 transition-transform ${agentOpen ? 'rotate-180' : ''}`}/>
              </button>
              {agentOpen && (
                <div className="absolute left-0 top-full mt-2 w-72 bg-gray-900 border border-gray-700 rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto">
                  <div className="p-2 border-b border-gray-700"><p className="text-xs text-gray-500 px-2">Select Agent</p></div>
                  {AGENTS.map(a => { const Icon = a.icon; return (
                    <button key={a.id} onClick={() => { setAgent(a); setAgentOpen(false); }} className={`w-full px-4 py-3 text-left hover:bg-gray-800 flex items-center gap-3 ${agent.id === a.id ? 'bg-gray-800' : ''}`}>
                      <div className="w-8 h-8 rounded-lg bg-gray-700 flex items-center justify-center"><Icon size={18} className={a.color}/></div>
                      <div className="flex-1"><div className="flex items-center justify-between"><span className="text-sm font-medium text-white">{a.name}</span>{agent.id === a.id && <Check size={14} className="text-primary-500"/>}</div><p className="text-xs text-gray-500">{a.description}</p></div>
                    </button>
                  ); })}
                </div>
              )}
            </div>
            <span className="px-2 py-0.5 text-xs bg-primary-600/20 text-primary-400 rounded-full">Online</span>
          </div>
          <button onClick={() => setRightOpen(!rightOpen)} className={`p-2 rounded-lg ${rightOpen ? 'text-primary-400 bg-primary-600/20' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}>{rightOpen ? <PanelRightClose size={20}/> : <PanelRightOpen size={20}/>}</button>
        </div>


        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto">
          {!active || active.messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center p-8">
              <div className="w-20 h-20 rounded-2xl bg-gray-800 flex items-center justify-center mb-6"><AgentIcon size={40} className={agent.color}/></div>
              <h2 className="text-2xl font-semibold text-white mb-2">{agent.name}</h2>
              <p className="text-gray-400 text-center max-w-md mb-8">{agent.description}. Ask me anything.</p>
              <div className="grid grid-cols-2 gap-3 max-w-2xl w-full">
                {agent.promptCards.map(card => (
                  <button key={card.id} onClick={() => { setInputText(card.prompt); textRef.current?.focus(); }} className="group px-4 py-3 text-left bg-gray-800/50 hover:bg-gray-800 border border-gray-700 hover:border-primary-600/50 rounded-xl transition-all">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gray-700 group-hover:bg-primary-600/20 flex items-center justify-center"><Sparkles size={14} className="text-gray-400 group-hover:text-primary-400"/></div>
                      <div><p className="text-gray-200 font-medium group-hover:text-white">{card.title}</p><p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{card.prompt}</p></div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto p-4 space-y-4">
              {active.messages.map(m => (
                <div key={m.id} className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${m.role === 'user' ? 'bg-primary-600' : 'bg-gray-700'}`}>
                    {m.role === 'user' ? <User size={16} className="text-white"/> : <AgentIcon size={16} className={agent.color}/>}
                  </div>
                  <div className={`flex-1 max-w-[80%] ${m.role === 'user' ? 'text-right' : ''}`}>
                    <div className={`inline-block px-4 py-3 rounded-2xl ${m.role === 'user' ? 'bg-primary-600 text-white' : 'bg-gray-800 text-gray-200'}`}>
                      <div className="text-sm whitespace-pre-wrap">{m.content}</div>
                    </div>
                    {m.artifacts?.map(a => (
                      <button key={a.id} onClick={() => { setArtifact(a); setRightOpen(true); }} className="mt-2 flex items-center gap-2 px-3 py-2 bg-gray-800/50 hover:bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-300">
                        {artIcon(a.type)}<span>{a.title}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              {isStreaming && streamingContent && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center"><AgentIcon size={16} className={agent.color}/></div>
                  <div className="inline-block px-4 py-3 rounded-2xl bg-gray-800 text-gray-200 text-sm whitespace-pre-wrap">{streamingContent}<span className="inline-block w-0.5 h-4 bg-primary-500 ml-1 animate-pulse"/></div>
                </div>
              )}
              <div ref={endRef}/>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="border-t border-gray-800 p-4 bg-gray-950/50">
          <div className="max-w-3xl mx-auto">
            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {attachments.map((f, i) => (
                  <div key={i} className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 rounded-lg text-sm">
                    <Paperclip size={14} className="text-gray-400"/><span className="text-gray-300 max-w-[150px] truncate">{f.name}</span>
                    <button onClick={() => setAttachments(p => p.filter((_, x) => x !== i))} className="text-gray-500 hover:text-red-400"><X size={14}/></button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex items-end gap-3 bg-gray-900 border border-gray-700 rounded-xl p-3 focus-within:border-primary-600/50">
              <button onClick={() => fileRef.current?.click()} className="p-2 text-gray-400 hover:text-gray-200 hover:bg-gray-800 rounded-lg"><Paperclip size={20}/></button>
              <input ref={fileRef} type="file" multiple className="hidden" onChange={e => setAttachments(p => [...p, ...Array.from(e.target.files || [])])}/>
              <textarea ref={textRef} value={inputText} onChange={e => setInputText(e.target.value)} onKeyDown={onKey} placeholder={`Ask ${agent.name}...`} rows={1} className="flex-1 bg-transparent text-white placeholder-gray-500 resize-none outline-none text-sm py-2 max-h-[150px]" disabled={isStreaming}/>
              {isStreaming ? (
                <button onClick={() => setIsStreaming(false)} className="p-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg"><Square size={18}/></button>
              ) : (
                <button onClick={send} disabled={!inputText.trim()} className={`p-2.5 rounded-lg ${inputText.trim() ? 'bg-primary-600 hover:bg-primary-700 text-white' : 'bg-gray-800 text-gray-500 cursor-not-allowed'}`}><Send size={18}/></button>
              )}
            </div>
            {active && active.messages.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {agent.promptCards.slice(0, 4).map(card => (
                  <button key={card.id} onClick={() => { setInputText(card.prompt); textRef.current?.focus(); }} className="px-3 py-1.5 text-xs bg-gray-800/50 hover:bg-gray-800 border border-gray-700 hover:border-primary-600/50 rounded-full text-gray-400 hover:text-gray-200">{card.title}</button>
                ))}
              </div>
            )}
            <p className="text-xs text-gray-600 text-center mt-3">AI can make mistakes. Verify important decisions.</p>
          </div>
        </div>
      </div>


      {/* Right Panel - Artifacts */}
      <div style={{ width: rightOpen ? rightWidth : 0 }} className="border-l border-gray-800 flex flex-col bg-gray-950 transition-all duration-300 overflow-hidden relative">
        <div style={{ minWidth: rightWidth }} className="h-full flex flex-col">
          <div className="h-14 border-b border-gray-800 flex items-center justify-between px-4">
            <div className="flex items-center gap-3">{artifact && artIcon(artifact.type)}<span className="font-medium text-white">{artifact?.title || 'Artifacts'}</span></div>
            <div className="flex items-center gap-1">
              {artifact && (
                <>
                  <button onClick={downloadPDF} className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg" title="Download PDF"><FileDown size={16}/></button>
                  <button onClick={downloadExcel} className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg" title="Download CSV"><FileSpreadsheet size={16}/></button>
                  <button onClick={copyArtifact} className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg" title="Copy">{copiedId === 'artifact' ? <Check size={16} className="text-green-500"/> : <Copy size={16}/>}</button>
                </>
              )}
              <button onClick={() => setRightOpen(false)} className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg"><X size={16}/></button>
            </div>
          </div>
          <div className="flex-1 overflow-auto p-4">
            {artifact ? (
              artifact.type === 'code' ? (
                <div className="bg-gray-900 rounded-lg overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-2 bg-gray-800/50 border-b border-gray-700">
                    <span className="text-xs text-gray-400">{artifact.language || 'code'}</span>
                    <button onClick={copyArtifact} className="text-xs text-gray-400 hover:text-white">Copy</button>
                  </div>
                  <pre className="p-4 text-sm text-green-400 overflow-x-auto font-mono"><code>{artifact.content}</code></pre>
                </div>
              ) : (
                <div className="prose prose-invert prose-sm max-w-none">
                  <div className="bg-gray-900 rounded-lg p-6">
                    <div className="text-gray-200 whitespace-pre-wrap font-mono text-sm leading-relaxed">
                      {artifact.content.split('\n').map((line, i) => {
                        if (line.startsWith('# ')) return <h1 key={i} className="text-xl font-bold text-white mb-4 mt-2">{line.slice(2)}</h1>;
                        if (line.startsWith('## ')) return <h2 key={i} className="text-lg font-semibold text-primary-400 mb-3 mt-4">{line.slice(3)}</h2>;
                        if (line.startsWith('| ')) return <div key={i} className="font-mono text-xs bg-gray-800 px-2 py-1 border-b border-gray-700">{line}</div>;
                        if (line.startsWith('- ')) return <div key={i} className="flex items-start gap-2 ml-2"><span className="text-primary-500">•</span><span>{line.slice(2)}</span></div>;
                        if (line.match(/^\d+\./)) return <div key={i} className="ml-2">{line}</div>;
                        if (line.includes('**')) return <div key={i} className="my-1" dangerouslySetInnerHTML={{__html: line.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>')}}/>;
                        return <div key={i} className="my-1">{line}</div>;
                      })}
                    </div>
                  </div>
                </div>
              )
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-500">
                <Sparkles size={48} className="mb-4 opacity-50"/><p className="text-sm">No artifact selected</p><p className="text-xs text-gray-600 mt-1">Artifacts appear here when generated</p>
              </div>
            )}
          </div>
        </div>
        {rightOpen && <div className="absolute left-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary-600/50" onMouseDown={() => setResizingRight(true)}/>}
      </div>
    </div>
  );
}
