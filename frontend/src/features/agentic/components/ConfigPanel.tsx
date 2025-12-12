'use client';

import { useAgenticDispatch, useAgenticSelector } from '@/store/agentic/hooks';
import { updateNodeConfig } from '@/store/agentic/workflowsSlice';
import { clsx } from 'clsx';

export default function ConfigPanel() {
  const dispatch = useAgenticDispatch();
  const selectedId = useAgenticSelector(s => s.workflows.selectedNodeId);
  const canvas = useAgenticSelector(s => (s.workflows.activeCanvasId ? s.workflows.canvases[s.workflows.activeCanvasId] : undefined));
  const node = selectedId && canvas ? canvas.nodes.find(n => n.id === selectedId) : undefined;

  if (!node) return (
    <aside className="w-80 border-l border-gray-800 bg-black text-gray-400 hidden xl:block" />
  );

  const onChange = (key: string, value: any) => {
    dispatch(updateNodeConfig({ id: node.id, config: { [key]: value } }));
  };

  return (
    <aside className="w-80 border-l border-gray-800 bg-black text-gray-200 hidden xl:flex flex-col">
      <div className="px-3 py-3 border-b border-gray-800">
        <div className="text-sm font-semibold">Config: {node.label}</div>
        <div className="text-xs text-gray-400">Type: {node.type}</div>
      </div>
      <div className="p-3 space-y-3">
        {node.type === 'market_data' && (
          <Field label="Symbol" value={node.config.symbol || ''} onChange={(v) => onChange('symbol', v)} />
        )}
        {node.type === 'indicator' && (
          <Field label="Period" value={node.config.period || 14} onChange={(v) => onChange('period', parseInt(v) || 14)} />
        )}
        {node.type === 'order' && (
          <>
            <Field label="Order Type" value={node.config.orderType || 'market'} onChange={(v) => onChange('orderType', v)} />
            <Field label="Quantity" value={node.config.quantity || 1} onChange={(v) => onChange('quantity', parseFloat(v) || 1)} />
            <Field label="Price" value={node.config.price || ''} onChange={(v) => onChange('price', v)} />
          </>
        )}
        {node.type === 'risk' && (
          <>
            <Field label="Stop Loss" value={node.config.stopLoss || ''} onChange={(v) => onChange('stopLoss', v)} />
            <Field label="Take Profit" value={node.config.takeProfit || ''} onChange={(v) => onChange('takeProfit', v)} />
          </>
        )}
        {node.type === 'ai' && (
          <>
            <Field label="Model" value={node.config.model || 'tfjs-regression'} onChange={(v) => onChange('model', v)} />
            <Field label="Threshold" value={node.config.threshold || 0.5} onChange={(v) => onChange('threshold', parseFloat(v) || 0.5)} />
          </>
        )}
        <div className="mt-4">
          <div className="text-xs text-gray-400 mb-1">Live Preview</div>
          <div className="h-24 rounded bg-gray-900 border border-gray-800 flex items-center justify-center text-xs text-gray-400">
            Coming soon
          </div>
        </div>
      </div>
    </aside>
  );
}

function Field({ label, value, onChange }: { label: string; value: any; onChange: (v: any) => void }) {
  return (
    <div>
      <div className="text-xs text-gray-400 mb-1">{label}</div>
      <input
        className={clsx('w-full text-xs px-2 py-2 rounded bg-gray-900 border border-gray-800 text-gray-200 focus:outline-none focus:border-primary-600')}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}