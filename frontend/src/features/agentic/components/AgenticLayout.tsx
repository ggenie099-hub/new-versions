'use client';

import { Provider } from 'react-redux';
import { agenticStore } from '@/store/agentic/store';
import SidebarPanel from './SidebarPanel';
import NodePalette from './NodePalette';
import Canvas from './Canvas';
import ConfigPanel from './ConfigPanel';
import { clsx } from 'clsx';

export default function AgenticLayout() {
  return (
    <Provider store={agenticStore}>
      <div className={clsx('flex h-[calc(100vh-64px)] bg-black text-white')}> 
        <SidebarPanel />
        <div className="flex-1 flex flex-col">
          <header className="flex items-center justify-between px-4 py-3 border-b border-gray-800 bg-black">
            <h1 className="text-lg font-semibold">Agentic Trading Workflows</h1>
            <NodePalette />
          </header>
          <main className="flex flex-1">
            <Canvas />
            <ConfigPanel />
          </main>
        </div>
      </div>
    </Provider>
  );
}