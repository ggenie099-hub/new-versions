export type NodeType = 'market_data' | 'indicator' | 'order' | 'risk' | 'ai';

export interface NodeConfig {
  [key: string]: any;
}

export interface WorkflowNode {
  id: string;
  type: NodeType;
  x: number;
  y: number;
  label: string;
  config: NodeConfig;
}

export interface WorkflowEdge {
  id: string;
  sourceId: string;
  targetId: string;
}

export interface CanvasState {
  id: string;
  name: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}

export interface WorkflowsState {
  canvases: Record<string, CanvasState>;
  activeCanvasId: string | null;
  selectedNodeId: string | null;
  sidebarCollapsed: boolean;
}