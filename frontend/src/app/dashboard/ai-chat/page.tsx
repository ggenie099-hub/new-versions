'use client';

import { useState, useRef, useEffect, KeyboardEvent, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Send, Plus, Trash2, Bot, User, Copy, Check, Square, ChevronDown, Paperclip, X,
  PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen,
  Code, FileText, Image, Table, Sparkles, MoreHorizontal, Edit3, Pin, Download, GripVertical, ArrowLeft
} from 'lucide-react';

interface Message { id: string; role: 'user' | 'assistant'; content: string; timestamp: Date; artifacts?: Artifact[]; }
interface Artifact { id: string; type: 'code' | 'text' | 'image' | 'table' | 'chart'; title: string; content: string; language?: string; }
interface Conversation { id: string; title: string; messages: Message[]; createdAt: Date; updatedAt: Date; isPinned?: boolean; }
interface Model { id: string; name: string; description: string; }

const MODELS: Model[] = [
  { id: 'gpt-4', name: 'GPT-4', description: 'Most capable model' },
  { id: 'gpt-3.5', name: 'GPT-3.5', description: 'Fast and efficient' },
  { id: 'claude-3', name: 'Claude 3', description: 'Balanced performance' },
];

export default function AIChatPage() {
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [inputText, setInputText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [model, setModel] = useState<Model>(MODELS[0]);
  const [showModelPicker, setShowModelPicker] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(false);
  const [artifact, setArtifact] = useState<Artifact | null>(null);
  const [leftWidth, setLeftWidth] = useState(280);
  const [rightWidth, setRightWidth] = useState(480);
  const [resizingLeft, setResizingLeft] = useState(false);
  const [resizingRight, setResizingRight] = useState(false);
  const [menuId, setMenuId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  
  const endRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const editRef = useRef<HTMLInputElement>(null);

  const active = conversations.find(c => c.id === activeId);


  // Resize handlers
  const onMouseMoveLeft = useCallback((e: MouseEvent) => {
    if (resizingLeft) setLeftWidth(Math.min(Math.max(200, e.clientX), 400));
  }, [resizingLeft]);

  const onMouseMoveRight = useCallback((e: MouseEvent) => {
    if (resizingRight) setRightWidth(Math.min(Math.max(300, window.innerWidth - e.clientX), 700));
  }, [resizingRight]);

  const onMouseUp = useCallback(() => {
    setResizingLeft(false);
    setResizingRight(false);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }, []);

  useEffect(() => {
    if (resizingLeft || resizingRight) {
      const handler = resizingLeft ? onMouseMoveLeft : onMouseMoveRight;
      document.addEventListener('mousemove', handler);
      document.addEventListener('mouseup', onMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      return () => {
        document.removeEventListener('mousemove', handler);
        document.removeEventListener('mouseup', onMouseUp);
      };
    }
  }, [resizingLeft, resizingRight, onMouseMoveLeft, onMouseMoveRight, onMouseUp]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [active?.messages, streamingContent]);
  useEffect(() => { if (textRef.current) { textRef.current.style.height = 'auto'; textRef.current.style.height = Math.min(textRef.current.scrollHeight, 150) + 'px'; } }, [inputText]);
  useEffect(() => { if (editId && editRef.current) { editRef.current.focus(); editRef.current.select(); } }, [editId]);
  useEffect(() => { const h = () => { setMenuId(null); setShowModelPicker(false); }; document.addEventListener('click', h); return () => document.removeEventListener('click', h); }, []);

  const newChat = () => {
    const c: Conversation = { id: Date.now().toString(), title: 'New Chat', messages: [], createdAt: new Date(), updatedAt: new Date() };
    setConversations(p => [c, ...p]);
    setActiveId(c.id);
    setInputText('');
  };

  const deleteChat = (id: string) => {
    setConversations(p => p.filter(c => c.id !== id));
    if (activeId === id) setActiveId(conversations.filter(c => c.id !== id)[0]?.id || null);
    setMenuId(null);
  };

  const rename = (id: string) => { const c = conversations.find(x => x.id === id); if (c) { setEditId(id); setEditTitle(c.title); } setMenuId(null); };
  const saveRename = (id: string) => { if (editTitle.trim()) setConversations(p => p.map(c => c.id === id ? { ...c, title: editTitle.trim() } : c)); setEditId(null); };
  const togglePin = (id: string) => { setConversations(p => p.map(c => c.id === id ? { ...c, isPinned: !c.isPinned } : c)); setMenuId(null); };
  const duplicate = (id: string) => { const c = conversations.find(x => x.id === id); if (c) { const n = { ...c, id: Date.now().toString(), title: c.title + ' (Copy)', isPinned: false }; setConversations(p => [n, ...p]); setActiveId(n.id); } setMenuId(null); };
  const exportChat = (id: string) => { const c = conversations.find(x => x.id === id); if (c) { const t = c.messages.map(m => `${m.role}: ${m.content}`).join('\n\n'); const b = new Blob([t], { type: 'text/plain' }); const u = URL.createObjectURL(b); const a = document.createElement('a'); a.href = u; a.download = c.title + '.txt'; a.click(); URL.revokeObjectURL(u); } setMenuId(null); };

  const sorted = [...conversations].sort((a, b) => { if (a.isPinned && !b.isPinned) return -1; if (!a.isPinned && b.isPinned) return 1; return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(); });

  const genArtifact = (q: string): Artifact | null => {
    if (q.toLowerCase().includes('code')) return { id: Date.now().toString(), type: 'code', title: 'Generated Code', language: 'javascript', content: `// RSI Calculator\nfunction calculateRSI(prices, period = 14) {\n  const gains = [], losses = [];\n  for (let i = 1; i < prices.length; i++) {\n    const d = prices[i] - prices[i-1];\n    gains.push(d > 0 ? d : 0);\n    losses.push(d < 0 ? -d : 0);\n  }\n  const avgG = gains.slice(-period).reduce((a,b) => a+b, 0) / period;\n  const avgL = losses.slice(-period).reduce((a,b) => a+b, 0) / period;\n  return 100 - (100 / (1 + avgG/avgL));\n}\nconsole.log(calculateRSI([44, 44.5, 43.5, 44.2, 45]));` };
    if (q.toLowerCase().includes('analysis')) return { id: Date.now().toString(), type: 'text', title: 'Market Analysis', content: `# Market Analysis\n\n## Summary\nMixed signals with upward potential.\n\n## Indicators\n- RSI: 45.2 (Neutral)\n- MACD: Bullish crossover\n- MA: Price above 50 EMA\n\n## Recommendation\nLong above 1.1000, SL at 1.0950` };
    return null;
  };

  const stream = async (msg: string) => {
    const art = genArtifact(msg);
    const texts = [
      `Based on your query about "${msg.slice(0,25)}...":\n\n**Analysis**: Market conditions suggest careful sizing.\n**Risk**: Use stop-loss orders.\n**Tips**: Use RSI and MACD for entries.`,
      `For trading automation:\n\n- **Backtest** strategies on historical data\n- **Position Size**: Risk 1-2% per trade\n- **Diversify** across instruments`,
    ];
    return { text: texts[Math.floor(Math.random() * texts.length)], artifact: art };
  };


  const send = async () => {
    if (!inputText.trim() || isStreaming) return;
    let cid = activeId;
    if (!cid) { const c: Conversation = { id: Date.now().toString(), title: inputText.slice(0,30), messages: [], createdAt: new Date(), updatedAt: new Date() }; setConversations(p => [c, ...p]); cid = c.id; setActiveId(cid); }
    const um: Message = { id: Date.now().toString(), role: 'user', content: inputText, timestamp: new Date() };
    setConversations(p => p.map(c => c.id === cid ? { ...c, messages: [...c.messages, um], title: c.messages.length === 0 ? inputText.slice(0,30) : c.title, updatedAt: new Date() } : c));
    const saved = inputText;
    setInputText(''); setAttachments([]); setIsStreaming(true); setStreamingContent('');
    try {
      const { text, artifact: art } = await stream(saved);
      for (let i = 0; i < text.length; i++) { await new Promise(r => setTimeout(r, 12)); setStreamingContent(text.slice(0, i + 1)); }
      const am: Message = { id: (Date.now() + 1).toString(), role: 'assistant', content: text, timestamp: new Date(), artifacts: art ? [art] : undefined };
      if (art) { setArtifact(art); setRightOpen(true); }
      setConversations(p => p.map(c => c.id === cid ? { ...c, messages: [...c.messages, am], updatedAt: new Date() } : c));
    } finally { setIsStreaming(false); setStreamingContent(''); }
  };

  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } };
  const copy = (t: string, id: string) => { navigator.clipboard.writeText(t); setCopiedId(id); setTimeout(() => setCopiedId(null), 2000); };
  const copyArt = () => { if (artifact) navigator.clipboard.writeText(artifact.content); };
  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => setAttachments(p => [...p, ...Array.from(e.target.files || [])]);
  const rmFile = (i: number) => setAttachments(p => p.filter((_, x) => x !== i));
  const icon = (t: string) => { switch(t) { case 'code': return <Code size={16}/>; case 'text': return <FileText size={16}/>; case 'image': return <Image size={16}/>; case 'table': return <Table size={16}/>; default: return <Sparkles size={16}/>; } };
  const time = (d: Date) => { const diff = Date.now() - new Date(d).getTime(); const m = Math.floor(diff/60000); if (m < 1) return 'Now'; if (m < 60) return m + 'm'; const h = Math.floor(diff/3600000); if (h < 24) return h + 'h'; return Math.floor(diff/86400000) + 'd'; };

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
                {sorted.filter(c => c.isPinned).map(c => <ChatItem key={c.id} c={c} active={activeId===c.id} editing={editId===c.id} editTitle={editTitle} setEditTitle={setEditTitle} editRef={editRef} menuId={menuId} setMenuId={setMenuId} setActive={setActiveId} saveRename={saveRename} rename={rename} togglePin={togglePin} duplicate={duplicate} exportChat={exportChat} deleteChat={deleteChat} time={time}/>)}
                {sorted.some(c => !c.isPinned) && <div className="px-2 py-1 text-xs text-gray-500 mt-2">Recent</div>}
                {sorted.filter(c => !c.isPinned).map(c => <ChatItem key={c.id} c={c} active={activeId===c.id} editing={editId===c.id} editTitle={editTitle} setEditTitle={setEditTitle} editRef={editRef} menuId={menuId} setMenuId={setMenuId} setActive={setActiveId} saveRename={saveRename} rename={rename} togglePin={togglePin} duplicate={duplicate} exportChat={exportChat} deleteChat={deleteChat} time={time}/>)}
              </>
            )}
          </div>
          <div className="p-3 border-t border-gray-800 text-xs text-gray-500">Model: <span className="text-primary-500">{model.name}</span></div>
        </div>
        {leftOpen && <div className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary-600/50 transition-colors" onMouseDown={() => setResizingLeft(true)}><GripVertical size={12} className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-600 opacity-0 hover:opacity-100"/></div>}
      </div>


      {/* Main Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="h-14 border-b border-gray-800 flex items-center justify-between px-4 bg-gray-950/50">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/dashboard')} className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-all" title="Back to Dashboard">
              <ArrowLeft size={20}/>
            </button>
            <div className="h-6 w-px bg-gray-700"/>
            <button onClick={() => setLeftOpen(!leftOpen)} className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-all">
              {leftOpen ? <PanelLeftClose size={20}/> : <PanelLeftOpen size={20}/>}
            </button>
            <div className="relative">
              <button onClick={e => { e.stopPropagation(); setShowModelPicker(!showModelPicker); }} className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-full text-sm text-gray-300 transition-all">
                <span>{model.name}</span><ChevronDown size={14} className={`transition-transform ${showModelPicker ? 'rotate-180' : ''}`}/>
              </button>
              {showModelPicker && (
                <div className="absolute left-0 top-full mt-2 w-56 bg-gray-900 border border-gray-700 rounded-lg shadow-xl z-50" onClick={e => e.stopPropagation()}>
                  {MODELS.map(m => (
                    <button key={m.id} onClick={() => { setModel(m); setShowModelPicker(false); }} className={`w-full px-4 py-3 text-left hover:bg-gray-800 transition-colors ${model.id === m.id ? 'bg-gray-800' : ''}`}>
                      <div className="flex items-center justify-between"><span className="text-sm font-medium text-white">{m.name}</span>{model.id === m.id && <Check size={14} className="text-primary-500"/>}</div>
                      <p className="text-xs text-gray-500 mt-0.5">{m.description}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="h-6 w-px bg-gray-700"/>
            <Bot size={20} className="text-primary-500"/><span className="font-medium text-white">AI Assistant</span>
            <span className="px-2 py-0.5 text-xs bg-primary-600/20 text-primary-400 rounded-full">Online</span>
          </div>
          <button onClick={() => setRightOpen(!rightOpen)} className={`p-2 rounded-lg transition-all ${rightOpen ? 'text-primary-400 bg-primary-600/20' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}>
            {rightOpen ? <PanelRightClose size={20}/> : <PanelRightOpen size={20}/>}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {!active || active.messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center p-8">
              <div className="w-16 h-16 rounded-full bg-primary-600/20 flex items-center justify-center mb-6"><Bot size={32} className="text-primary-500"/></div>
              <h2 className="text-2xl font-semibold text-white mb-2">How can I help you today?</h2>
              <p className="text-gray-400 text-center max-w-md mb-8">Ask about trading strategies, market analysis, or automated workflows.</p>
              <div className="grid grid-cols-2 gap-3 max-w-lg w-full">
                {['Write code for RSI', 'Generate analysis report', 'Explain risk management', 'Review portfolio'].map((s, i) => (
                  <button key={i} onClick={() => setInputText(s)} className="px-4 py-3 text-left text-sm text-gray-300 bg-gray-800/50 hover:bg-gray-800 border border-gray-700 rounded-lg transition-all">{s}</button>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto p-4 space-y-4">
              {active.messages.map(m => (
                <div key={m.id} className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${m.role === 'user' ? 'bg-primary-600' : 'bg-gray-700'}`}>
                    {m.role === 'user' ? <User size={16} className="text-white"/> : <Bot size={16} className="text-primary-400"/>}
                  </div>
                  <div className={`flex-1 max-w-[80%] ${m.role === 'user' ? 'text-right' : ''}`}>
                    <div className={`inline-block px-4 py-3 rounded-2xl ${m.role === 'user' ? 'bg-primary-600 text-white' : 'bg-gray-800 text-gray-200'}`}>
                      <div className="text-sm whitespace-pre-wrap">{m.content}</div>
                    </div>
                    {m.artifacts?.map(a => (
                      <button key={a.id} onClick={() => { setArtifact(a); setRightOpen(true); }} className="mt-2 flex items-center gap-2 px-3 py-2 bg-gray-800/50 hover:bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-300 transition-all">
                        {icon(a.type)}<span>{a.title}</span>
                      </button>
                    ))}
                    {m.role === 'assistant' && <button onClick={() => copy(m.content, m.id)} className="mt-1 ml-1 p-1 text-gray-500 hover:text-gray-300">{copiedId === m.id ? <Check size={14}/> : <Copy size={14}/>}</button>}
                  </div>
                </div>
              ))}
              {isStreaming && streamingContent && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center"><Bot size={16} className="text-primary-400"/></div>
                  <div className="inline-block px-4 py-3 rounded-2xl bg-gray-800 text-gray-200 text-sm whitespace-pre-wrap">{streamingContent}<span className="inline-block w-0.5 h-4 bg-primary-500 ml-1 animate-pulse"/></div>
                </div>
              )}
              <div ref={endRef}/>
            </div>
          )}
        </div>

        <div className="border-t border-gray-800 p-4 bg-gray-950/50">
          <div className="max-w-3xl mx-auto">
            {attachments.length > 0 && <div className="flex flex-wrap gap-2 mb-3">{attachments.map((f, i) => <div key={i} className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 rounded-lg text-sm"><Paperclip size={14} className="text-gray-400"/><span className="text-gray-300 max-w-[150px] truncate">{f.name}</span><button onClick={() => rmFile(i)} className="text-gray-500 hover:text-red-400"><X size={14}/></button></div>)}</div>}
            <div className="flex items-end gap-3 bg-gray-900 border border-gray-700 rounded-xl p-3 focus-within:border-primary-600/50">
              <button onClick={() => fileRef.current?.click()} className="p-2 text-gray-400 hover:text-gray-200 hover:bg-gray-800 rounded-lg"><Paperclip size={20}/></button>
              <input ref={fileRef} type="file" multiple className="hidden" onChange={onFile}/>
              <textarea ref={textRef} value={inputText} onChange={e => setInputText(e.target.value)} onKeyDown={onKey} placeholder="Type your message..." rows={1} className="flex-1 bg-transparent text-white placeholder-gray-500 resize-none outline-none text-sm py-2 max-h-[150px]" disabled={isStreaming}/>
              {isStreaming ? <button onClick={() => setIsStreaming(false)} className="p-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg"><Square size={18}/></button>
                : <button onClick={send} disabled={!inputText.trim()} className={`p-2.5 rounded-lg transition-all ${inputText.trim() ? 'bg-primary-600 hover:bg-primary-700 text-white' : 'bg-gray-800 text-gray-500 cursor-not-allowed'}`}><Send size={18}/></button>}
            </div>
            <p className="text-xs text-gray-600 text-center mt-2">AI can make mistakes. Verify important info.</p>
          </div>
        </div>
      </div>


      {/* Right Panel */}
      <div style={{ width: rightOpen ? rightWidth : 0 }} className="border-l border-gray-800 flex flex-col bg-gray-950 transition-all duration-300 overflow-hidden relative">
        <div style={{ minWidth: rightWidth }} className="h-full flex flex-col">
          <div className="h-14 border-b border-gray-800 flex items-center justify-between px-4">
            <div className="flex items-center gap-3">{artifact && icon(artifact.type)}<span className="font-medium text-white">{artifact?.title || 'Artifacts'}</span></div>
            <div className="flex items-center gap-2">
              <button onClick={copyArt} className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg"><Copy size={16}/></button>
              <button onClick={() => setRightOpen(false)} className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg"><X size={16}/></button>
            </div>
          </div>
          <div className="flex-1 overflow-auto p-4">
            {artifact ? (
              artifact.type === 'code' ? (
                <div className="bg-gray-900 rounded-lg overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-2 bg-gray-800/50 border-b border-gray-700">
                    <span className="text-xs text-gray-400">{artifact.language}</span>
                    <button onClick={copyArt} className="text-xs text-gray-400 hover:text-white">Copy</button>
                  </div>
                  <pre className="p-4 text-sm text-gray-300 overflow-x-auto"><code>{artifact.content}</code></pre>
                </div>
              ) : <div className="text-gray-300 whitespace-pre-wrap">{artifact.content}</div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-500">
                <Sparkles size={48} className="mb-4 opacity-50"/><p className="text-sm">No artifact selected</p>
              </div>
            )}
          </div>
        </div>
        {rightOpen && <div className="absolute left-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary-600/50 transition-colors" onMouseDown={() => setResizingRight(true)}/>}
      </div>
    </div>
  );
}

// Chat Item Component
function ChatItem({ c, active, editing, editTitle, setEditTitle, editRef, menuId, setMenuId, setActive, saveRename, rename, togglePin, duplicate, exportChat, deleteChat, time }: {
  c: Conversation; active: boolean; editing: boolean; editTitle: string; setEditTitle: (s: string) => void; editRef: React.RefObject<HTMLInputElement>;
  menuId: string | null; setMenuId: (id: string | null) => void; setActive: (id: string) => void; saveRename: (id: string) => void;
  rename: (id: string) => void; togglePin: (id: string) => void; duplicate: (id: string) => void; exportChat: (id: string) => void; deleteChat: (id: string) => void; time: (d: Date) => string;
}) {
  return (
    <div className={`group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all ${active ? 'bg-primary-600/20 border border-primary-600/50' : 'hover:bg-gray-800/50 border border-transparent'}`} onClick={() => !editing && setActive(c.id)}>
      {c.isPinned && <Pin size={12} className="text-primary-500"/>}
      <Bot size={16} className="text-gray-400"/>
      {editing ? (
        <input ref={editRef} value={editTitle} onChange={e => setEditTitle(e.target.value)} onBlur={() => saveRename(c.id)} onKeyDown={e => { if (e.key === 'Enter' || e.key === 'Escape') saveRename(c.id); }} className="flex-1 bg-gray-800 text-sm text-white px-2 py-1 rounded outline-none border border-primary-600" onClick={e => e.stopPropagation()}/>
      ) : (
        <div className="flex-1 min-w-0"><span className="text-sm text-gray-300 truncate block">{c.title}</span><span className="text-xs text-gray-600">{time(c.updatedAt)}</span></div>
      )}
      <div className="relative">
        <button onClick={e => { e.stopPropagation(); setMenuId(menuId === c.id ? null : c.id); }} className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-700 rounded"><MoreHorizontal size={14} className="text-gray-400"/></button>
        {menuId === c.id && (
          <div className="absolute right-0 top-full mt-1 w-36 bg-gray-900 border border-gray-700 rounded-lg shadow-xl z-50" onClick={e => e.stopPropagation()}>
            <button onClick={() => rename(c.id)} className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-gray-800 flex items-center gap-2"><Edit3 size={14}/>Rename</button>
            <button onClick={() => togglePin(c.id)} className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-gray-800 flex items-center gap-2"><Pin size={14}/>{c.isPinned ? 'Unpin' : 'Pin'}</button>
            <button onClick={() => duplicate(c.id)} className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-gray-800 flex items-center gap-2"><Copy size={14}/>Duplicate</button>
            <button onClick={() => exportChat(c.id)} className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-gray-800 flex items-center gap-2"><Download size={14}/>Export</button>
            <div className="border-t border-gray-700"/>
            <button onClick={() => deleteChat(c.id)} className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-gray-800 flex items-center gap-2"><Trash2 size={14}/>Delete</button>
          </div>
        )}
      </div>
    </div>
  );
}
