'use client';

import { useState } from 'react';
import { Database, Table, Download, Upload, RefreshCw, Trash2, AlertTriangle, Check, HardDrive } from 'lucide-react';

interface TableInfo {
  name: string;
  rows: number;
  size: string;
  lastUpdated: string;
}

const mockTables: TableInfo[] = [
  { name: 'users', rows: 1247, size: '2.4 MB', lastUpdated: '2 min ago' },
  { name: 'trades', rows: 15420, size: '8.7 MB', lastUpdated: '1 min ago' },
  { name: 'conversations', rows: 8930, size: '12.3 MB', lastUpdated: '5 min ago' },
  { name: 'messages', rows: 45670, size: '28.5 MB', lastUpdated: '1 min ago' },
  { name: 'backtests', rows: 2340, size: '5.2 MB', lastUpdated: '15 min ago' },
  { name: 'subscriptions', rows: 279, size: '0.8 MB', lastUpdated: '1 hour ago' },
  { name: 'blogs', rows: 28, size: '1.2 MB', lastUpdated: '2 hours ago' },
  { name: 'notifications', rows: 3450, size: '1.8 MB', lastUpdated: '30 min ago' },
  { name: 'api_logs', rows: 89450, size: '45.2 MB', lastUpdated: '1 min ago' },
  { name: 'settings', rows: 45, size: '0.1 MB', lastUpdated: '1 day ago' },
];

export default function DatabasePage() {
  const [tables] = useState<TableInfo[]>(mockTables);
  const [backupProgress, setBackupProgress] = useState<number | null>(null);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);

  const totalSize = '105.2 MB';
  const totalRows = tables.reduce((a, t) => a + t.rows, 0);

  const createBackup = async () => {
    setBackupProgress(0);
    for (let i = 0; i <= 100; i += 10) {
      await new Promise(r => setTimeout(r, 300));
      setBackupProgress(i);
    }
    setBackupProgress(null);
    alert('Backup created successfully!');
  };

  const optimizeTable = (name: string) => {
    alert(`Optimizing table: ${name}`);
  };

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Database</h1>
          <p className="text-gray-400 text-sm">Manage database tables and backups</p>
        </div>
        <div className="flex gap-2">
          <button onClick={createBackup} disabled={backupProgress !== null} className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg disabled:opacity-50">
            {backupProgress !== null ? <RefreshCw size={18} className="animate-spin"/> : <Download size={18}/>}
            <span>{backupProgress !== null ? `${backupProgress}%` : 'Backup'}</span>
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg">
            <Upload size={18}/><span>Restore</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Database size={20} className="text-primary-500"/>
          </div>
          <p className="text-2xl font-bold text-white">{tables.length}</p>
          <p className="text-sm text-gray-500">Tables</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Table size={20} className="text-blue-500"/>
          </div>
          <p className="text-2xl font-bold text-white">{totalRows.toLocaleString()}</p>
          <p className="text-sm text-gray-500">Total Rows</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <HardDrive size={20} className="text-green-500"/>
          </div>
          <p className="text-2xl font-bold text-white">{totalSize}</p>
          <p className="text-sm text-gray-500">Total Size</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Check size={20} className="text-green-500"/>
          </div>
          <p className="text-2xl font-bold text-green-500">Healthy</p>
          <p className="text-sm text-gray-500">Status</p>
        </div>
      </div>

      {/* Warning */}
      <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-6 flex items-start gap-3">
        <AlertTriangle className="text-yellow-500 flex-shrink-0 mt-0.5" size={20}/>
        <div>
          <p className="text-yellow-500 font-medium">Caution</p>
          <p className="text-yellow-500/80 text-sm">Database operations can affect system performance. Always create a backup before making changes.</p>
        </div>
      </div>

      {/* Tables */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="p-5 border-b border-gray-800">
          <h2 className="text-lg font-semibold text-white">Database Tables</h2>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-800">
              <th className="text-left px-5 py-4 text-sm font-medium text-gray-400">Table Name</th>
              <th className="text-right px-5 py-4 text-sm font-medium text-gray-400">Rows</th>
              <th className="text-right px-5 py-4 text-sm font-medium text-gray-400">Size</th>
              <th className="text-right px-5 py-4 text-sm font-medium text-gray-400">Last Updated</th>
              <th className="text-right px-5 py-4 text-sm font-medium text-gray-400">Actions</th>
            </tr>
          </thead>
          <tbody>
            {tables.map(table => (
              <tr key={table.name} className="border-b border-gray-800 hover:bg-gray-800/50">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2">
                    <Table size={16} className="text-gray-500"/>
                    <span className="text-sm font-mono text-white">{table.name}</span>
                  </div>
                </td>
                <td className="px-5 py-4 text-sm text-gray-400 text-right">{table.rows.toLocaleString()}</td>
                <td className="px-5 py-4 text-sm text-gray-400 text-right">{table.size}</td>
                <td className="px-5 py-4 text-sm text-gray-500 text-right">{table.lastUpdated}</td>
                <td className="px-5 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button onClick={() => optimizeTable(table.name)} className="px-3 py-1 text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 rounded">
                      Optimize
                    </button>
                    <button className="px-3 py-1 text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 rounded">
                      Export
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Recent Backups */}
      <div className="mt-8 bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h2 className="text-lg font-semibold text-white mb-4">Recent Backups</h2>
        <div className="space-y-3">
          {[
            { date: '2024-12-12 10:00', size: '98.5 MB', status: 'success' },
            { date: '2024-12-11 10:00', size: '97.2 MB', status: 'success' },
            { date: '2024-12-10 10:00', size: '95.8 MB', status: 'success' },
          ].map((backup, i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
              <div className="flex items-center gap-3">
                <Check size={16} className="text-green-500"/>
                <div>
                  <p className="text-sm text-white">{backup.date}</p>
                  <p className="text-xs text-gray-500">{backup.size}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="px-3 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 rounded">Download</button>
                <button className="px-3 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 rounded">Restore</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
