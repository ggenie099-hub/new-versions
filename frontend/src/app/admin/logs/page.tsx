'use client';

import { useState } from 'react';
import { Search, Filter, Download, RefreshCw, AlertTriangle, Info, CheckCircle, XCircle } from 'lucide-react';

interface Log {
  id: number;
  timestamp: string;
  level: 'info' | 'warning' | 'error' | 'success';
  source: string;
  message: string;
  user?: string;
  ip?: string;
}

const mockLogs: Log[] = [
  { id: 1, timestamp: '2024-12-12 13:45:23', level: 'info', source: 'Auth', message: 'User login successful', user: 'rahul@example.com', ip: '192.168.1.1' },
  { id: 2, timestamp: '2024-12-12 13:44:15', level: 'success', source: 'Trade', message: 'Trade executed: BUY EURUSD 0.1 lot', user: 'amit@example.com', ip: '192.168.1.2' },
  { id: 3, timestamp: '2024-12-12 13:43:02', level: 'warning', source: 'API', message: 'Rate limit approaching for OpenAI API', ip: 'system' },
  { id: 4, timestamp: '2024-12-12 13:42:45', level: 'error', source: 'MT5', message: 'Connection failed: Invalid credentials', user: 'priya@example.com', ip: '192.168.1.3' },
  { id: 5, timestamp: '2024-12-12 13:41:30', level: 'info', source: 'System', message: 'Scheduled backup completed', ip: 'system' },
  { id: 6, timestamp: '2024-12-12 13:40:12', level: 'info', source: 'Auth', message: 'New user registered', user: 'sneha@example.com', ip: '192.168.1.4' },
  { id: 7, timestamp: '2024-12-12 13:39:45', level: 'success', source: 'Backtest', message: 'Backtest completed: EMA Strategy', user: 'rahul@example.com', ip: '192.168.1.1' },
  { id: 8, timestamp: '2024-12-12 13:38:20', level: 'warning', source: 'Security', message: 'Multiple failed login attempts detected', user: 'unknown', ip: '10.0.0.1' },
  { id: 9, timestamp: '2024-12-12 13:37:10', level: 'error', source: 'Payment', message: 'Payment failed: Card declined', user: 'vikram@example.com', ip: '192.168.1.5' },
  { id: 10, timestamp: '2024-12-12 13:36:00', level: 'info', source: 'AI', message: 'AI chat session started', user: 'amit@example.com', ip: '192.168.1.2' },
];

export default function LogsPage() {
  const [logs, setLogs] = useState<Log[]>(mockLogs);
  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState<'all' | 'info' | 'warning' | 'error' | 'success'>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');

  const sources = ['all', ...new Set(mockLogs.map(l => l.source))];

  const filtered = logs.filter(l => {
    const matchSearch = l.message.toLowerCase().includes(search.toLowerCase()) || l.user?.toLowerCase().includes(search.toLowerCase());
    const matchLevel = levelFilter === 'all' || l.level === levelFilter;
    const matchSource = sourceFilter === 'all' || l.source === sourceFilter;
    return matchSearch && matchLevel && matchSource;
  });

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'info': return <Info size={16} className="text-blue-500"/>;
      case 'warning': return <AlertTriangle size={16} className="text-yellow-500"/>;
      case 'error': return <XCircle size={16} className="text-red-500"/>;
      case 'success': return <CheckCircle size={16} className="text-green-500"/>;
      default: return <Info size={16} className="text-gray-500"/>;
    }
  };

  const getLevelBg = (level: string) => {
    switch (level) {
      case 'info': return 'bg-blue-500/10 text-blue-400';
      case 'warning': return 'bg-yellow-500/10 text-yellow-400';
      case 'error': return 'bg-red-500/10 text-red-400';
      case 'success': return 'bg-green-500/10 text-green-400';
      default: return 'bg-gray-500/10 text-gray-400';
    }
  };

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">System Logs</h1>
          <p className="text-gray-400 text-sm">Monitor system activity and errors</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg">
            <RefreshCw size={18}/><span>Refresh</span>
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg">
            <Download size={18}/><span>Export</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-2xl font-bold text-white">{logs.length}</p>
          <p className="text-sm text-gray-500">Total Logs</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-2xl font-bold text-red-500">{logs.filter(l => l.level === 'error').length}</p>
          <p className="text-sm text-gray-500">Errors</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-2xl font-bold text-yellow-500">{logs.filter(l => l.level === 'warning').length}</p>
          <p className="text-sm text-gray-500">Warnings</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-2xl font-bold text-green-500">{logs.filter(l => l.level === 'success').length}</p>
          <p className="text-sm text-gray-500">Success</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"/>
          <input type="text" placeholder="Search logs..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-primary-500 outline-none"/>
        </div>
        <select value={levelFilter} onChange={e => setLevelFilter(e.target.value as any)}
          className="px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-primary-500 outline-none">
          <option value="all">All Levels</option>
          <option value="info">Info</option>
          <option value="warning">Warning</option>
          <option value="error">Error</option>
          <option value="success">Success</option>
        </select>
        <select value={sourceFilter} onChange={e => setSourceFilter(e.target.value)}
          className="px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-primary-500 outline-none">
          {sources.map(s => <option key={s} value={s}>{s === 'all' ? 'All Sources' : s}</option>)}
        </select>
      </div>

      {/* Logs Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left px-5 py-4 text-sm font-medium text-gray-400">Timestamp</th>
                <th className="text-left px-5 py-4 text-sm font-medium text-gray-400">Level</th>
                <th className="text-left px-5 py-4 text-sm font-medium text-gray-400">Source</th>
                <th className="text-left px-5 py-4 text-sm font-medium text-gray-400">Message</th>
                <th className="text-left px-5 py-4 text-sm font-medium text-gray-400">User</th>
                <th className="text-left px-5 py-4 text-sm font-medium text-gray-400">IP</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(log => (
                <tr key={log.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                  <td className="px-5 py-4 text-sm text-gray-400 font-mono whitespace-nowrap">{log.timestamp}</td>
                  <td className="px-5 py-4">
                    <span className={`px-2 py-1 text-xs rounded-full flex items-center gap-1 w-fit ${getLevelBg(log.level)}`}>
                      {getLevelIcon(log.level)}
                      {log.level}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-300">{log.source}</td>
                  <td className="px-5 py-4 text-sm text-white max-w-md truncate">{log.message}</td>
                  <td className="px-5 py-4 text-sm text-gray-400">{log.user || '-'}</td>
                  <td className="px-5 py-4 text-sm text-gray-500 font-mono">{log.ip}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="p-8 text-center text-gray-500">No logs found</div>
        )}
      </div>
    </div>
  );
}
