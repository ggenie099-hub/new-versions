'use client';

import { useEffect, useState, useCallback } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useStore } from '@/store/useStore';
import { mt5API, tradeAPI, analyticsAPI } from '@/lib/api';
import { Activity, DollarSign, TrendingUp, TrendingDown, RefreshCw, Brain } from 'lucide-react';
import toast from 'react-hot-toast';

// Analytics Components
import {
  MarketRegimeCard,
  TradeReadinessMeter,
  RiskStatusCard,
  SessionIntelligenceCard,
  MarketNarrativeCard,
  TradeBlockerCard,
  TradeQualityCard,
  StrategyHealthCard,
} from '@/components/analytics';

// Analytics data type
interface AnalyticsData {
  market_regime: any;
  trade_readiness: any;
  risk_status: any;
  session_intelligence: any;
  market_narrative: any;
  trade_blocker: any;
  trade_qualities: any[];
  strategy_health: any[];
}

export default function DashboardPage() {
  const { activeAccount, setActiveAccount, trades, setTrades } = useStore();
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [positions, setPositions] = useState<any[]>([]);
  const [mt5Accounts, setMT5Accounts] = useState<any[]>([]);
  const [autoSync, setAutoSync] = useState(true);
  const [syncInterval, setSyncInterval] = useState(10);
  
  // Analytics state
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [selectedSymbol, setSelectedSymbol] = useState('EURUSD');

  // Load analytics data
  const loadAnalytics = useCallback(async (showLoading = true) => {
    if (!activeAccount?.is_connected) return;
    
    if (showLoading && !analytics) {
      setAnalyticsLoading(true);
    }
    try {
      const response = await analyticsAPI.getFullAnalytics(selectedSymbol);
      setAnalytics(response.data);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      if (showLoading) {
        setAnalyticsLoading(false);
      }
    }
  }, [activeAccount, selectedSymbol, analytics]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Load analytics when account connects
  useEffect(() => {
    if (activeAccount?.is_connected) {
      loadAnalytics();
    }
  }, [activeAccount?.is_connected, loadAnalytics]);

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
        
        try {
          const positionsRes = await tradeAPI.syncPositions(connectedAccount.id);
          const positionsData = positionsRes.data.positions || [];
          setPositions(positionsData);
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
      const accountRes = await mt5API.syncAccount(activeAccount.id);
      if (accountRes.data.account) {
        setActiveAccount(accountRes.data.account);
      }
      
      const positionsRes = await tradeAPI.syncPositions(activeAccount.id);
      const positionsData = positionsRes.data.positions || [];
      setPositions(positionsData);
      
      // Also refresh analytics silently (no loading indicator)
      if (activeAccount.is_connected) {
        loadAnalytics(false);
      }
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
      await mt5API.syncAccount(activeAccount.id);
      
      const positionsRes = await tradeAPI.syncPositions(activeAccount.id);
      const positionsData = positionsRes.data.positions || [];
      setPositions(positionsData);
      
      await loadDashboardData();
      await loadAnalytics();
      
      toast.success(`Synced successfully. ${positionsData.length} position(s) found.`);
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
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <Brain className="text-purple-500" size={32} />
              AI Trading Intelligence
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Real-time market analysis and trade decision support
            </p>
          </div>
          <div className="flex items-center space-x-4">
            {/* Symbol Selector */}
            <select
              value={selectedSymbol}
              onChange={(e) => setSelectedSymbol(e.target.value)}
              className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
            >
              <option value="EURUSD">EURUSD</option>
              <option value="GBPUSD">GBPUSD</option>
              <option value="USDJPY">USDJPY</option>
              <option value="XAUUSD">XAUUSD</option>
              <option value="BTCUSD">BTCUSD</option>
            </select>
            
            {/* Auto-sync toggle */}
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={autoSync}
                onChange={(e) => setAutoSync(e.target.checked)}
                className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                Auto ({syncInterval}s)
              </span>
            </label>
            
            <button
              onClick={handleSync}
              disabled={syncing || !activeAccount}
              className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
            >
              <RefreshCw size={18} className={syncing ? 'animate-spin' : ''} />
              <span>{syncing ? 'Syncing...' : 'Sync'}</span>
            </button>
          </div>
        </div>

        {/* Trade Blocker Alert - Always visible at top if blocked */}
        {analytics?.trade_blocker && (
          <TradeBlockerCard data={analytics.trade_blocker} loading={analyticsLoading} />
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <div
              key={stat.name}
              className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700"
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

        {/* AI Analytics Section */}
        {activeAccount?.is_connected ? (
          <>
            {/* Row 1: Market Regime + Trade Readiness */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <MarketRegimeCard data={analytics?.market_regime} loading={analyticsLoading} />
              <TradeReadinessMeter data={analytics?.trade_readiness} loading={analyticsLoading} />
            </div>

            {/* Row 2: Risk Status + Session Intelligence */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <RiskStatusCard data={analytics?.risk_status} loading={analyticsLoading} />
              <SessionIntelligenceCard data={analytics?.session_intelligence} loading={analyticsLoading} />
            </div>

            {/* Row 3: AI Market Narrative - Full Width */}
            <MarketNarrativeCard data={analytics?.market_narrative} loading={analyticsLoading} />

            {/* Row 4: Trade Quality + Strategy Health */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <TradeQualityCard data={analytics?.trade_qualities || []} loading={analyticsLoading} />
              <StrategyHealthCard data={analytics?.strategy_health || []} loading={analyticsLoading} />
            </div>
          </>
        ) : (
          <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 p-8 rounded-xl border border-purple-500/20 text-center">
            <Brain size={48} className="mx-auto text-purple-500 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              AI Analytics Available
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Connect your MT5 account to unlock AI-powered market analysis and trade decision support.
            </p>
            <a
              href="/dashboard/account"
              className="inline-block px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Connect MT5 Account
            </a>
          </div>
        )}

        {/* Account Info */}
        {activeAccount && (
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
        )}

        {/* Open Positions Table */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Open Positions
            </h2>
            {autoSync && activeAccount && (
              <div className="flex items-center space-x-2 text-sm text-green-600 dark:text-green-400">
                <div className="w-2 h-2 bg-green-600 dark:bg-green-400 rounded-full animate-pulse"></div>
                <span>Live updates</span>
              </div>
            )}
          </div>
          {positions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">Ticket</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">Symbol</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">Type</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">Volume</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">Open</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">Current</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">Profit</th>
                  </tr>
                </thead>
                <tbody>
                  {positions.map((position, index) => (
                    <tr key={index} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">{position.ticket}</td>
                      <td className="py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white">{position.symbol}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          position.type === 'BUY'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                        }`}>
                          {position.type}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">{position.volume}</td>
                      <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">{position.price_open?.toFixed(5)}</td>
                      <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">{position.price_current?.toFixed(5)}</td>
                      <td className={`py-3 px-4 text-sm font-semibold ${position.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ${position.profit?.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-center text-gray-600 dark:text-gray-400 py-8">No open positions</p>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
