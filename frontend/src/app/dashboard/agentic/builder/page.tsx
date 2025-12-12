'use client';

import { useState, useEffect, useCallback } from 'react';
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
} from 'reactflow';
import 'reactflow/dist/style.css';
import { ArrowLeft, Save, Play, Plus, Trash2 } from 'lucide-react';

interface NodeData {
  label: string;
  type: string;
  config: any;
}

export default function WorkflowBuilderPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const workflowId = searchParams.get('id');
  
  const [workflowName, setWorkflowName] = useState('New Workflow');
  const [workflowDescription, setWorkflowDescription] = useState('');
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [availableNodes, setAvailableNodes] = useState<any>(null);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    fetchAvailableNodes();
    if (workflowId) {
      fetchWorkflow(workflowId);
    } else {
      setLoading(false);
    }
  }, [workflowId]);

  const fetchAvailableNodes = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/agentic/nodes/types');
      if (response.ok) {
        const data = await response.json();
        setAvailableNodes(data);
      }
    } catch (error) {
      console.error('Failed to fetch available nodes:', error);
    }
  };

  const fetchWorkflow = async (id: string) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`http://localhost:8000/api/agentic/workflows/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setWorkflowName(data.name);
        setWorkflowDescription(data.description);
        
        // Convert to React Flow format
        if (data.nodes && data.nodes.length > 0) {
          const flowNodes = data.nodes.map((node: any) => ({
            id: node.id,
            type: 'default',
            position: node.position || { x: 100, y: 100 },
            data: { 
              label: node.type,
              type: node.type,
              config: node.data || {}
            },
            style: {
              background: '#1f2937',
              color: '#fff',
              border: '2px solid #3b82f6',
              borderRadius: '8px',
              padding: '10px',
              fontSize: '14px',
              width: 180,
            },
          }));
          setNodes(flowNodes);
        }
        
        if (data.connections && data.connections.length > 0) {
          const flowEdges = data.connections.map((conn: any, idx: number) => ({
            id: `e${conn.source}-${conn.target}`,
            source: conn.source,
            target: conn.target,
            animated: true
          }));
          setEdges(flowEdges);
        }
      }
    } catch (error) {
      console.error('Failed to fetch workflow:', error);
    } finally {
      setLoading(false);
    }
  };

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge({ ...params, animated: true }, eds)),
    [setEdges]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow');
      const nodeName = event.dataTransfer.getData('nodeName');

      if (typeof type === 'undefined' || !type) {
        return;
      }

      const reactFlowBounds = event.currentTarget.getBoundingClientRect();
      const position = {
        x: event.clientX - reactFlowBounds.left - 100,
        y: event.clientY - reactFlowBounds.top - 20,
      };

      const newNode: Node = {
        id: `node-${Date.now()}`,
        type: 'default',
        position,
        data: { 
          label: nodeName || type,
          type: type,
          config: {}
        },
        style: {
          background: '#1f2937',
          color: '#fff',
          border: '2px solid #3b82f6',
          borderRadius: '8px',
          padding: '10px',
          fontSize: '14px',
          width: 180,
        },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [setNodes]
  );

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  const updateNodeConfig = (nodeId: string, config: any) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          return {
            ...node,
            data: {
              ...node.data,
              config: config,
            },
          };
        }
        return node;
      })
    );
  };

  const deleteNode = (nodeId: string) => {
    setNodes((nds) => nds.filter((node) => node.id !== nodeId));
    setEdges((eds) => eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId));
    setSelectedNode(null);
  };

  const saveWorkflow = async () => {
    try {
      const token = localStorage.getItem('access_token');
      
      // Convert React Flow format to backend format
      const workflowNodes = nodes.map((node) => ({
        id: node.id,
        type: node.data.type,
        data: node.data.config,
        position: node.position
      }));

      const workflowConnections = edges.map((edge) => ({
        source: edge.source,
        target: edge.target
      }));

      const workflowData = {
        name: workflowName,
        description: workflowDescription,
        nodes: workflowNodes,
        connections: workflowConnections,
        settings: {},
        trigger_type: 'manual'
      };

      const url = workflowId 
        ? `http://localhost:8000/api/agentic/workflows/${workflowId}`
        : 'http://localhost:8000/api/agentic/workflows';
      
      const method = workflowId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method: method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(workflowData)
      });

      if (response.ok) {
        alert('Workflow saved successfully!');
        router.push('/dashboard/agentic');
      } else {
        alert('Failed to save workflow');
      }
    } catch (error) {
      console.error('Failed to save workflow:', error);
      alert('Error saving workflow');
    }
  };

  const onDragStart = (event: React.DragEvent, nodeType: string, nodeName: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.setData('nodeName', nodeName);
    event.dataTransfer.effectAllowed = 'move';
  };

  const loadTemplate = (templateName: string) => {
    const templates: any = {
      'rsi-strategy': {
        name: 'RSI Oversold Strategy',
        description: 'Buy when RSI is oversold, with position sizing and risk management',
        nodes: [
          {
            id: 'node-1',
            type: 'default',
            position: { x: 100, y: 100 },
            data: { label: 'Manual Trigger', type: 'ManualTrigger', config: {} },
            style: { background: '#1f2937', color: '#fff', border: '2px solid #3b82f6', borderRadius: '8px', padding: '10px', fontSize: '14px', width: 180 }
          },
          {
            id: 'node-2',
            type: 'default',
            position: { x: 350, y: 100 },
            data: { label: 'Get Live Price', type: 'GetLivePrice', config: { symbol: 'EURUSD' } },
            style: { background: '#1f2937', color: '#fff', border: '2px solid #3b82f6', borderRadius: '8px', padding: '10px', fontSize: '14px', width: 180 }
          },
          {
            id: 'node-3',
            type: 'default',
            position: { x: 600, y: 100 },
            data: { label: 'RSI', type: 'RSI', config: { period: 14, oversold: 30, overbought: 70 } },
            style: { background: '#1f2937', color: '#fff', border: '2px solid #3b82f6', borderRadius: '8px', padding: '10px', fontSize: '14px', width: 180 }
          },
          {
            id: 'node-4',
            type: 'default',
            position: { x: 350, y: 250 },
            data: { label: 'Position Sizer', type: 'PositionSizer', config: { risk_percentage: 1.0, symbol: 'EURUSD' } },
            style: { background: '#1f2937', color: '#fff', border: '2px solid #3b82f6', borderRadius: '8px', padding: '10px', fontSize: '14px', width: 180 }
          },
          {
            id: 'node-5',
            type: 'default',
            position: { x: 600, y: 250 },
            data: { label: 'Market Order', type: 'MarketOrder', config: { action: 'BUY', symbol: 'EURUSD', volume: 0.01 } },
            style: { background: '#1f2937', color: '#fff', border: '2px solid #3b82f6', borderRadius: '8px', padding: '10px', fontSize: '14px', width: 180 }
          }
        ],
        edges: [
          { id: 'e1-2', source: 'node-1', target: 'node-2', animated: true },
          { id: 'e2-3', source: 'node-2', target: 'node-3', animated: true },
          { id: 'e3-4', source: 'node-3', target: 'node-4', animated: true },
          { id: 'e4-5', source: 'node-4', target: 'node-5', animated: true }
        ]
      },
      'price-breakout': {
        name: 'Price Breakout Strategy',
        description: 'Trigger when price breaks above resistance level',
        nodes: [
          {
            id: 'node-1',
            type: 'default',
            position: { x: 100, y: 100 },
            data: { label: 'Price Trigger', type: 'PriceTrigger', config: { symbol: 'EURUSD', condition: 'price > 1.10', check_interval: 5 } },
            style: { background: '#1f2937', color: '#fff', border: '2px solid #3b82f6', borderRadius: '8px', padding: '10px', fontSize: '14px', width: 180 }
          },
          {
            id: 'node-2',
            type: 'default',
            position: { x: 350, y: 100 },
            data: { label: 'Risk/Reward Check', type: 'RiskRewardCalculator', config: { min_rr_ratio: 2.0 } },
            style: { background: '#1f2937', color: '#fff', border: '2px solid #3b82f6', borderRadius: '8px', padding: '10px', fontSize: '14px', width: 180 }
          },
          {
            id: 'node-3',
            type: 'default',
            position: { x: 600, y: 100 },
            data: { label: 'Market Order', type: 'MarketOrder', config: { action: 'BUY', symbol: 'EURUSD', volume: 0.01 } },
            style: { background: '#1f2937', color: '#fff', border: '2px solid #3b82f6', borderRadius: '8px', padding: '10px', fontSize: '14px', width: 180 }
          },
          {
            id: 'node-4',
            type: 'default',
            position: { x: 850, y: 100 },
            data: { label: 'Notification', type: 'DashboardNotification', config: { title: 'Trade Executed', message: 'Breakout trade placed', type: 'success' } },
            style: { background: '#1f2937', color: '#fff', border: '2px solid #3b82f6', borderRadius: '8px', padding: '10px', fontSize: '14px', width: 180 }
          }
        ],
        edges: [
          { id: 'e1-2', source: 'node-1', target: 'node-2', animated: true },
          { id: 'e2-3', source: 'node-2', target: 'node-3', animated: true },
          { id: 'e3-4', source: 'node-3', target: 'node-4', animated: true }
        ]
      },
      'daily-check': {
        name: 'Daily Risk Check',
        description: 'Check account status and risk limits every day at 9 AM',
        nodes: [
          {
            id: 'node-1',
            type: 'default',
            position: { x: 100, y: 100 },
            data: { label: 'Schedule Trigger', type: 'ScheduleTrigger', config: { cron_expression: '0 9 * * *', timezone: 'UTC' } },
            style: { background: '#1f2937', color: '#fff', border: '2px solid #3b82f6', borderRadius: '8px', padding: '10px', fontSize: '14px', width: 180 }
          },
          {
            id: 'node-2',
            type: 'default',
            position: { x: 350, y: 100 },
            data: { label: 'Get Account Info', type: 'GetAccountInfo', config: {} },
            style: { background: '#1f2937', color: '#fff', border: '2px solid #3b82f6', borderRadius: '8px', padding: '10px', fontSize: '14px', width: 180 }
          },
          {
            id: 'node-3',
            type: 'default',
            position: { x: 600, y: 100 },
            data: { label: 'Drawdown Monitor', type: 'DrawdownMonitor', config: { max_drawdown_percentage: 10, alert_threshold: 5 } },
            style: { background: '#1f2937', color: '#fff', border: '2px solid #3b82f6', borderRadius: '8px', padding: '10px', fontSize: '14px', width: 180 }
          },
          {
            id: 'node-4',
            type: 'default',
            position: { x: 850, y: 100 },
            data: { label: 'Daily Loss Limit', type: 'DailyLossLimit', config: { daily_loss_limit: 100, daily_loss_percentage: 2 } },
            style: { background: '#1f2937', color: '#fff', border: '2px solid #3b82f6', borderRadius: '8px', padding: '10px', fontSize: '14px', width: 180 }
          },
          {
            id: 'node-5',
            type: 'default',
            position: { x: 600, y: 250 },
            data: { label: 'Notification', type: 'DashboardNotification', config: { title: 'Daily Check Complete', message: 'Account status checked', type: 'info' } },
            style: { background: '#1f2937', color: '#fff', border: '2px solid #3b82f6', borderRadius: '8px', padding: '10px', fontSize: '14px', width: 180 }
          }
        ],
        edges: [
          { id: 'e1-2', source: 'node-1', target: 'node-2', animated: true },
          { id: 'e2-3', source: 'node-2', target: 'node-3', animated: true },
          { id: 'e3-4', source: 'node-3', target: 'node-4', animated: true },
          { id: 'e4-5', source: 'node-4', target: 'node-5', animated: true }
        ]
      },
      'scalping-15min': {
        name: '15-Minute Scalping',
        description: 'Quick scalping strategy that runs every 15 minutes',
        nodes: [
          {
            id: 'node-1',
            type: 'default',
            position: { x: 100, y: 100 },
            data: { label: 'Time Trigger', type: 'TimeTrigger', config: { interval_minutes: 15 } },
            style: { background: '#1f2937', color: '#fff', border: '2px solid #3b82f6', borderRadius: '8px', padding: '10px', fontSize: '14px', width: 180 }
          },
          {
            id: 'node-2',
            type: 'default',
            position: { x: 350, y: 100 },
            data: { label: 'Get Live Price', type: 'GetLivePrice', config: { symbol: 'EURUSD' } },
            style: { background: '#1f2937', color: '#fff', border: '2px solid #3b82f6', borderRadius: '8px', padding: '10px', fontSize: '14px', width: 180 }
          },
          {
            id: 'node-3',
            type: 'default',
            position: { x: 600, y: 100 },
            data: { label: 'Moving Average', type: 'MovingAverage', config: { period: 20, ma_type: 'EMA' } },
            style: { background: '#1f2937', color: '#fff', border: '2px solid #3b82f6', borderRadius: '8px', padding: '10px', fontSize: '14px', width: 180 }
          },
          {
            id: 'node-4',
            type: 'default',
            position: { x: 350, y: 250 },
            data: { label: 'Max Positions Check', type: 'MaxPositions', config: { max_positions: 3, max_per_symbol: 1 } },
            style: { background: '#1f2937', color: '#fff', border: '2px solid #3b82f6', borderRadius: '8px', padding: '10px', fontSize: '14px', width: 180 }
          },
          {
            id: 'node-5',
            type: 'default',
            position: { x: 600, y: 250 },
            data: { label: 'Market Order', type: 'MarketOrder', config: { action: 'BUY', symbol: 'EURUSD', volume: 0.01, stop_loss: 1.0800, take_profit: 1.0900 } },
            style: { background: '#1f2937', color: '#fff', border: '2px solid #3b82f6', borderRadius: '8px', padding: '10px', fontSize: '14px', width: 180 }
          }
        ],
        edges: [
          { id: 'e1-2', source: 'node-1', target: 'node-2', animated: true },
          { id: 'e2-3', source: 'node-2', target: 'node-3', animated: true },
          { id: 'e3-4', source: 'node-3', target: 'node-4', animated: true },
          { id: 'e4-5', source: 'node-4', target: 'node-5', animated: true }
        ]
      },
      'macd-crossover': {
        name: 'MACD Crossover Strategy',
        description: 'Trade on MACD bullish/bearish crossovers',
        nodes: [
          {
            id: 'node-1',
            type: 'default',
            position: { x: 100, y: 100 },
            data: { label: 'Manual Trigger', type: 'ManualTrigger', config: {} },
            style: { background: '#1f2937', color: '#fff', border: '2px solid #3b82f6', borderRadius: '8px', padding: '10px', fontSize: '14px', width: 180 }
          },
          {
            id: 'node-2',
            type: 'default',
            position: { x: 350, y: 100 },
            data: { label: 'Get Live Price', type: 'GetLivePrice', config: { symbol: 'EURUSD' } },
            style: { background: '#1f2937', color: '#fff', border: '2px solid #3b82f6', borderRadius: '8px', padding: '10px', fontSize: '14px', width: 180 }
          },
          {
            id: 'node-3',
            type: 'default',
            position: { x: 600, y: 100 },
            data: { label: 'MACD', type: 'MACD', config: { fast_period: 12, slow_period: 26, signal_period: 9 } },
            style: { background: '#1f2937', color: '#fff', border: '2px solid #3b82f6', borderRadius: '8px', padding: '10px', fontSize: '14px', width: 180 }
          },
          {
            id: 'node-4',
            type: 'default',
            position: { x: 850, y: 100 },
            data: { label: 'Position Sizer', type: 'PositionSizer', config: { risk_percentage: 1.5, symbol: 'EURUSD' } },
            style: { background: '#1f2937', color: '#fff', border: '2px solid #3b82f6', borderRadius: '8px', padding: '10px', fontSize: '14px', width: 180 }
          },
          {
            id: 'node-5',
            type: 'default',
            position: { x: 600, y: 250 },
            data: { label: 'Market Order', type: 'MarketOrder', config: { action: 'BUY', symbol: 'EURUSD', volume: 0.01 } },
            style: { background: '#1f2937', color: '#fff', border: '2px solid #3b82f6', borderRadius: '8px', padding: '10px', fontSize: '14px', width: 180 }
          }
        ],
        edges: [
          { id: 'e1-2', source: 'node-1', target: 'node-2', animated: true },
          { id: 'e2-3', source: 'node-2', target: 'node-3', animated: true },
          { id: 'e3-4', source: 'node-3', target: 'node-4', animated: true },
          { id: 'e4-5', source: 'node-4', target: 'node-5', animated: true }
        ]
      }
    };

    const template = templates[templateName];
    if (template) {
      setWorkflowName(template.name);
      setWorkflowDescription(template.description);
      setNodes(template.nodes);
      setEdges(template.edges);
      
      // Close templates menu
      const menu = document.getElementById('templates-menu');
      if (menu) menu.classList.add('hidden');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-xl text-white">Loading workflow builder...</div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-900 text-white flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-4 flex-shrink-0 relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/dashboard/agentic')}
              className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
            >
              <ArrowLeft size={20} />
              Back
            </button>
            <div>
              <input
                type="text"
                value={workflowName}
                onChange={(e) => setWorkflowName(e.target.value)}
                className="text-2xl font-bold bg-transparent border-none outline-none focus:ring-2 focus:ring-blue-500 rounded px-2"
                placeholder="Workflow Name"
              />
              <input
                type="text"
                value={workflowDescription}
                onChange={(e) => setWorkflowDescription(e.target.value)}
                className="text-sm text-gray-400 bg-transparent border-none outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 mt-1 block"
                placeholder="Description"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => {
                const templates = document.getElementById('templates-menu');
                if (templates) templates.classList.toggle('hidden');
              }}
              className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors relative"
            >
              <Plus size={20} />
              Load Template
            </button>
            <button
              onClick={saveWorkflow}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <Save size={20} />
              Save Workflow
            </button>
          </div>
        </div>
        
        {/* Templates Dropdown Menu */}
        <div id="templates-menu" className="hidden absolute top-16 right-4 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50 w-80">
          <div className="p-4">
            <h3 className="text-lg font-semibold mb-3">Workflow Templates</h3>
            <div className="space-y-2">
              <button
                onClick={() => loadTemplate('rsi-strategy')}
                className="w-full text-left p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
              >
                <div className="font-medium">RSI Oversold Strategy</div>
                <div className="text-xs text-gray-400">Buy when RSI is oversold with risk management</div>
              </button>
              <button
                onClick={() => loadTemplate('price-breakout')}
                className="w-full text-left p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
              >
                <div className="font-medium">Price Breakout Strategy</div>
                <div className="text-xs text-gray-400">Trigger when price breaks resistance</div>
              </button>
              <button
                onClick={() => loadTemplate('daily-check')}
                className="w-full text-left p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
              >
                <div className="font-medium">Daily Risk Check</div>
                <div className="text-xs text-gray-400">Check account status every day at 9 AM</div>
              </button>
              <button
                onClick={() => loadTemplate('scalping-15min')}
                className="w-full text-left p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
              >
                <div className="font-medium">15-Minute Scalping</div>
                <div className="text-xs text-gray-400">Quick scalping every 15 minutes</div>
              </button>
              <button
                onClick={() => loadTemplate('macd-crossover')}
                className="w-full text-left p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
              >
                <div className="font-medium">MACD Crossover Strategy</div>
                <div className="text-xs text-gray-400">Trade on MACD bullish/bearish crossovers</div>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Node Palette */}
        <div className={`bg-gray-800 border-r border-gray-700 overflow-y-auto flex-shrink-0 transition-all duration-300 ${sidebarCollapsed ? 'w-12' : 'w-64'}`}>
          {/* Collapse/Expand Button */}
          <div className="flex items-center justify-between p-2 border-b border-gray-700">
            {!sidebarCollapsed && <h3 className="text-sm font-semibold">Nodes</h3>}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-2 hover:bg-gray-700 rounded transition-colors"
              title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {sidebarCollapsed ? '→' : '←'}
            </button>
          </div>
          
          {!sidebarCollapsed && (
            <div className="p-4">
              <h3 className="text-lg font-semibold mb-4">Available Nodes</h3>
            
            {availableNodes && Object.entries(availableNodes.categories).map(([key, category]: [string, any]) => (
              <div key={key} className="mb-6">
                <h4 className="text-sm font-semibold text-gray-400 mb-2 uppercase">{category.name}</h4>
                <div className="space-y-2">
                  {category.nodes && category.nodes.length > 0 && category.nodes.map((node: any) => (
                    <div
                      key={node.type}
                      draggable
                      onDragStart={(e) => onDragStart(e, node.type, node.name)}
                      className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors cursor-move text-sm"
                    >
                      <div className="font-medium">{node.name}</div>
                      <div className="text-xs text-gray-400 truncate">{node.description}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            </div>
          )}
        </div>

        {/* Canvas */}
        <div className="flex-1 relative">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            fitView
          >
            <Background color="#374151" gap={16} />
            <Controls />
            <MiniMap 
              nodeColor="#3b82f6"
              maskColor="rgba(0, 0, 0, 0.6)"
              className="bg-gray-800"
            />
            <Panel position="top-center" className="bg-gray-800 px-4 py-2 rounded-lg border border-gray-700">
              <div className="text-sm text-gray-300">
                Drag nodes from the left panel and drop them here
              </div>
            </Panel>
          </ReactFlow>
        </div>

        {/* Properties Panel - Only show when node is selected */}
        {selectedNode && (
          <div className="w-80 bg-gray-800 border-l border-gray-700 overflow-y-auto flex-shrink-0">
            <div className="p-4">
              <h3 className="text-lg font-semibold mb-4">Node Configuration</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Node Type</label>
                  <div className="text-lg font-bold text-blue-500">{selectedNode.data.type}</div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Node ID</label>
                  <div className="text-xs text-gray-400 font-mono">{selectedNode.id}</div>
                </div>

                <div className="border-t border-gray-700 pt-4">
                  <h4 className="text-sm font-semibold mb-3">Configuration</h4>
                  
                  {/* Dynamic form fields based on node type */}
                  {(() => {
                    const nodeType = selectedNode.data.type;
                    const config = selectedNode.data.config || {};
                    
                    // Common fields for different node types
                    if (nodeType === 'GetLivePrice' || nodeType === 'PriceTrigger') {
                      return (
                        <div className="space-y-3">
                          <div>
                            <label className="block text-xs font-medium mb-1">Symbol</label>
                            <input
                              type="text"
                              value={config.symbol || 'EURUSD'}
                              onChange={(e) => updateNodeConfig(selectedNode.id, { ...config, symbol: e.target.value })}
                              className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm"
                              placeholder="EURUSD"
                            />
                          </div>
                          {nodeType === 'PriceTrigger' && (
                            <>
                              <div>
                                <label className="block text-xs font-medium mb-1">Condition</label>
                                <input
                                  type="text"
                                  value={config.condition || 'price > 1.10'}
                                  onChange={(e) => updateNodeConfig(selectedNode.id, { ...config, condition: e.target.value })}
                                  className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm"
                                  placeholder="price > 1.10"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium mb-1">Check Interval (minutes)</label>
                                <input
                                  type="number"
                                  value={config.check_interval || 5}
                                  onChange={(e) => updateNodeConfig(selectedNode.id, { ...config, check_interval: parseInt(e.target.value) })}
                                  className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm"
                                />
                              </div>
                            </>
                          )}
                        </div>
                      );
                    }
                    
                    if (nodeType === 'RSI') {
                      return (
                        <div className="space-y-3">
                          <div>
                            <label className="block text-xs font-medium mb-1">Period</label>
                            <input
                              type="number"
                              value={config.period || 14}
                              onChange={(e) => updateNodeConfig(selectedNode.id, { ...config, period: parseInt(e.target.value) })}
                              className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium mb-1">Overbought Level</label>
                            <input
                              type="number"
                              value={config.overbought || 70}
                              onChange={(e) => updateNodeConfig(selectedNode.id, { ...config, overbought: parseInt(e.target.value) })}
                              className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium mb-1">Oversold Level</label>
                            <input
                              type="number"
                              value={config.oversold || 30}
                              onChange={(e) => updateNodeConfig(selectedNode.id, { ...config, oversold: parseInt(e.target.value) })}
                              className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm"
                            />
                          </div>
                        </div>
                      );
                    }
                    
                    if (nodeType === 'MarketOrder') {
                      return (
                        <div className="space-y-3">
                          <div>
                            <label className="block text-xs font-medium mb-1">Action</label>
                            <select
                              value={config.action || 'BUY'}
                              onChange={(e) => updateNodeConfig(selectedNode.id, { ...config, action: e.target.value })}
                              className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm"
                            >
                              <option value="BUY">BUY</option>
                              <option value="SELL">SELL</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium mb-1">Symbol</label>
                            <input
                              type="text"
                              value={config.symbol || 'EURUSD'}
                              onChange={(e) => updateNodeConfig(selectedNode.id, { ...config, symbol: e.target.value })}
                              className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium mb-1">Volume (Lot Size)</label>
                            <input
                              type="number"
                              step="0.01"
                              value={config.volume || 0.01}
                              onChange={(e) => updateNodeConfig(selectedNode.id, { ...config, volume: parseFloat(e.target.value) })}
                              className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium mb-1">Stop Loss (optional)</label>
                            <input
                              type="number"
                              step="0.00001"
                              value={config.stop_loss || ''}
                              onChange={(e) => updateNodeConfig(selectedNode.id, { ...config, stop_loss: e.target.value ? parseFloat(e.target.value) : undefined })}
                              className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm"
                              placeholder="Optional"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium mb-1">Take Profit (optional)</label>
                            <input
                              type="number"
                              step="0.00001"
                              value={config.take_profit || ''}
                              onChange={(e) => updateNodeConfig(selectedNode.id, { ...config, take_profit: e.target.value ? parseFloat(e.target.value) : undefined })}
                              className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm"
                              placeholder="Optional"
                            />
                          </div>
                        </div>
                      );
                    }
                    
                    if (nodeType === 'PositionSizer') {
                      return (
                        <div className="space-y-3">
                          <div>
                            <label className="block text-xs font-medium mb-1">Risk Percentage</label>
                            <input
                              type="number"
                              step="0.1"
                              value={config.risk_percentage || 1.0}
                              onChange={(e) => updateNodeConfig(selectedNode.id, { ...config, risk_percentage: parseFloat(e.target.value) })}
                              className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium mb-1">Symbol</label>
                            <input
                              type="text"
                              value={config.symbol || 'EURUSD'}
                              onChange={(e) => updateNodeConfig(selectedNode.id, { ...config, symbol: e.target.value })}
                              className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm"
                            />
                          </div>
                        </div>
                      );
                    }
                    
                    if (nodeType === 'ScheduleTrigger') {
                      return (
                        <div className="space-y-3">
                          <div>
                            <label className="block text-xs font-medium mb-1">Cron Expression</label>
                            <input
                              type="text"
                              value={config.cron_expression || '0 9 * * *'}
                              onChange={(e) => updateNodeConfig(selectedNode.id, { ...config, cron_expression: e.target.value })}
                              className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm font-mono"
                              placeholder="0 9 * * *"
                            />
                            <div className="text-xs text-gray-500 mt-1">
                              Examples: "0 9 * * *" (9 AM daily), "*/15 * * * *" (every 15 min)
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs font-medium mb-1">Timezone</label>
                            <input
                              type="text"
                              value={config.timezone || 'UTC'}
                              onChange={(e) => updateNodeConfig(selectedNode.id, { ...config, timezone: e.target.value })}
                              className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm"
                            />
                          </div>
                        </div>
                      );
                    }
                    
                    if (nodeType === 'TimeTrigger') {
                      return (
                        <div className="space-y-3">
                          <div>
                            <label className="block text-xs font-medium mb-1">Interval (minutes)</label>
                            <input
                              type="number"
                              value={config.interval_minutes || 60}
                              onChange={(e) => updateNodeConfig(selectedNode.id, { ...config, interval_minutes: parseInt(e.target.value) })}
                              className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm"
                            />
                          </div>
                        </div>
                      );
                    }
                    
                    if (nodeType === 'DashboardNotification') {
                      return (
                        <div className="space-y-3">
                          <div>
                            <label className="block text-xs font-medium mb-1">Title</label>
                            <input
                              type="text"
                              value={config.title || ''}
                              onChange={(e) => updateNodeConfig(selectedNode.id, { ...config, title: e.target.value })}
                              className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm"
                              placeholder="Notification Title"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium mb-1">Message</label>
                            <textarea
                              value={config.message || ''}
                              onChange={(e) => updateNodeConfig(selectedNode.id, { ...config, message: e.target.value })}
                              className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm"
                              rows={3}
                              placeholder="Notification message"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium mb-1">Type</label>
                            <select
                              value={config.type || 'info'}
                              onChange={(e) => updateNodeConfig(selectedNode.id, { ...config, type: e.target.value })}
                              className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm"
                            >
                              <option value="info">Info</option>
                              <option value="success">Success</option>
                              <option value="warning">Warning</option>
                              <option value="error">Error</option>
                            </select>
                          </div>
                        </div>
                      );
                    }
                    
                    // Default: Show JSON editor for other nodes
                    return (
                      <div>
                        <label className="block text-xs font-medium mb-1">Configuration (JSON)</label>
                        <textarea
                          value={JSON.stringify(config, null, 2)}
                          onChange={(e) => {
                            try {
                              const newConfig = JSON.parse(e.target.value);
                              updateNodeConfig(selectedNode.id, newConfig);
                            } catch (err) {
                              // Invalid JSON, ignore
                            }
                          }}
                          className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm font-mono"
                          rows={8}
                          placeholder='{"key": "value"}'
                        />
                      </div>
                    );
                  })()}
                </div>

                <div className="border-t border-gray-700 pt-4 space-y-2">
                  <button
                    onClick={() => deleteNode(selectedNode.id)}
                    className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg transition-colors"
                  >
                    <Trash2 size={16} />
                    Delete Node
                  </button>

                  <button
                    onClick={() => setSelectedNode(null)}
                    className="w-full flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg transition-colors"
                  >
                    Close Panel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
