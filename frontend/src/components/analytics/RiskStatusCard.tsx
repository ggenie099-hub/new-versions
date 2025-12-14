'use client';

import { Shield, AlertTriangle, AlertOctagon } from 'lucide-react';

interface RiskStatusProps {
  data: {
    current_drawdown: number;
    max_allowed_drawdown: number;
    drawdown_percentage: number;
    risk_level: string;
    daily_loss: number;
    weekly_loss: number;
    open_risk: number;
    color_code: string;
    warning_message: string | null;
    should_pause_trading: boolean;
  } | null;
  loading?: boolean;
}

export default function RiskStatusCard({ data, loading }: RiskStatusProps) {
  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 animate-pulse">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
        <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Risk Status</h3>
        <p className="text-gray-500 dark:text-gray-400">Connect MT5 to view risk analysis</p>
      </div>
    );
  }

  const colorMap: Record<string, string> = {
    green: 'text-green-500',
    yellow: 'text-yellow-500',
    red: 'text-red-500',
  };

  const bgColorMap: Record<string, string> = {
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500',
  };

  const borderColorMap: Record<string, string> = {
    green: 'border-green-500/30',
    yellow: 'border-yellow-500/30',
    red: 'border-red-500/30',
  };

  const riskLabels: Record<string, string> = {
    safe: 'Safe',
    warning: 'Warning',
    critical: 'Critical',
  };

  const RiskIcon = data.risk_level === 'safe' ? Shield :
                   data.risk_level === 'warning' ? AlertTriangle : AlertOctagon;

  const progressWidth = Math.min(100, (data.drawdown_percentage / 10) * 100);

  return (
    <div className={`bg-white dark:bg-gray-800 p-6 rounded-xl border ${borderColorMap[data.color_code]}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Shield size={20} />
          Risk Status
        </h3>
        <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${colorMap[data.color_code]} ${data.color_code === 'green' ? 'bg-green-500/10' : data.color_code === 'yellow' ? 'bg-yellow-500/10' : 'bg-red-500/10'}`}>
          <RiskIcon size={16} />
          <span className="text-sm font-medium">{riskLabels[data.risk_level]}</span>
        </div>
      </div>

      {/* Drawdown Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-500 dark:text-gray-400">Current Drawdown</span>
          <span className={`font-semibold ${colorMap[data.color_code]}`}>
            ${data.current_drawdown.toFixed(2)} ({data.drawdown_percentage.toFixed(1)}%)
          </span>
        </div>
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div 
            className={`h-full ${bgColorMap[data.color_code]} transition-all duration-500`}
            style={{ width: `${progressWidth}%` }}
          ></div>
        </div>
        <div className="flex justify-between text-xs mt-1 text-gray-400">
          <span>$0</span>
          <span>Max: ${data.max_allowed_drawdown.toFixed(2)}</span>
        </div>
      </div>

      {/* Risk Metrics */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <p className="text-xs text-gray-500 dark:text-gray-400">Open Risk</p>
          <p className={`text-lg font-semibold ${data.open_risk > 0 ? 'text-red-500' : 'text-gray-900 dark:text-white'}`}>
            ${data.open_risk.toFixed(2)}
          </p>
        </div>
        <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <p className="text-xs text-gray-500 dark:text-gray-400">Daily Loss</p>
          <p className={`text-lg font-semibold ${data.daily_loss > 0 ? 'text-red-500' : 'text-gray-900 dark:text-white'}`}>
            ${data.daily_loss.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Warning Message */}
      {data.warning_message && (
        <div className={`p-3 rounded-lg ${data.color_code === 'red' ? 'bg-red-500/10' : 'bg-yellow-500/10'}`}>
          <div className="flex items-start gap-2">
            <AlertTriangle size={16} className={colorMap[data.color_code]} />
            <p className={`text-sm ${colorMap[data.color_code]}`}>{data.warning_message}</p>
          </div>
        </div>
      )}

      {/* Pause Trading Alert */}
      {data.should_pause_trading && (
        <div className="mt-3 p-3 bg-red-500/20 border border-red-500/50 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertOctagon size={18} className="text-red-500" />
            <p className="text-sm font-semibold text-red-500">Trading should be paused until risk is reduced</p>
          </div>
        </div>
      )}
    </div>
  );
}
