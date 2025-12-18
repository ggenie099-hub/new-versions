'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  MiniMap,
  Panel,
  Handle,
  Position,
} from 'reactflow';
import 'reactflow/dist/style.css';
import {
  ArrowLeft, Save, Play, Plus, Trash2,
  Zap, Database, LineChart, Split, Shield,
  ShoppingCart, Bell, Newspaper, Brain, Search,
  Settings, Clock, Monitor, ChevronRight, HelpCircle,
  LayoutTemplate, CheckCircle2, AlertCircle, Loader2
} from 'lucide-react';

interface NodeData {
  label: string;
  type: string;
  config: any;
  category?: string;
}

const CATEGORY_STYLES: Record<string, { color: string, icon: any }> = {
  triggers: { color: 'bg-purple-600', icon: Zap },
  market_data: { color: 'bg-blue-600', icon: Database },
  indicators: { color: 'bg-indigo-600', icon: LineChart },
  conditions: { color: 'bg-orange-600', icon: Split },
  risk_management: { color: 'bg-red-600', icon: Shield },
  orders: { color: 'bg-green-600', icon: ShoppingCart },
  notifications: { color: 'bg-yellow-600', icon: Bell },
  news: { color: 'bg-cyan-600', icon: Newspaper },
  memory: { color: 'bg-pink-600', icon: Brain },
  default: { color: 'bg-gray-600', icon: Settings },
};

const CustomNode = ({ id, data, selected }: { id: string, data: NodeData, selected: boolean }) => {
  const category = data.category || 'default';
  const style = CATEGORY_STYLES[category] || CATEGORY_STYLES.default;
  const Icon = style.icon;

  const onAction = (action: string) => {
    const event = new CustomEvent('nodeAction', { detail: { id, action } });
    window.dispatchEvent(event);
  };

  return (
    <div className={`group relative min-w-[240px] bg-[#0d0d12] border-2 rounded-2xl overflow-hidden transition-all duration-300 shadow-2xl ${selected ? 'border-blue-500 ring-4 ring-blue-500/10 scale-[1.02]' : 'border-gray-800/80 hover:border-gray-700'}`}>
      <div className={`h-1.5 w-full ${style.color}`} />
      <div className="flex items-center p-4 gap-4 relative">
        <div className={`flex-shrink-0 p-3 rounded-2xl ${style.color} bg-opacity-20`}>
          <Icon size={20} className={style.color.replace('bg-', 'text-')} />
        </div>
        <div className="flex-1 min-w-0 pr-10">
          <h4 className="text-sm font-bold text-gray-100 truncate uppercase tracking-tight">{data.label}</h4>
          <p className="text-[9px] text-gray-500 font-mono mt-1 opacity-60 uppercase">{data.type}</p>
        </div>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
          <button type="button" onClick={(e) => { e.stopPropagation(); onAction('settings'); }} className="p-2 hover:bg-gray-800 rounded-xl text-gray-400 hover:text-white"><Settings size={15} /></button>
          <button type="button" onClick={(e) => { e.stopPropagation(); onAction('delete'); }} className="p-2 hover:bg-red-900/20 rounded-xl text-gray-400 hover:text-red-500"><Trash2 size={15} /></button>
        </div>
      </div>
      <Handle type="target" position={Position.Left} className="!w-2.5 !h-2.5 !bg-gray-900 !border-2 !border-blue-500 !-left-[4px]" />
      <Handle type="source" position={Position.Right} className="!w-2.5 !h-2.5 !bg-gray-900 !border-2 !border-blue-500 !-right-[4px]" />
    </div>
  );
};

const nodeTypes = { custom: CustomNode };

export default function WorkflowBuilderPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const workflowId = searchParams.get('id');

  const [workflowName, setWorkflowName] = useState('My AI Strategy');
  const [workflowDescription, setWorkflowDescription] = useState('Build your automated trading logic here.');
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [availableNodes, setAvailableNodes] = useState<any>(null);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [mt5Status, setMt5Status] = useState<'connected' | 'disconnected' | 'checking'>('checking');

  useEffect(() => {
    const checkMT5 = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const res = await fetch('http://localhost:8000/api/mt5/accounts', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const accounts = await res.json();
          const connected = accounts.some((a: any) => a.is_connected);
          setMt5Status(connected ? 'connected' : 'disconnected');
        } else {
          setMt5Status('disconnected');
        }
      } catch (e) {
        setMt5Status('disconnected');
      }
    };

    const init = async () => {
      try {
        const typesRes = await fetch('http://localhost:8000/api/agentic/nodes/types');
        if (typesRes.ok) setAvailableNodes(await typesRes.json());

        if (workflowId) {
          const token = localStorage.getItem('access_token');
          const res = await fetch(`http://localhost:8000/api/agentic/workflows/${workflowId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            setWorkflowName(data.name);
            setWorkflowDescription(data.description);
            if (data.nodes) {
              setNodes(data.nodes.map((n: any) => ({
                id: n.id,
                type: 'custom',
                position: n.position || { x: 100, y: 100 },
                data: { label: n.type, type: n.type, config: n.data || {}, category: 'default' }
              })));
            }
            if (data.connections) {
              setEdges(data.connections.map((c: any) => ({
                id: `e${c.source}-${c.target}`,
                source: c.source,
                target: c.target,
                animated: true
              })));
            }
          }
        }
      } finally { setLoading(false); }
    };
    init();
    checkMT5();
  }, [workflowId, setNodes, setEdges]);

  useEffect(() => {
    const handleAction = (e: any) => {
      const { id, action } = e.detail;
      if (action === 'delete') {
        setNodes((nds) => nds.filter((n) => n.id !== id));
        setEdges((eds) => eds.filter((edge) => edge.source !== id && edge.target !== id));
        setSelectedNode(null);
      } else if (action === 'settings') {
        const node = nodes.find(n => n.id === id);
        if (node) setSelectedNode(node);
      }
    };
    window.addEventListener('nodeAction', handleAction);
    return () => window.removeEventListener('nodeAction', handleAction);
  }, [nodes, setNodes, setEdges]);

  const onConnect = useCallback((p: Connection) => setEdges((eds) => addEdge({ ...p, animated: true }, eds)), [setEdges]);
  const onDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }, []);
  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const type = e.dataTransfer.getData('application/reactflow');
    if (!type) return;
    const bounds = e.currentTarget.getBoundingClientRect();
    const newNode: Node = {
      id: `node-${Date.now()}`,
      type: 'custom',
      position: { x: e.clientX - bounds.left - 100, y: e.clientY - bounds.top - 20 },
      data: { label: e.dataTransfer.getData('nodeName') || type, type: type, config: {}, category: e.dataTransfer.getData('category') || 'default' }
    };
    setNodes((nds) => nds.concat(newNode));
  }, [setNodes]);

  const loadExample = () => {
    const exampleNodes: Node[] = [
      { id: 'e1', type: 'custom', position: { x: 100, y: 200 }, data: { label: 'Manual Trigger', type: 'ManualTrigger', config: {}, category: 'triggers' } },
      { id: 'e2', type: 'custom', position: { x: 400, y: 200 }, data: { label: 'RSI Check', type: 'RSI', config: { period: '14', oversold: '30' }, category: 'indicators' } },
      { id: 'e3', type: 'custom', position: { x: 700, y: 200 }, data: { label: 'Position Sizer', type: 'PositionSizer', config: { risk: '1%' }, category: 'risk_management' } },
      { id: 'e4', type: 'custom', position: { x: 1000, y: 200 }, data: { label: 'Market Order', type: 'MarketOrder', config: { symbol: 'EURUSD', order_type: 'BUY', volume: '0.01' }, category: 'orders' } },
    ];
    const exampleEdges: Edge[] = [
      { id: 'ee1-2', source: 'e1', target: 'e2', animated: true },
      { id: 'ee2-3', source: 'e2', target: 'e3', animated: true },
      { id: 'ee3-4', source: 'e3', target: 'e4', animated: true },
    ];
    setWorkflowName("Scalp Hunter Bot");
    setWorkflowDescription("A professional 4-node entry sequence.");
    setNodes(exampleNodes);
    setEdges(exampleEdges);
    setShowTemplates(false);
  };

  const saveWF = async (silent = false) => {
    try {
      const token = localStorage.getItem('access_token');
      const wf = {
        name: workflowName,
        description: workflowDescription,
        nodes: nodes.map(n => ({ id: n.id, type: n.data.type, data: n.data.config, position: n.position })),
        connections: edges.map(e => ({ source: e.source, target: e.target })),
        trigger_type: 'manual'
      };
      const r = await fetch(workflowId ? `http://localhost:8000/api/agentic/workflows/${workflowId}` : 'http://localhost:8000/api/agentic/workflows', {
        method: workflowId ? 'PUT' : 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(wf)
      });
      if (r.ok) {
        if (!silent) alert('Successfully Saved! 🚀');
        const data = await r.json();
        return data.id || workflowId;
      }
    } catch (err) { console.error(err); }
    return null;
  };

  const executeWF = async () => {
    if (mt5Status !== 'connected') {
      alert('MT5 Terminal is not connected! Please connect your account first.');
      return;
    }

    setExecuting(true);
    try {
      const currentWfId = await saveWF(true);
      if (!currentWfId) throw new Error('Failed to save workflow before execution');

      const token = localStorage.getItem('access_token');
      const r = await fetch(`http://localhost:8000/api/agentic/executions/workflows/${currentWfId}/execute`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ test_mode: false })
      });

      const resData = await r.json();
      if (r.ok) {
        alert('Workflow Executed Successfully! Check your MT5 terminal. 📈');
      } else {
        alert(`Execution Failed: ${resData.detail || 'Unknown error'}`);
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setExecuting(false);
    }
  };

  if (loading) return <div className="h-screen bg-black flex items-center justify-center text-white font-black tracking-tighter text-xl">BOOTING ENGINE...</div>;

  return (
    <div className="h-screen bg-[#050507] text-white flex flex-col font-sans overflow-hidden">
      <header className="bg-gray-900 border-b border-gray-800 p-4 flex items-center justify-between z-50 shadow-2xl shrink-0">
        <div className="flex items-center gap-6">
          <button onClick={() => router.push('/dashboard/agentic')} className="p-3 bg-gray-800/50 hover:bg-gray-800 rounded-2xl transition-all active:scale-90"><ArrowLeft size={20} /></button>
          <div>
            <input type="text" value={workflowName} onChange={(e) => setWorkflowName(e.target.value)} className="text-xl font-black bg-transparent border-none outline-none w-80 text-blue-400" />
            <div className="flex items-center gap-3 mt-1">
              <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-widest flex items-center gap-1 ${mt5Status === 'connected' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                {mt5Status === 'connected' ? <CheckCircle2 size={10} /> : <AlertCircle size={10} />}
                MT5: {mt5Status.toUpperCase()}
              </span>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Neural Trading Architecture</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <button onClick={() => setShowTemplates(!showTemplates)} className="flex items-center gap-2 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 px-5 py-2.5 rounded-2xl border border-indigo-500/20 font-bold transition-all">
              <LayoutTemplate size={18} /> Templates
            </button>
            {showTemplates && (
              <div className="absolute top-full right-0 mt-3 w-72 bg-gray-900 border border-gray-800 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden z-[100]">
                <button onClick={loadExample} className="w-full p-6 text-left hover:bg-gray-800 transition-all border-b border-gray-800 group">
                  <p className="font-black text-sm group-hover:text-blue-400">Scalp Hunter (4-Nodes)</p>
                  <p className="text-[10px] text-gray-500 mt-1">Multi-stage entry with risk management.</p>
                </button>
              </div>
            )}
          </div>
          <button onClick={() => setShowGuide(true)} className="flex items-center gap-2 bg-gray-800/50 hover:bg-gray-800 text-gray-300 px-5 py-2.5 rounded-2xl border border-gray-700 transition-all font-bold"><HelpCircle size={18} /> Guide</button>
          <button onClick={() => saveWF()} className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white px-6 py-2.5 rounded-2xl font-bold transition-all active:scale-95"><Save size={18} /> Save</button>
          <button
            onClick={executeWF}
            disabled={executing}
            className={`flex items-center gap-2 px-8 py-2.5 rounded-2xl font-black shadow-lg transition-all active:scale-95 ${executing ? 'bg-gray-700 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 shadow-green-500/20'}`}
          >
            {executing ? <Loader2 size={18} className="animate-spin" /> : <Play size={18} />}
            {executing ? 'Executing...' : 'Run Live'}
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className={`bg-gray-900/40 border-r border-gray-800 flex flex-col transition-all duration-300 ${sidebarCollapsed ? 'w-20' : 'w-80'} shrink-0 relative z-40`}>
          <div className="p-6 border-b border-gray-800 flex items-center justify-between">
            {!sidebarCollapsed && <span className="font-black text-[10px] text-gray-500 tracking-[0.2em]">NODE MODULES</span>}
            <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="p-2 bg-gray-800/50 hover:bg-gray-700 rounded-xl transition-all"><ChevronRight size={18} className={sidebarCollapsed ? '' : 'rotate-180'} /></button>
          </div>
          <div className="flex-1 overflow-y-auto p-5 space-y-8">
            {availableNodes && Object.entries(availableNodes.categories).map(([k, c]: [string, any]) => (
              <div key={k}>
                {!sidebarCollapsed && <h4 className="text-[10px] text-gray-600 font-black mb-3 border-l-2 border-gray-800 pl-2">{c.name}</h4>}
                <div className="space-y-2">
                  {c.nodes.map((n: any) => (
                    <div key={n.type} draggable onDragStart={(e) => { e.dataTransfer.setData('application/reactflow', n.type); e.dataTransfer.setData('nodeName', n.name); e.dataTransfer.setData('category', k); }} className="flex items-center gap-3 p-3 bg-gray-900/60 border border-gray-800 rounded-2xl cursor-grab hover:border-blue-500/50 transition-all active:cursor-grabbing group">
                      <div className={`p-2 rounded-xl ${CATEGORY_STYLES[k]?.color || 'bg-gray-700'} bg-opacity-10`}>
                        {CATEGORY_STYLES[k] && React.createElement(CATEGORY_STYLES[k].icon, { size: 16, className: CATEGORY_STYLES[k].color.replace('bg-', 'text-') })}
                      </div>
                      {!sidebarCollapsed && <span className="text-xs font-bold text-gray-300 group-hover:text-white">{n.name}</span>}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </aside>

        <main className="flex-1 relative bg-black">
          <ReactFlow nodes={nodes} edges={edges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} onConnect={onConnect} onDrop={onDrop} onDragOver={onDragOver} onNodeClick={(_, n) => setSelectedNode(n)} onPaneClick={() => setSelectedNode(null)} nodeTypes={nodeTypes} fitView>
            <Background variant={'dots' as any} color="#1a1a1e" gap={24} size={1} />
            <Controls className="!bg-gray-900 !border-gray-800 !rounded-xl" />
          </ReactFlow>
        </main>

        {selectedNode && (
          <aside className="w-80 bg-gray-900 border-l border-gray-800 flex flex-col shadow-[-10px_0_40px_rgba(0,0,0,0.5)]">
            <div className="p-8 border-b border-gray-800 flex items-center justify-between">
              <h3 className="font-black flex items-center gap-3 uppercase text-xs tracking-widest"><Settings size={18} className="text-blue-500" /> Options</h3>
              <button onClick={() => setSelectedNode(null)} className="p-2 hover:bg-gray-800 rounded-xl transition-all"><Plus size={22} className="rotate-45 text-gray-500" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-8 space-y-8">
              <div className="space-y-4">
                <p className="text-[10px] font-black text-gray-600 tracking-[0.2em] uppercase">Control Layer</p>
                {Object.entries(selectedNode.data.config || {}).map(([key, val]: [string, any]) => (
                  <div key={key}>
                    <label className="text-xs text-gray-400 font-bold mb-2 block capitalize">{key.replace('_', ' ')}</label>
                    <input type="text" value={val} onChange={(e) => {
                      const nc = { ...selectedNode.data.config, [key]: e.target.value };
                      setNodes(nds => nds.map(n => n.id === selectedNode.id ? { ...n, data: { ...n.data, config: nc } } : n));
                    }} className="w-full bg-black border border-gray-800 rounded-2xl px-5 py-3 text-sm focus:border-blue-500 outline-none transition-all shadow-inner" />
                  </div>
                ))}
              </div>
            </div>
            <div className="p-8 border-t border-gray-800 bg-black/20 text-center">
              <button onClick={() => { setNodes(nds => nds.filter(n => n.id !== selectedNode.id)); setSelectedNode(null); }} className="w-full bg-red-600/10 text-red-500 border border-red-500/20 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all active:scale-95"><Trash2 size={16} className="inline mr-2" /> Dismantle Node</button>
            </div>
          </aside>
        )}
      </div>

      {showGuide && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl">
          <div className="bg-[#0b0b0d] border border-gray-800 rounded-[3rem] w-full max-w-4xl flex flex-col h-[75vh] shadow-[0_0_100px_rgba(37,99,235,0.1)]">
            <div className="p-10 border-b border-gray-800/50 flex items-center justify-between">
              <h2 className="text-3xl font-black flex items-center gap-4"><Brain size={40} className="text-blue-500" /> Building Guide</h2>
              <button onClick={() => setShowGuide(false)} className="p-3 hover:bg-gray-800 rounded-full transition-all group"><Plus size={40} className="rotate-45 text-gray-600 group-hover:text-white" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-12 space-y-12">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                <div className="space-y-6">
                  <div className="w-16 h-16 bg-purple-600/10 text-purple-400 rounded-3xl flex items-center justify-center text-3xl font-black border border-purple-500/20">01</div>
                  <h3 className="text-xl font-black uppercase text-white">Trigger</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">Start with a **Manual Trigger** to test. Later, use **Price Triggers** to monitor live levels 24/7.</p>
                </div>
                <div className="space-y-6">
                  <div className="w-16 h-16 bg-blue-600/10 text-blue-400 rounded-3xl flex items-center justify-center text-3xl font-black border border-blue-500/20">02</div>
                  <h3 className="text-xl font-black uppercase text-white">Analysis</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">Drag and connect **Indicators** (RSI, MACD). Ensure you connect the dots to create a logical sequence.</p>
                </div>
                <div className="space-y-6">
                  <div className="w-16 h-16 bg-green-600/10 text-green-400 rounded-3xl flex items-center justify-center text-3xl font-black border border-green-500/20">03</div>
                  <h3 className="text-xl font-black uppercase text-white">Execution</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">End with a **Market Order** node. Don't forget a **Position Sizer** node for high-quality risk control.</p>
                </div>
              </div>
            </div>
            <div className="p-10 border-t border-gray-800/50">
              <button onClick={() => { setShowGuide(false); loadExample(); }} className="w-full py-6 bg-blue-600 hover:bg-blue-700 text-white font-black text-xl rounded-[2.5rem] shadow-2xl transition-all active:scale-95">LOAD PRO TEMPLATE & START BUILDING</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
