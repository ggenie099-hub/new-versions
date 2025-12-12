import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { CanvasState, WorkflowsState, WorkflowEdge, WorkflowNode, NodeType } from './types';

const initialCanvas = (): CanvasState => ({ id: `canvas-${Date.now()}`, name: 'Canvas 1', nodes: [], edges: [] });

const initialState: WorkflowsState = {
  canvases: {},
  activeCanvasId: null,
  selectedNodeId: null,
  sidebarCollapsed: false,
};

export const workflowsSlice = createSlice({
  name: 'workflows',
  initialState,
  reducers: {
    addCanvas(state, action: PayloadAction<{ name?: string } | undefined>) {
      const id = `canvas-${Date.now()}`;
      const name = action.payload?.name || `Canvas ${Object.keys(state.canvases).length + 1}`;
      state.canvases[id] = { id, name, nodes: [], edges: [] };
      state.activeCanvasId = id;
    },
    setActiveCanvas(state, action: PayloadAction<string>) {
      if (state.canvases[action.payload]) {
        state.activeCanvasId = action.payload;
        state.selectedNodeId = null;
      }
    },
    setSidebarCollapsed(state, action: PayloadAction<boolean>) {
      state.sidebarCollapsed = action.payload;
    },
    addNode(state, action: PayloadAction<{ type: NodeType; x: number; y: number; label?: string }>) {
      const canvas = state.activeCanvasId ? state.canvases[state.activeCanvasId] : undefined;
      if (!canvas) return;
      const id = `node-${Date.now()}-${Math.floor(Math.random()*1000)}`;
      const node: WorkflowNode = {
        id,
        type: action.payload.type,
        x: action.payload.x,
        y: action.payload.y,
        label: action.payload.label || action.payload.type,
        config: {},
      };
      canvas.nodes.push(node);
    },
    moveNode(state, action: PayloadAction<{ id: string; x: number; y: number }>) {
      const canvas = state.activeCanvasId ? state.canvases[state.activeCanvasId] : undefined;
      if (!canvas) return;
      const node = canvas.nodes.find(n => n.id === action.payload.id);
      if (node) {
        node.x = action.payload.x;
        node.y = action.payload.y;
      }
    },
    selectNode(state, action: PayloadAction<string | null>) {
      state.selectedNodeId = action.payload;
    },
    removeNode(state, action: PayloadAction<string>) {
      const canvas = state.activeCanvasId ? state.canvases[state.activeCanvasId] : undefined;
      if (!canvas) return;
      canvas.nodes = canvas.nodes.filter(n => n.id !== action.payload);
      canvas.edges = canvas.edges.filter(e => e.sourceId !== action.payload && e.targetId !== action.payload);
      if (state.selectedNodeId === action.payload) state.selectedNodeId = null;
    },
    connectNodes(state, action: PayloadAction<{ sourceId: string; targetId: string }>) {
      const canvas = state.activeCanvasId ? state.canvases[state.activeCanvasId] : undefined;
      if (!canvas) return;
      const id = `edge-${Date.now()}-${Math.floor(Math.random()*1000)}`;
      const edge: WorkflowEdge = { id, sourceId: action.payload.sourceId, targetId: action.payload.targetId };
      canvas.edges.push(edge);
    },
    updateNodeConfig(state, action: PayloadAction<{ id: string; config: Record<string, any> }>) {
      const canvas = state.activeCanvasId ? state.canvases[state.activeCanvasId] : undefined;
      if (!canvas) return;
      const node = canvas.nodes.find(n => n.id === action.payload.id);
      if (node) {
        node.config = { ...node.config, ...action.payload.config };
      }
    },
  }
});

export const {
  addCanvas,
  setActiveCanvas,
  setSidebarCollapsed,
  addNode,
  moveNode,
  selectNode,
  removeNode,
  connectNodes,
  updateNodeConfig,
} = workflowsSlice.actions;

export default workflowsSlice.reducer;