'use client';

import { useAgenticDispatch, useAgenticSelector } from '@/store/agentic/hooks';
import { setSidebarCollapsed, addCanvas, setActiveCanvas } from '@/store/agentic/workflowsSlice';
import { ChevronLeft, ChevronRight, LayoutGrid, Layers, Settings, User, Activity, BoxSelect } from 'lucide-react';
import { clsx } from 'clsx';

export default function SidebarPanel() {
  const dispatch = useAgenticDispatch();
  const collapsed = useAgenticSelector(s => s.workflows.sidebarCollapsed);
  const canvases = useAgenticSelector(s => s.workflows.canvases);
  const activeCanvasId = useAgenticSelector(s => s.workflows.activeCanvasId);

  return (
    <aside
      className={clsx(
        'h-full border-r border-gray-800 bg-black text-gray-200 transition-all duration-300 ease-in-out',
      )}
      style={{ width: collapsed ? 64 : 300 }}
    >
      <div className="flex items-center justify-between px-3 py-3 border-b border-gray-800">
        {!collapsed && <h2 className="text-sm font-semibold">Trading System</h2>}
        <button
          className="p-2 rounded hover:bg-gray-900"
          onClick={() => dispatch(setSidebarCollapsed(!collapsed))}
          aria-label={collapsed ? 'Expand' : 'Collapse'}
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* Canvas Tabs */}
      <div className="px-3 py-2 border-b border-gray-800">
        {!collapsed && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">Workflows</span>
            <button
              className="text-xs px-2 py-1 bg-gray-900 rounded border border-gray-700 hover:bg-gray-800"
              onClick={() => dispatch(addCanvas(undefined))}
            >
              New Canvas
            </button>
          </div>
        )}
        <div className={clsx('mt-2 space-y-1', collapsed && 'px-1')}>
          {Object.values(canvases).map(c => (
            <button
              key={c.id}
              className={clsx(
                'w-full text-left text-xs px-2 py-2 rounded',
                activeCanvasId === c.id ? 'bg-primary-600 text-white' : 'bg-gray-900 hover:bg-gray-800'
              )}
              onClick={() => dispatch(setActiveCanvas(c.id))}
              title={c.name}
            >
              {collapsed ? <Layers size={16} /> : c.name}
            </button>
          ))}
        </div>
      </div>

      {/* Categories */}
      <div className="p-3 space-y-3">
        <Section title="Market Watch" icon={<Activity size={16} />} collapsed={collapsed} />
        <Section title="Indicators Library" icon={<LayoutGrid size={16} />} collapsed={collapsed} />
        <Section title="Strategy Templates" icon={<BoxSelect size={16} />} collapsed={collapsed} />
        <Section title="Account Management" icon={<User size={16} />} collapsed={collapsed} />
      </div>
    </aside>
  );
}

function Section({ title, icon, collapsed }: { title: string; icon: React.ReactNode; collapsed: boolean }) {
  return (
    <div>
      <div className="flex items-center space-x-2 text-xs text-gray-400">
        {icon}
        {!collapsed && <span>{title}</span>}
      </div>
      {!collapsed && (
        <div className="mt-2 grid grid-cols-2 gap-2">
          <div className="text-xs px-2 py-2 rounded bg-gray-900 border border-gray-800">Item 1</div>
          <div className="text-xs px-2 py-2 rounded bg-gray-900 border border-gray-800">Item 2</div>
        </div>
      )}
    </div>
  );
}