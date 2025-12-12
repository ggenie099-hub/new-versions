'use client';

import { useRef, useEffect, useCallback } from 'react';
import { useAgenticDispatch, useAgenticSelector } from '@/store/agentic/hooks';
import { addNode, moveNode, selectNode, connectNodes } from '@/store/agentic/workflowsSlice';
import type { WorkflowNode } from '@/store/agentic/types';
import * as d3 from 'd3';

export default function Canvas() {
  const dispatch = useAgenticDispatch();
  const activeCanvasId = useAgenticSelector(s => s.workflows.activeCanvasId);
  const canvas = useAgenticSelector(s => (s.workflows.activeCanvasId ? s.workflows.canvases[s.workflows.activeCanvasId] : undefined));
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const pendingSourceRef = useRef<string | null>(null);

  const onDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const type = e.dataTransfer.getData('application/node-type') as any;
    if (!type || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    dispatch(addNode({ type, x, y }));
  }, [dispatch]);

  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const onMouseDownNode = (id: string, e: React.MouseEvent) => {
    if (e.shiftKey) {
      // Begin connection
      pendingSourceRef.current = id;
      return;
    }
    dispatch(selectNode(id));
  };

  const onMouseMove = useCallback((e: MouseEvent) => {
    const selectedId = canvas?.nodes.find(n => n.id === (document.body as any)._dragNodeId)?.id;
    if (!selectedId || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    dispatch(moveNode({ id: selectedId, x, y }));
  }, [canvas, dispatch]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if ((document.body as any)._dragNodeId) onMouseMove(e);
    };
    window.addEventListener('mousemove', handler);
    window.addEventListener('mouseup', () => { (document.body as any)._dragNodeId = null; });
    return () => {
      window.removeEventListener('mousemove', handler);
    };
  }, [onMouseMove]);

  useEffect(() => {
    // render edges with d3
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    if (!canvas) return;
    const g = svg.append('g');
    canvas.edges.forEach(edge => {
      const s = canvas.nodes.find(n => n.id === edge.sourceId);
      const t = canvas.nodes.find(n => n.id === edge.targetId);
      if (!s || !t) return;
      g.append('line')
        .attr('x1', s.x + 80)
        .attr('y1', s.y + 25)
        .attr('x2', t.x + 0)
        .attr('y2', t.y + 25)
        .attr('stroke', '#60a5fa')
        .attr('stroke-width', 2);
    });
  }, [canvas]);

  const handleConnect = (targetId: string) => {
    const sourceId = pendingSourceRef.current;
    pendingSourceRef.current = null;
    if (sourceId && sourceId !== targetId) {
      dispatch(connectNodes({ sourceId, targetId }));
    }
  };

  return (
    <div className="relative flex-1 overflow-hidden">
      <div
        ref={containerRef}
        className="absolute inset-0"
        onDrop={onDrop}
        onDragOver={onDragOver}
        style={{
          backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.08) 1px, transparent 1px)`,
          backgroundSize: '20px 20px',
          backgroundColor: '#0b0b0b',
        }}
      >
        {/* Edges */}
        <svg ref={svgRef} className="absolute inset-0 w-full h-full pointer-events-none" />
        {/* Nodes */}
        {canvas?.nodes.map((n) => (
          <NodeView key={n.id} node={n} onMouseDownNode={onMouseDownNode} onMouseUpNode={() => handleConnect(n.id)} />
        ))}
      </div>
    </div>
  );
}

function NodeView({ node, onMouseDownNode, onMouseUpNode }: { node: WorkflowNode; onMouseDownNode: (id: string, e: React.MouseEvent) => void; onMouseUpNode: () => void }) {
  return (
    <div
      className="absolute px-3 py-2 rounded-md bg-gray-900 border border-gray-700 text-gray-200 shadow-md select-none"
      style={{ left: node.x, top: node.y, width: 160 }}
      onMouseDown={(e) => { (document.body as any)._dragNodeId = node.id; onMouseDownNode(node.id, e); }}
      onMouseUp={onMouseUpNode}
      role="button"
      aria-label={`Node ${node.label}`}
    >
      <div className="text-xs font-semibold">{node.label}</div>
      <div className="mt-1 text-[10px] text-gray-400">{node.type}</div>
      <div className="mt-2 h-1 w-full bg-gray-700 rounded">
        <div className="h-1 bg-primary-600 rounded" style={{ width: '40%' }}></div>
      </div>
    </div>
  );
}