'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useStore } from '@/store/useStore';
import { mt5API, tradeAPI, watchlistAPI } from '@/lib/api';
import { Activity, DollarSign, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

export default function DashboardPage() {
  const { activeAccount, setActiveAccount, trades, setTrades } = useStore();
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [positions, setPositions] = useState<any[]>([]);
  const [mt5Accounts, setMT5Accounts] = useState<any[]>([]);
  const [autoSync, setAutoSync] = useState(true);
  const [syncInterval, setSyncInterval] = useState(10); // seconds

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Auto-sync effect
  useEffect(() => {
    if (!autoSync || !activeAccount) return;

    const interval = setInterval(() => {
      autoSyncData();
    }, syncInterval * 1000);

    return () => clearInterval(interval);
  }, [autoSync, syncInterval, activeAccount]);

  const loadDashboardData = async () => {
    try {
      const [accountsRes, tradesRes] = await Promise.all([
        mt5API.getAccounts(),
        tradeAPI.getOpenTrades(),
      ]);

      const accounts = accountsRes.data;
      setMT5Accounts(accounts);

      const connectedAccount = accounts.find((acc: any) => acc.is_connected);
      if (connectedAccount) {
        setActiveAccount(connectedAccount);
        
        // Load positions for connected account
        try {
          const positionsRes = await tradeAPI.syncPositions(connectedAccount.id);
          console.log('Positions response:', positionsRes.data);
          // The backend returns { positions: [...], message: "...", total_positions: N }
          const positionsData = positionsRes.data.positions || [];
          setPositions(positionsData);
          console.log('Loaded positions:', positionsData.length);
        } catch (error) {
          console.error('Failed to load positions:', error);
          setPositions([]);
        }
      }

      setTrades(tradesRes.data);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const autoSyncData = async () => {
    if (!activeAccount || syncing) return;

    try {
      // Sync account data silently
      const accountRes = await mt5API.syncAccount(activeAccount.id);
      if (accountRes.data.account) {
        setActiveAccount(accountRes.data.account);
      }
      
      // Sync positions from MT5
      const positionsRes = await tradeAPI.syncPositions(activeAccount.id);
      const positionsData = positionsRes.data.positions || [];
      setPositions(positionsData);
      
      console.log(`Auto-synced: ${positionsData.length} positions`);
    } catch (error) {
      console.error('Auto-sync failed:', error);
    }
  };

  const handleSync = async () => {
    if (!activeAccount) {
      toast.error('No active MT5 account');
      return;
    }

    setSyncing(true);
    try {
      // Sync account data (balance, equity, etc.)
      await mt5API.syncAccount(activeAccount.id);
      
      // Sync positions from MT5
      const positionsRes = await tradeAPI.syncPositions(activeAccount.id);
      const positionsData = positionsRes.data.positions || [];
      setPositions(positionsData);
      
      // Reload all dashboard data
      await loadDashboardData();
      
      toast.success(`Account synced successfully. ${positionsData.length} open position(s) found.`);
    } catch (error: any) {
      const message = error?.response?.data?.detail || 'Failed to sync account';
      toast.error(message);
    } finally {
      setSyncing(false);
    }
  };

  const stats = [
    {
      name: 'Balance',
      value: activeAccount ? `$${activeAccount.balance.toFixed(2)}` : '$0.00',
      icon: DollarSign,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
    },
    {
      name: 'Equity',
      value: activeAccount ? `$${activeAccount.equity.toFixed(2)}` : '$0.00',
      icon: Activity,
      color: 'text-green-500',
      bg: 'bg-green-500/10',
    },
    {
      name: 'Profit/Loss',
      value: activeAccount ? `$${activeAccount.profit.toFixed(2)}` : '$0.00',
      icon: activeAccount && activeAccount.profit >= 0 ? TrendingUp : TrendingDown,
      color: activeAccount && activeAccount.profit >= 0 ? 'text-green-500' : 'text-red-500',
      bg: activeAccount && activeAccount.profit >= 0 ? 'bg-green-500/10' : 'bg-red-500/10',
    },
    {
      name: 'Open Trades',
      value: positions.length,
      icon: TrendingUp,
      color: 'text-purple-500',
      bg: 'bg-purple-500/10',
    },
  ];

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Welcome back! Here's your trading overview.
            </p>
          </div>
          <div className="flex items-center space-x-4">
            {/* Auto-sync toggle */}
            <div className="flex items-center space-x-2">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoSync}
                  onChange={(e) => setAutoSync(e.target.checked)}
                  className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 dark:focus:ring-primary-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                />
                <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                  Auto-sync ({syncInterval}s)
                </span>
              </label>
            </div>
            
            {/* Manual sync button */}
            <button
              onClick={handleSync}
              disabled={syncing || !activeAccount}
              className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw size={18} className={syncing ? 'animate-spin' : ''} />
              <span>{syncing ? 'Syncing...' : 'Sync Now'}</span>
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat) => (
            <div
              key={stat.name}
              className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{stat.name}</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                    {stat.value}
                  </p>
                </div>
                <div className={`p-3 rounded-lg ${stat.bg}`}>
                  <stat.icon className={stat.color} size={24} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Account Info */}
        {activeAccount ? (
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Active MT5 Account
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Account Number</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {activeAccount.account_number}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Server</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {activeAccount.server}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Type</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white uppercase">
                  {activeAccount.account_type}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Status</p>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  activeAccount.is_connected
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                }`}>
                  {activeAccount.is_connected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 p-8 rounded-xl border border-gray-200 dark:border-gray-700 text-center">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              No MT5 account connected. Connect your account to start trading.
            </p>
            <a
              href="/dashboard/account"
              className="inline-block px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Connect MT5 Account
            </a>
          </div>
        )}

        {/* Open Positions */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Open Positions
            </h2>
            {autoSync && activeAccount && (
              <div className="flex items-center space-x-2 text-sm text-green-600 dark:text-green-400">
                <div className="w-2 h-2 bg-green-600 dark:bg-green-400 rounded-full animate-pulse"></div>
                <span>Live updates active</span>
              </div>
            )}
          </div>
          {positions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">
                      Ticket
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">
                      Broker
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">
                      Symbol
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">
                      Type
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">
                      Volume
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">
                      Open Price
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">
                      Current Price
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">
                      Profit
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {positions.map((position, index) => (
                    <tr key={index} className="border-b border-gray-200 dark:border-gray-700">
                      <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">
                        {position.ticket}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">
                        {(activeAccount as any)?.broker || activeAccount?.server || 'N/A'}
                      </td>
                      <td className="py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white">
                        {position.symbol}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          position.type === 'BUY'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                        }`}>
                          {position.type}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">
                        {position.volume}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">
                        {position.price_open?.toFixed(5) || 'N/A'}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">
                        {position.price_current?.toFixed(5) || 'N/A'}
                      </td>
                      <td className={`py-3 px-4 text-sm font-semibold ${
                        position.profit >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        ${position.profit?.toFixed(2) || '0.00'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-center text-gray-600 dark:text-gray-400 py-8">
              No open positions
            </p>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
