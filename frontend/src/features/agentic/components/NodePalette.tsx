'use client';

import { useCallback } from 'react';
import { clsx } from 'clsx';

const palette = [
  { type: 'market_data', label: 'Market Data' },
  { type: 'indicator', label: 'Indicator' },
  { type: 'order', label: 'Order Execution' },
  { type: 'risk', label: 'Risk Mgmt' },
  { type: 'ai', label: 'AI Component' },
];

export default function NodePalette() {
  const onDragStart = useCallback((e: React.DragEvent<HTMLDivElement>, type: string) => {
    e.dataTransfer.setData('application/node-type', type);
    e.dataTransfer.effectAllowed = 'copy';
  }, []);

  return (
    <div className="flex items-center space-x-2">
      {palette.map(p => (
        <div
          key={p.type}
          draggable
          onDragStart={(e) => onDragStart(e, p.type)}
          className={clsx('text-xs px-3 py-2 rounded bg-gray-900 border border-gray-800 text-gray-200 hover:bg-gray-800 cursor-move')}
          title={`Drag to canvas: ${p.label}`}
        >
          {p.label}
        </div>
      ))}
    </div>
  );
}