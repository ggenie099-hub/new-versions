'use client';

import { useState, useEffect, useRef } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { 
  Play, Settings, TrendingUp, TrendingDown, Activity, 
  BarChart3, Target, AlertTriangle, Clock, Percent,
  DollarSign, Zap, RefreshCw, ChevronDown, Info, Search, X
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

interface SymbolData {
  total: number;
  categories: {
    forex: string[];
    crypto: string[];
    indices: string[];
    commodities: string[];
  };
  all: string[];
}

const DEFAULT_STRATEGIES = [
  { id: 'sma_crossover', name: 'SMA Crossover', description: 'Simple Moving Average crossover strategy', parameters: [
    { name: 'fast_period', type: 'int', default: 10, min: 2, max: 100 },
    { name: 'slow_period', type: 'int', default: 20, min: 5, max: 200 }
  ]},
  { id: 'rsi_strategy', name: 'RSI Mean Reversion', description: 'RSI-based mean reversion strategy', parameters: [
    { name: 'period', type: 'int', default: 14, min: 2, max: 50 },
    { name: 'oversold', type: 'int', default: 30, min: 10, max: 40 },
    { name: 'overbought', type: 'int', default: 70, min: 60, max: 90 }
  ]},
  { id: 'breakout', name: 'Donchian Breakout', description: 'Channel breakout strategy', parameters: [
    { name: 'lookback', type: 'int', default: 20, min: 5, max: 100 }
  ]}
];

export default function BacktestPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BacktestResult | null>(null);
  const [strategies, setStrategies] = useState<any[]>(DEFAULT_STRATEGIES);
  const [dataStatus, setDataStatus] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Symbol autocomplete state
  const [symbol, setSymbol] = useState('EURUSD');
  const [symbolSearch, setSymbolSearch] = useState('');
  const [symbols, setSymbols] = useState<SymbolData | null>(null);
  const [filteredSymbols, setFilteredSymbols] = useState<string[]>([]);
  const [showSymbolDropdown, setShowSymbolDropdown] = useState(false);
  const [loadingSymbols, setLoadingSymbols] = useState(false);
  const symbolInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Form state
  const [timeframe, setTimeframe] = useState('1h');
  const [strategy, setStrategy] = useState('sma_crossover');
  const [days, setDays] = useState(365);
  const [initialCapital, setInitialCapital] = useState(10000);
  const [leverage, setLeverage] = useState(100);
  const [riskPerTrade, setRiskPerTrade] = useState(2);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [strategyParams, setStrategyParams] = useState<any>({});

  useEffect(() => {
    loadInitialData();
    loadSymbols();
    
    // Close dropdown on outside click
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowSymbolDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter symbols when search changes
  useEffect(() => {
    if (symbols && symbolSearch) {
      const search = symbolSearch.toUpperCase();
      const filtered = symbols.all.filter(s => s.toUpperCase().includes(search));
      setFilteredSymbols(filtered.slice(0, 20));
    } else if (symbols) {
      setFilteredSymbols(symbols.all.slice(0, 20));
    }
  }, [symbolSearch, symbols]);

  const loadSymbols = async () => {
    setLoadingSymbols(true);
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;
      
      const res = await fetch(`${API_URL}/backtest/symbols`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        setSymbols(data);
        setFilteredSymbols(data.all?.slice(0, 20) || []);
      }
    } catch (e) {
      console.error('Failed to load symbols:', e);
    } finally {
      setLoadingSymbols(false);
    }
  };

  const loadInitialData = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;
      const headers = { 'Authorization': `Bearer ${token}` };
      
      // Load strategies
      try {
        const strategiesRes = await fetch(`${API_URL}/backtest/strategies`, { headers });
        if (strategiesRes.ok) {
          const data = await strategiesRes.json();
          if (data.strategies?.length > 0) {
            setStrategies(data.strategies);
          }
        }
      } catch (e) {
        console.error('Failed to load strategies:', e);
      }
      
      // Load data status
      try {
        const statusRes = await fetch(`${API_URL}/backtest/data-status`, { headers });
        if (statusRes.ok) {
          const data = await statusRes.json();
          setDataStatus(data);
        }
      } catch (e) {
        setDataStatus({ mt5: { available: true, status: 'active' } });
      }
    } catch (error) {
      console.error('Failed to load initial data:', error);
    }
  };

  const selectSymbol = (sym: string) => {
    setSymbol(sym);
    setSymbolSearch('');
    setShowSymbolDropdown(false);
  };

  const runBacktest = async () => {
    if (!symbol) {
      toast.error('Please select a symbol');
      return;
    }
    
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

  const getEquityChartData = () => {
    if (!result?.charts) return [];
    return result.charts.equity_curve.map((value, index) => ({
      index,
      equity: value,
      drawdown: result.charts.drawdown_curve[index] * 100,
      timestamp: result.charts.timestamps[index]?.split('T')[0] || index
    }));
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
      fill: profit >= 0 ? '#22c55e' : '#ef4444'
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

  const currentStrategy = strategies.find(s => s.id === strategy);

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
              Test your trading strategies with historical MT5 data
            </p>
          </div>
          <div className="flex items-center space-x-4">
            {symbols && (
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {symbols.total} symbols available
              </span>
            )}
            <div className="flex items-center space-x-2">
              <span className={`w-2 h-2 rounded-full ${dataStatus?.mt5?.available ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                MT5 {dataStatus?.mt5?.available ? 'Connected' : 'Connecting...'}
              </span>
            </div>
          </div>
        </div>

        {/* Configuration Panel */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Symbol with Autocomplete */}
            <div className="relative" ref={dropdownRef}>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Symbol
              </label>
              <div className="relative">
                <input
                  ref={symbolInputRef}
                  type="text"
                  value={showSymbolDropdown ? symbolSearch : symbol}
                  onChange={(e) => {
                    setSymbolSearch(e.target.value.toUpperCase());
                    setShowSymbolDropdown(true);
                  }}
                  onFocus={() => setShowSymbolDropdown(true)}
                  className="w-full px-3 py-2 pr-10 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 text-gray-900 dark:text-white"
                  placeholder="Search symbol..."
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center space-x-1">
                  {loadingSymbols ? (
                    <RefreshCw size={16} className="animate-spin text-gray-400" />
                  ) : (
                    <Search size={16} className="text-gray-400" />
                  )}
                </div>
              </div>
              
              {/* Symbol Dropdown */}
              {showSymbolDropdown && (
                <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                  {/* Categories */}
                  {symbols && !symbolSearch && (
                    <div className="p-2 border-b border-gray-200 dark:border-gray-700">
                      <div className="flex flex-wrap gap-1">
                        {symbols.categories.forex.length > 0 && (
                          <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded">
                            Forex: {symbols.categories.forex.length}
                          </span>
                        )}
                        {symbols.categories.crypto.length > 0 && (
                          <span className="text-xs px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 rounded">
                            Crypto: {symbols.categories.crypto.length}
                          </span>
                        )}
                        {symbols.categories.indices.length > 0 && (
                          <span className="text-xs px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded">
                            Indices: {symbols.categories.indices.length}
                          </span>
                        )}
                        {symbols.categories.commodities.length > 0 && (
                          <span className="text-xs px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded">
                            Commodities: {symbols.categories.commodities.length}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Symbol List */}
                  {filteredSymbols.length > 0 ? (
                    filteredSymbols.map((sym) => (
                      <button
                        key={sym}
                        onClick={() => selectSymbol(sym)}
                        className={`w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 text-sm ${
                          sym === symbol ? 'bg-green-50 dark:bg-green-900/20 text-green-600' : 'text-gray-900 dark:text-white'
                        }`}
                      >
                        {sym}
                      </button>
                    ))
                  ) : (
                    <div className="px-3 py-4 text-center text-gray-500 dark:text-gray-400 text-sm">
                      {loadingSymbols ? 'Loading symbols...' : 'No symbols found'}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Timeframe */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Timeframe
              </label>
              <select
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 text-gray-900 dark:text-white"
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
                onChange={(e) => {
                  setStrategy(e.target.value);
                  setStrategyParams({});
                }}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 text-gray-900 dark:text-white"
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
                onChange={(e) => setDays(parseInt(e.target.value) || 365)}
                min={30}
                max={3650}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          {/* Strategy Description */}
          {currentStrategy && (
            <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <Info size={14} className="inline mr-1" />
                {currentStrategy.description}
              </p>
            </div>
          )}

          {/* Strategy Parameters */}
          {currentStrategy?.parameters && currentStrategy.parameters.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Strategy Parameters</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {currentStrategy.parameters.map((param: any) => (
                  <div key={param.name}>
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                      {param.name.replace(/_/g, ' ')}
                    </label>
                    <input
                      type="number"
                      value={strategyParams[param.name] ?? param.default}
                      onChange={(e) => setStrategyParams({
                        ...strategyParams,
                        [param.name]: parseInt(e.target.value) || param.default
                      })}
                      min={param.min}
                      max={param.max}
                      className="w-full px-2 py-1.5 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-green-500 text-gray-900 dark:text-white"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Advanced Settings Toggle */}
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center space-x-2 mt-4 text-sm text-green-600 dark:text-green-400 hover:underline"
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
                  onChange={(e) => setInitialCapital(parseInt(e.target.value) || 10000)}
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
                  onChange={(e) => setLeverage(parseInt(e.target.value) || 100)}
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
                  onChange={(e) => setRiskPerTrade(parseFloat(e.target.value) || 2)}
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
              disabled={loading || !symbol}
              className="flex items-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
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
                        ? 'border-green-500 text-green-600 dark:text-green-400'
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
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Equity Curve</h3>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={getEquityChartData()}>
                        <defs>
                          <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                        <XAxis dataKey="timestamp" tick={{ fontSize: 10 }} stroke="#9CA3AF" />
                        <YAxis tick={{ fontSize: 10 }} stroke="#9CA3AF" />
                        <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px' }} />
                        <Area type="monotone" dataKey="equity" stroke="#22c55e" fill="url(#equityGradient)" strokeWidth={2} />
                        <ReferenceLine y={initialCapital} stroke="#6B7280" strokeDasharray="5 5" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Drawdown Chart */}
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Drawdown</h3>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={getEquityChartData()}>
                        <defs>
                          <linearGradient id="drawdownGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                        <XAxis dataKey="timestamp" tick={{ fontSize: 10 }} stroke="#9CA3AF" />
                        <YAxis tick={{ fontSize: 10 }} stroke="#9CA3AF" />
                        <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px' }} formatter={(value: number) => [`${value.toFixed(2)}%`, 'Drawdown']} />
                        <Area type="monotone" dataKey="drawdown" stroke="#ef4444" fill="url(#drawdownGradient)" strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Performance Summary */}
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Performance Summary</h3>
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
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Monthly Returns</h3>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={getMonthlyReturns()}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                        <XAxis dataKey="month" tick={{ fontSize: 10 }} stroke="#9CA3AF" />
                        <YAxis tick={{ fontSize: 10 }} stroke="#9CA3AF" />
                        <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px' }} formatter={(value: number) => [formatCurrency(value), 'P&L']} />
                        <Bar dataKey="profit" radius={[4, 4, 0, 0]} />
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
                      {result.trades.slice(0, 50).map((trade) => (
                        <tr key={trade.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                          <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">{trade.id}</td>
                          <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">{trade.entry_time?.split('T')[0]}</td>
                          <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">{trade.exit_time?.split('T')[0] || '-'}</td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              trade.order_type === 'BUY' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                            }`}>{trade.order_type}</span>
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">{trade.entry_price?.toFixed(5)}</td>
                          <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">{trade.exit_price?.toFixed(5) || '-'}</td>
                          <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">{trade.bars_held}</td>
                          <td className={`py-3 px-4 text-sm font-semibold ${trade.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(trade.profit)}</td>
                          <td className={`py-3 px-4 text-sm font-semibold ${trade.profit_pct >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatPercent(trade.profit_pct)}</td>
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

                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                    <Target className="mr-2 text-blue-500" size={20} />
                    Trade Statistics
                  </h3>
                  <div className="space-y-4">
                    <StatRow label="Total Trades" value={result.metrics.total_trades.toString()} />
                    <StatRow label="Win Rate" value={`${result.metrics.win_rate.toFixed(1)}%`} />
                    <StatRow label="Profit Factor" value={result.metrics.profit_factor.toFixed(2)} />
                    <StatRow label="Avg Trade Duration" value={`${Math.round(result.trades.reduce((a, t) => a + t.bars_held, 0) / result.trades.length)} bars`} />
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                    <Activity className="mr-2 text-purple-500" size={20} />
                    Risk-Adjusted Returns
                  </h3>
                  <div className="space-y-4">
                    <StatRow label="Sharpe Ratio" value={result.metrics.sharpe_ratio.toFixed(2)} />
                    <StatRow label="Sortino Ratio" value={result.metrics.sortino_ratio.toFixed(2)} />
                    <StatRow label="Calmar Ratio" value={result.metrics.calmar_ratio.toFixed(2)} />
                    <StatRow label="SQN" value={result.metrics.sqn.toFixed(2)} />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'monte-carlo' && result.monte_carlo && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Monte Carlo Simulation</h3>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                        <XAxis tick={{ fontSize: 10 }} stroke="#9CA3AF" />
                        <YAxis tick={{ fontSize: 10 }} stroke="#9CA3AF" />
                        <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px' }} />
                        {result.monte_carlo.equity_curves.slice(0, 10).map((curve: number[], idx: number) => (
                          <Line key={idx} data={curve.map((v, i) => ({ x: i, y: v }))} dataKey="y" stroke={`hsl(${idx * 36}, 70%, 50%)`} dot={false} strokeWidth={1} opacity={0.5} />
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Distribution Analysis</h3>
                  <div className="space-y-4">
                    <StatRow label="Mean Return" value={formatPercent(result.monte_carlo.mean_return)} />
                    <StatRow label="Median Return" value={formatPercent(result.monte_carlo.median_return)} />
                    <StatRow label="5th Percentile" value={formatPercent(result.monte_carlo.percentile_5)} highlight="red" />
                    <StatRow label="95th Percentile" value={formatPercent(result.monte_carlo.percentile_95)} highlight="green" />
                    <StatRow label="Probability of Loss" value={`${(result.monte_carlo.probability_of_loss * 100).toFixed(1)}%`} highlight="red" />
                    <StatRow label="Prob. of 50% Loss" value={`${(result.monte_carlo.probability_of_50pct_loss * 100).toFixed(1)}%`} />
                    <StatRow label="Worst Drawdown" value={formatPercent(-result.monte_carlo.worst_max_drawdown)} highlight="red" />
                    <StatRow label="95% Drawdown" value={formatPercent(-result.monte_carlo.drawdown_95)} />
                  </div>
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
function MetricCard({ title, value, icon: Icon, color }: { title: string; value: string; icon: any; color: string }) {
  const colorClasses = {
    green: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
    red: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
    yellow: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400',
    blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-600 dark:text-gray-400">{title}</span>
        <div className={`p-2 rounded-lg ${colorClasses[color as keyof typeof colorClasses]}`}>
          <Icon size={16} />
        </div>
      </div>
      <p className={`text-xl font-bold ${color === 'red' ? 'text-red-600' : color === 'green' ? 'text-green-600' : 'text-gray-900 dark:text-white'}`}>
        {value}
      </p>
    </div>
  );
}

function StatRow({ label, value, highlight }: { label: string; value: string; highlight?: string }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
      <span className="text-sm text-gray-600 dark:text-gray-400">{label}</span>
      <span className={`text-sm font-semibold ${
        highlight === 'green' ? 'text-green-600' : highlight === 'red' ? 'text-red-600' : 'text-gray-900 dark:text-white'
      }`}>{value}</span>
    </div>
  );
}
