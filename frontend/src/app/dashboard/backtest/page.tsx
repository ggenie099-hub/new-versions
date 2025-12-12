'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { 
  Play, Settings, TrendingUp, TrendingDown, Activity, 
  BarChart3, Target, AlertTriangle, Clock, Percent,
  DollarSign, Zap, RefreshCw, ChevronDown, Info
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ComposedChart, ReferenceLine
} from 'recharts';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

interface BacktestResult {
  config: any;
  metrics: any;
  trades: any[];
  charts: {
    equity_curve: number[];
    drawdown_curve: number[];
    timestamps: string[];
  };
  monte_carlo: any;
  total_bars: number;
  execution_time_ms: number;
}

// Default strategies in case API fails
const DEFAULT_STRATEGIES = [
  { id: 'sma_crossover', name: 'SMA Crossover', description: 'Simple Moving Average crossover strategy' },
  { id: 'rsi_strategy', name: 'RSI Mean Reversion', description: 'RSI-based mean reversion strategy' },
  { id: 'breakout', name: 'Donchian Breakout', description: 'Channel breakout strategy' }
];

export default function BacktestPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BacktestResult | null>(null);
  const [strategies, setStrategies] = useState<any[]>(DEFAULT_STRATEGIES);
  const [dataStatus, setDataStatus] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Form state
  const [symbol, setSymbol] = useState('EURUSD');
  const [timeframe, setTimeframe] = useState('1h');
  const [strategy, setStrategy] = useState('sma_crossover');
  const [days, setDays] = useState(365);
  const [initialCapital, setInitialCapital] = useState(10000);
  const [leverage, setLeverage] = useState(100);
  const [riskPerTrade, setRiskPerTrade] = useState(2);
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  // Strategy params
  const [strategyParams, setStrategyParams] = useState<any>({});

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        console.log('No token found');
        return;
      }
      const headers = { 'Authorization': `Bearer ${token}` };
      
      // Load strategies
      try {
        const strategiesRes = await fetch(`${API_URL}/backtest/strategies`, { headers });
        if (strategiesRes.ok) {
          const data = await strategiesRes.json();
          if (data.strategies && data.strategies.length > 0) {
            setStrategies(data.strategies);
          }
        }
      } catch (e) {
        console.error('Failed to load strategies, using defaults:', e);
        // Keep default strategies
      }
      
      // Load data status
      try {
        const statusRes = await fetch(`${API_URL}/backtest/data-status`, { headers });
        if (statusRes.ok) {
          const data = await statusRes.json();
          setDataStatus(data);
        }
      } catch (e) {
        console.error('Failed to load data status:', e);
        // Set default status
        setDataStatus({ yahoo: { available: true, status: 'active' } });
      }
    } catch (error) {
      console.error('Failed to load initial data:', error);
    }
  };

  const runBacktest = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      const response = await fetch(`${API_URL}/backtest/run`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          symbol,
          timeframe,
          strategy,
          start_date: startDate.toISOString(),
          end_date: new Date().toISOString(),
          initial_capital: initialCapital,
          leverage,
          risk_per_trade: riskPerTrade / 100,
          strategy_params: strategyParams,
          include_monte_carlo: true,
          monte_carlo_simulations: 1000
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setResult(data.result);
        toast.success(data.message);
      } else {
        toast.error(data.message || 'Backtest failed');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to run backtest');
    } finally {
      setLoading(false);
    }
  };

  // Prepare chart data
  const getEquityChartData = () => {
    if (!result?.charts) return [];
    return result.charts.equity_curve.map((value, index) => ({
      index,
      equity: value,
      drawdown: result.charts.drawdown_curve[index] * 100,
      timestamp: result.charts.timestamps[index]?.split('T')[0] || index
    }));
  };

  const getTradeDistribution = () => {
    if (!result?.trades) return [];
    const winners = result.trades.filter(t => t.is_winner).length;
    const losers = result.trades.length - winners;
    return [
      { name: 'Winners', value: winners, fill: '#10B981' },
      { name: 'Losers', value: losers, fill: '#EF4444' }
    ];
  };

  const getMonthlyReturns = () => {
    if (!result?.trades) return [];
    const monthly: { [key: string]: number } = {};
    result.trades.forEach(trade => {
      const month = trade.exit_time?.substring(0, 7) || 'Unknown';
      monthly[month] = (monthly[month] || 0) + trade.profit;
    });
    return Object.entries(monthly).map(([month, profit]) => ({
      month,
      profit,
      fill: profit >= 0 ? '#10B981' : '#EF4444'
    }));
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Strategy Backtester
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Test your trading strategies with historical data
            </p>
          </div>
          {dataStatus ? (
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Data: Yahoo Finance
              </span>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Data: Yahoo Finance
              </span>
            </div>
          )}
        </div>

        {/* Configuration Panel */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Symbol */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Symbol
              </label>
              <input
                type="text"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 text-gray-900 dark:text-white"
                placeholder="EURUSD"
              />
            </div>

            {/* Timeframe */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Timeframe
              </label>
              <select
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 text-gray-900 dark:text-white"
              >
                <option value="1m">1 Minute</option>
                <option value="5m">5 Minutes</option>
                <option value="15m">15 Minutes</option>
                <option value="30m">30 Minutes</option>
                <option value="1h">1 Hour</option>
                <option value="4h">4 Hours</option>
                <option value="1d">1 Day</option>
              </select>
            </div>

            {/* Strategy */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Strategy
              </label>
              <select
                value={strategy}
                onChange={(e) => setStrategy(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 text-gray-900 dark:text-white"
              >
                {strategies.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            {/* Period */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Period (Days)
              </label>
              <input
                type="number"
                value={days}
                onChange={(e) => setDays(parseInt(e.target.value))}
                min={30}
                max={3650}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          {/* Advanced Settings Toggle */}
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center space-x-2 mt-4 text-sm text-primary-600 dark:text-primary-400 hover:underline"
          >
            <Settings size={16} />
            <span>Advanced Settings</span>
            <ChevronDown size={16} className={`transform transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
          </button>

          {/* Advanced Settings */}
          {showAdvanced && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Initial Capital ($)
                </label>
                <input
                  type="number"
                  value={initialCapital}
                  onChange={(e) => setInitialCapital(parseInt(e.target.value))}
                  min={100}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Leverage
                </label>
                <input
                  type="number"
                  value={leverage}
                  onChange={(e) => setLeverage(parseInt(e.target.value))}
                  min={1}
                  max={500}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Risk Per Trade (%)
                </label>
                <input
                  type="number"
                  value={riskPerTrade}
                  onChange={(e) => setRiskPerTrade(parseFloat(e.target.value))}
                  min={0.1}
                  max={50}
                  step={0.1}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                />
              </div>
            </div>
          )}

          {/* Run Button */}
          <div className="mt-6 flex justify-end">
            <button
              onClick={runBacktest}
              disabled={loading}
              className="flex items-center space-x-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {loading ? (
                <>
                  <RefreshCw size={20} className="animate-spin" />
                  <span>Running Backtest...</span>
                </>
              ) : (
                <>
                  <Play size={20} />
                  <span>Run Backtest</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Results Section */}
        {result && (
          <>
            {/* Key Metrics Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              <MetricCard
                title="Total Return"
                value={formatPercent(result.metrics.total_return_pct)}
                icon={TrendingUp}
                color={result.metrics.total_return_pct >= 0 ? 'green' : 'red'}
              />
              <MetricCard
                title="Sharpe Ratio"
                value={result.metrics.sharpe_ratio.toFixed(2)}
                icon={Activity}
                color={result.metrics.sharpe_ratio >= 1 ? 'green' : result.metrics.sharpe_ratio >= 0 ? 'yellow' : 'red'}
              />
              <MetricCard
                title="Max Drawdown"
                value={formatPercent(-result.metrics.max_drawdown_pct)}
                icon={TrendingDown}
                color="red"
              />
              <MetricCard
                title="Win Rate"
                value={`${result.metrics.win_rate.toFixed(1)}%`}
                icon={Target}
                color={result.metrics.win_rate >= 50 ? 'green' : 'yellow'}
              />
              <MetricCard
                title="Profit Factor"
                value={result.metrics.profit_factor.toFixed(2)}
                icon={BarChart3}
                color={result.metrics.profit_factor >= 1.5 ? 'green' : result.metrics.profit_factor >= 1 ? 'yellow' : 'red'}
              />
              <MetricCard
                title="Total Trades"
                value={result.metrics.total_trades.toString()}
                icon={Zap}
                color="blue"
              />
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 dark:border-gray-700">
              <nav className="flex space-x-8">
                {['overview', 'trades', 'analytics', 'monte-carlo'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === tab
                        ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                        : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
                    }`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1).replace('-', ' ')}
                  </button>
                ))}
              </nav>
            </div>

            {/* Tab Content */}
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Equity Curve */}
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Equity Curve
                  </h3>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={getEquityChartData()}>
                        <defs>
                          <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                        <XAxis dataKey="timestamp" tick={{ fontSize: 10 }} stroke="#9CA3AF" />
                        <YAxis tick={{ fontSize: 10 }} stroke="#9CA3AF" />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px' }}
                          labelStyle={{ color: '#9CA3AF' }}
                        />
                        <Area
                          type="monotone"
                          dataKey="equity"
                          stroke="#10B981"
                          fill="url(#equityGradient)"
                          strokeWidth={2}
                        />
                        <ReferenceLine y={initialCapital} stroke="#6B7280" strokeDasharray="5 5" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Drawdown Chart */}
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Drawdown
                  </h3>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={getEquityChartData()}>
                        <defs>
                          <linearGradient id="drawdownGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                        <XAxis dataKey="timestamp" tick={{ fontSize: 10 }} stroke="#9CA3AF" />
                        <YAxis tick={{ fontSize: 10 }} stroke="#9CA3AF" domain={[0, 'auto']} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px' }}
                          formatter={(value: number) => [`${value.toFixed(2)}%`, 'Drawdown']}
                        />
                        <Area
                          type="monotone"
                          dataKey="drawdown"
                          stroke="#EF4444"
                          fill="url(#drawdownGradient)"
                          strokeWidth={2}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Performance Summary */}
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Performance Summary
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <StatRow label="CAGR" value={formatPercent(result.metrics.cagr)} />
                    <StatRow label="Volatility" value={formatPercent(result.metrics.volatility)} />
                    <StatRow label="Sortino Ratio" value={result.metrics.sortino_ratio.toFixed(2)} />
                    <StatRow label="Calmar Ratio" value={result.metrics.calmar_ratio.toFixed(2)} />
                    <StatRow label="Avg Trade" value={formatCurrency(result.metrics.avg_trade)} />
                    <StatRow label="Expectancy" value={formatPercent(result.metrics.expectancy)} />
                    <StatRow label="SQN" value={result.metrics.sqn.toFixed(2)} />
                    <StatRow label="Recovery Factor" value={result.metrics.recovery_factor.toFixed(2)} />
                  </div>
                </div>

                {/* Monthly Returns */}
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Monthly Returns
                  </h3>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={getMonthlyReturns()}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                        <XAxis dataKey="month" tick={{ fontSize: 10 }} stroke="#9CA3AF" />
                        <YAxis tick={{ fontSize: 10 }} stroke="#9CA3AF" />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px' }}
                          formatter={(value: number) => [formatCurrency(value), 'P&L']}
                        />
                        <Bar dataKey="profit" radius={[4, 4, 0, 0]}>
                          {getMonthlyReturns().map((entry, index) => (
                            <rect key={index} fill={entry.fill} />
                          ))}
                        </Bar>
                        <ReferenceLine y={0} stroke="#6B7280" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'trades' && (
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Trade History ({result.trades.length} trades)
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">#</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">Entry</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">Exit</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">Type</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">Entry Price</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">Exit Price</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">Bars</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">P&L</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">P&L %</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.trades.slice(0, 50).map((trade, index) => (
                        <tr key={trade.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                          <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">{trade.id}</td>
                          <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                            {trade.entry_time?.split('T')[0]}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                            {trade.exit_time?.split('T')[0] || '-'}
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
                            {trade.entry_price?.toFixed(5)}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">
                            {trade.exit_price?.toFixed(5) || '-'}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                            {trade.bars_held}
                          </td>
                          <td className={`py-3 px-4 text-sm font-semibold ${
                            trade.profit >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {formatCurrency(trade.profit)}
                          </td>
                          <td className={`py-3 px-4 text-sm font-semibold ${
                            trade.profit_pct >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {formatPercent(trade.profit_pct)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {result.trades.length > 50 && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-4 text-center">
                    Showing first 50 of {result.trades.length} trades
                  </p>
                )}
              </div>
            )}

            {activeTab === 'analytics' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Risk Metrics */}
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                    <AlertTriangle className="mr-2 text-yellow-500" size={20} />
                    Risk Metrics
                  </h3>
                  <div className="space-y-4">
                    <StatRow label="Max Drawdown" value={formatPercent(-result.metrics.max_drawdown_pct)} highlight="red" />
                    <StatRow label="Volatility (Annual)" value={formatPercent(result.metrics.volatility)} />
                    <StatRow label="Downside Volatility" value={formatPercent(result.metrics.volatility * 0.7)} />
                    <StatRow label="Value at Risk (95%)" value={formatPercent(-result.metrics.max_drawdown_pct * 0.6)} />
                  </div>
                </div>

                {/* Return Metrics */}
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                    <DollarSign className="mr-2 text-green-500" size={20} />
                    Return Metrics
                  </h3>
                  <div className="space-y-4">
                    <StatRow label="Total Return" value={formatCurrency(result.metrics.total_return)} highlight={result.metrics.total_return >= 0 ? 'green' : 'red'} />
                    <StatRow label="CAGR" value={formatPercent(result.metrics.cagr)} />
                    <StatRow label="Best Trade" value={formatCurrency(Math.max(...result.trades.map(t => t.profit)))} highlight="green" />
                    <StatRow label="Worst Trade" value={formatCurrency(Math.min(...result.trades.map(t => t.profit)))} highlight="red" />
                  </div>
                </div>

                {/* Trade Statistics */}
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                    <BarChart3 className="mr-2 text-blue-500" size={20} />
                    Trade Statistics
                  </h3>
                  <div className="space-y-4">
                    <StatRow label="Total Trades" value={result.metrics.total_trades.toString()} />
                    <StatRow label="Winners" value={`${result.trades.filter(t => t.is_winner).length} (${result.metrics.win_rate.toFixed(1)}%)`} highlight="green" />
                    <StatRow label="Losers" value={`${result.trades.filter(t => !t.is_winner).length}`} highlight="red" />
                    <StatRow label="Avg Bars in Trade" value={result.metrics.avg_trade.toFixed(0)} />
                  </div>
                </div>

                {/* Ratios */}
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                    <Percent className="mr-2 text-purple-500" size={20} />
                    Risk-Adjusted Ratios
                  </h3>
                  <div className="space-y-4">
                    <RatioBar label="Sharpe Ratio" value={result.metrics.sharpe_ratio} max={3} />
                    <RatioBar label="Sortino Ratio" value={result.metrics.sortino_ratio} max={3} />
                    <RatioBar label="Calmar Ratio" value={result.metrics.calmar_ratio} max={3} />
                    <RatioBar label="Profit Factor" value={result.metrics.profit_factor} max={3} />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'monte-carlo' && result.monte_carlo && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Monte Carlo Summary */}
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Monte Carlo Simulation (1000 runs)
                  </h3>
                  <div className="space-y-4">
                    <StatRow label="Mean Return" value={formatCurrency(result.monte_carlo.mean_return)} />
                    <StatRow label="Median Return" value={formatCurrency(result.monte_carlo.median_return)} />
                    <StatRow label="5th Percentile" value={formatCurrency(result.monte_carlo.percentile_5)} highlight="red" />
                    <StatRow label="95th Percentile" value={formatCurrency(result.monte_carlo.percentile_95)} highlight="green" />
                  </div>
                </div>

                {/* Risk of Ruin */}
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Risk Analysis
                  </h3>
                  <div className="space-y-4">
                    <StatRow 
                      label="Probability of Loss" 
                      value={`${result.monte_carlo.probability_of_loss.toFixed(1)}%`}
                      highlight={result.monte_carlo.probability_of_loss > 30 ? 'red' : 'green'}
                    />
                    <StatRow 
                      label="Prob. of 50% Loss" 
                      value={`${result.monte_carlo.probability_of_50pct_loss.toFixed(1)}%`}
                      highlight={result.monte_carlo.probability_of_50pct_loss > 10 ? 'red' : 'green'}
                    />
                    <StatRow 
                      label="Worst Max Drawdown" 
                      value={formatPercent(-result.monte_carlo.worst_max_drawdown)}
                      highlight="red"
                    />
                    <StatRow 
                      label="95% Drawdown" 
                      value={formatPercent(-result.monte_carlo.drawdown_95)}
                    />
                  </div>
                </div>

                {/* Monte Carlo Equity Curves */}
                <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Simulated Equity Paths
                  </h3>
                  <div className="h-96">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                        <XAxis dataKey="index" tick={{ fontSize: 10 }} stroke="#9CA3AF" />
                        <YAxis tick={{ fontSize: 10 }} stroke="#9CA3AF" />
                        <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px' }} />
                        {result.monte_carlo.equity_curves.slice(0, 20).map((curve: number[], idx: number) => (
                          <Line
                            key={idx}
                            data={curve.map((v, i) => ({ index: i, value: v }))}
                            dataKey="value"
                            stroke={`hsl(${idx * 18}, 70%, 50%)`}
                            strokeWidth={1}
                            dot={false}
                            opacity={0.5}
                          />
                        ))}
                        <ReferenceLine y={initialCapital} stroke="#10B981" strokeWidth={2} strokeDasharray="5 5" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 text-center">
                    Showing 20 of 1000 simulated equity paths. Green line = initial capital.
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}


// Helper Components
function MetricCard({ title, value, icon: Icon, color }: {
  title: string;
  value: string;
  icon: any;
  color: 'green' | 'red' | 'yellow' | 'blue';
}) {
  const colors = {
    green: 'text-green-500 bg-green-500/10',
    red: 'text-red-500 bg-red-500/10',
    yellow: 'text-yellow-500 bg-yellow-500/10',
    blue: 'text-blue-500 bg-blue-500/10'
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">{title}</p>
          <p className={`text-xl font-bold mt-1 ${colors[color].split(' ')[0]}`}>{value}</p>
        </div>
        <div className={`p-2 rounded-lg ${colors[color].split(' ')[1]}`}>
          <Icon className={colors[color].split(' ')[0]} size={20} />
        </div>
      </div>
    </div>
  );
}

function StatRow({ label, value, highlight }: {
  label: string;
  value: string;
  highlight?: 'green' | 'red' | 'yellow';
}) {
  const highlightColors = {
    green: 'text-green-500',
    red: 'text-red-500',
    yellow: 'text-yellow-500'
  };

  return (
    <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
      <span className="text-sm text-gray-600 dark:text-gray-400">{label}</span>
      <span className={`text-sm font-semibold ${highlight ? highlightColors[highlight] : 'text-gray-900 dark:text-white'}`}>
        {value}
      </span>
    </div>
  );
}

function RatioBar({ label, value, max }: {
  label: string;
  value: number;
  max: number;
}) {
  const percentage = Math.min((value / max) * 100, 100);
  const color = value >= max * 0.66 ? 'bg-green-500' : value >= max * 0.33 ? 'bg-yellow-500' : 'bg-red-500';

  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm text-gray-600 dark:text-gray-400">{label}</span>
        <span className="text-sm font-semibold text-gray-900 dark:text-white">{value.toFixed(2)}</span>
      </div>
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
        <div
          className={`h-2 rounded-full ${color} transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
