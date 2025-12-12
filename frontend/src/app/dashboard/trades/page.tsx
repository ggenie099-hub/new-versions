'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useStore } from '@/store/useStore';
import { tradeAPI, mt5API } from '@/lib/api';
import { wsManager } from '@/lib/websocket';
import { TrendingUp, TrendingDown, X, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

export default function TradesPage() {
  const { activeAccount, user } = useStore();
  const [trades, setTrades] = useState<any[]>([]);
  const [positions, setPositions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'open' | 'closed'>('all');

  useEffect(() => {
    loadTradesData();
  }, [filter]);

  // Live positions via WebSocket SYNC
  useEffect(() => {
    const onSync = (payload: any) => {
      if (payload && payload.positions) {
        setPositions(payload.positions);
      }
    };

    wsManager.on('sync', onSync);
    if (user?.api_key && activeAccount) {
      wsManager.syncAccount(user.api_key);
    }

    const interval = setInterval(() => {
      if (user?.api_key && activeAccount) {
        wsManager.syncAccount(user.api_key);
      }
    }, 5000);

    return () => {
      wsManager.off('sync', onSync);
      clearInterval(interval);
    };
  }, [user?.api_key, activeAccount]);

  const loadTradesData = async () => {
    try {
      setLoading(true);
      
      // Load trades
      const tradesRes = filter === 'open' 
        ? await tradeAPI.getOpenTrades()
        : await tradeAPI.getTrades(filter === 'closed' ? 'closed' : undefined);
      
      setTrades(tradesRes.data);

      // Load positions if there's an active account (HTTP fallback)
      if (activeAccount) {
        try {
          const positionsRes = await tradeAPI.syncPositions(activeAccount.id);
          setPositions(positionsRes.data?.positions || positionsRes.data || []);
        } catch (error) {
          console.error('Failed to load positions:', error);
        }
      }
    } catch (error) {
      console.error('Failed to load trades:', error);
      toast.error('Failed to load trades');
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      // Sync positions for all connected accounts
      if (activeAccount) {
        // Update DB records via HTTP
        await tradeAPI.syncPositions(activeAccount.id);
        // Request live positions via WebSocket
        if (user?.api_key) {
          wsManager.syncAccount(user.api_key);
        }
      }
      await loadTradesData();
      toast.success('Positions synced successfully');
    } catch (error) {
      toast.error('Failed to sync positions');
    } finally {
      setSyncing(false);
    }
  };

  const handleCloseTrade = async (tradeId: number) => {
    if (!confirm('Are you sure you want to close this trade?')) return;

    try {
      await tradeAPI.closeTrade(tradeId);
      toast.success('Trade closed successfully');
      loadTradesData();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to close trade');
    }
  };

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
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Trades</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Manage your open positions and view trade history
            </p>
          </div>
          <button
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw size={18} className={syncing ? 'animate-spin' : ''} />
            <span>{syncing ? 'Syncing...' : 'Sync Positions'}</span>
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex space-x-2 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 font-medium transition-colors ${
              filter === 'all'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            All Trades
          </button>
          <button
            onClick={() => setFilter('open')}
            className={`px-4 py-2 font-medium transition-colors ${
              filter === 'open'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Open Positions
          </button>
          <button
            onClick={() => setFilter('closed')}
            className={`px-4 py-2 font-medium transition-colors ${
              filter === 'closed'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Closed Trades
          </button>
        </div>

        {/* Current Positions (Live from MT5) */}
        {filter === 'open' && !activeAccount && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-300 p-4 rounded-lg">
            Connect and select an MT5 account to view live positions.
          </div>
        )}
        {filter === 'open' && activeAccount && positions.length === 0 && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300 p-4 rounded-lg">
            No open positions were found for the selected account.
          </div>
        )}
        {positions.length > 0 && filter === 'open' && (
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Current MT5 Positions
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">
                      Ticket
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
          </div>
        )}

        {/* Trades History */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            {filter === 'open' ? 'Open Positions' : filter === 'closed' ? 'Closed Trades' : 'All Trades'}
          </h2>
          
          {trades.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
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
                      Close Price
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">
                      Profit
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">
                      Status
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {trades.map((trade) => (
                    <tr key={trade.id} className="border-b border-gray-200 dark:border-gray-700">
                      <td className="py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white">
                        {trade.symbol}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          trade.order_type === 'BUY'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                        }`}>
                          {trade.order_type}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">
                        {trade.volume}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">
                        {trade.open_price.toFixed(5)}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">
                        {trade.close_price ? trade.close_price.toFixed(5) : '-'}
                      </td>
                      <td className={`py-3 px-4 text-sm font-semibold ${
                        trade.profit >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        ${trade.profit?.toFixed(2) || '0.00'}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          trade.status === 'open'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
                        }`}>
                          {trade.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {trade.status === 'open' && (
                          <button
                            onClick={() => handleCloseTrade(trade.id)}
                            className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            title="Close Trade"
                          >
                            <X size={18} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600 dark:text-gray-400">
                {filter === 'open' ? 'No open positions' : filter === 'closed' ? 'No closed trades' : 'No trades found'}
              </p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
