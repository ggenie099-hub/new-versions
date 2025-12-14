'use client';

import { Gauge, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';

interface TradeReadinessProps {
  data: {
    score: number;
    zone: string;
    momentum_aligned: boolean;
    volume_confirmed: boolean;
    spread_ok: boolean;
    session_quality: string;
    indicator_agreement: number;
    factors: string[];
    warnings: string[];
    color_code: string;
    recommendation: string;
  } | null;
  loading?: boolean;
}

export default function TradeReadinessMeter({ data, loading }: TradeReadinessProps) {
  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 animate-pulse">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4"></div>
        <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">AI Trade Readiness</h3>
        <p className="text-gray-500 dark:text-gray-400">Connect MT5 to view readiness score</p>
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

  const zoneLabels: Record<string, string> = {
    high_probability: 'High Probability Zone',
    caution: 'Caution Zone',
    no_trade: 'No Trade Zone',
  };

  const ZoneIcon = data.zone === 'high_probability' ? CheckCircle :
                   data.zone === 'caution' ? AlertTriangle : XCircle;

  // Calculate gauge rotation (0-180 degrees for 0-100%)
  const rotation = (data.score / 100) * 180 - 90;

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Gauge size={20} />
          AI Trade Readiness
        </h3>
        <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${colorMap[data.color_code]} bg-opacity-10`}>
          <ZoneIcon size={16} />
          {zoneLabels[data.zone]}
        </div>
      </div>

      {/* Gauge Visualization */}
      <div className="flex flex-col items-center mb-4">
        <div className="relative w-48 h-24 overflow-hidden">
          {/* Background arc */}
          <div className="absolute inset-0 border-8 border-gray-200 dark:border-gray-700 rounded-t-full"></div>
          
          {/* Colored segments */}
          <div className="absolute inset-0 border-8 border-transparent border-t-red-500 border-l-red-500 rounded-t-full" 
               style={{ clipPath: 'polygon(0 100%, 0 0, 33% 0, 33% 100%)' }}></div>
          <div className="absolute inset-0 border-8 border-transparent border-t-yellow-500 rounded-t-full"
               style={{ clipPath: 'polygon(33% 100%, 33% 0, 66% 0, 66% 100%)' }}></div>
          <div className="absolute inset-0 border-8 border-transparent border-t-green-500 border-r-green-500 rounded-t-full"
               style={{ clipPath: 'polygon(66% 100%, 66% 0, 100% 0, 100% 100%)' }}></div>
          
          {/* Needle */}
          <div className="absolute bottom-0 left-1/2 w-1 h-20 origin-bottom -translate-x-1/2"
               style={{ transform: `translateX(-50%) rotate(${rotation}deg)` }}>
            <div className={`w-1 h-16 ${bgColorMap[data.color_code]} rounded-t-full`}></div>
          </div>
          
          {/* Center dot */}
          <div className="absolute bottom-0 left-1/2 w-4 h-4 -translate-x-1/2 translate-y-1/2 bg-gray-800 dark:bg-white rounded-full"></div>
        </div>
        
        {/* Score display - separate from gauge with proper spacing */}
        <div className="mt-6 text-center">
          <span className={`text-4xl font-bold ${colorMap[data.color_code]}`}>{data.score.toFixed(0)}</span>
          <span className="text-gray-500 dark:text-gray-400 text-lg">%</span>
        </div>
      </div>

      {/* Indicators */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className={`flex items-center gap-2 p-2 rounded ${data.momentum_aligned ? 'bg-green-500/10' : 'bg-gray-100 dark:bg-gray-700'}`}>
          {data.momentum_aligned ? <CheckCircle size={16} className="text-green-500" /> : <XCircle size={16} className="text-gray-400" />}
          <span className="text-sm text-gray-700 dark:text-gray-300">Momentum</span>
        </div>
        <div className={`flex items-center gap-2 p-2 rounded ${data.volume_confirmed ? 'bg-green-500/10' : 'bg-gray-100 dark:bg-gray-700'}`}>
          {data.volume_confirmed ? <CheckCircle size={16} className="text-green-500" /> : <XCircle size={16} className="text-gray-400" />}
          <span className="text-sm text-gray-700 dark:text-gray-300">Volume</span>
        </div>
        <div className={`flex items-center gap-2 p-2 rounded ${data.spread_ok ? 'bg-green-500/10' : 'bg-gray-100 dark:bg-gray-700'}`}>
          {data.spread_ok ? <CheckCircle size={16} className="text-green-500" /> : <XCircle size={16} className="text-gray-400" />}
          <span className="text-sm text-gray-700 dark:text-gray-300">Spread</span>
        </div>
        <div className={`flex items-center gap-2 p-2 rounded ${data.session_quality !== 'poor' ? 'bg-green-500/10' : 'bg-gray-100 dark:bg-gray-700'}`}>
          {data.session_quality !== 'poor' ? <CheckCircle size={16} className="text-green-500" /> : <XCircle size={16} className="text-gray-400" />}
          <span className="text-sm text-gray-700 dark:text-gray-300">Session</span>
        </div>
      </div>

      {/* Warnings */}
      {data.warnings.length > 0 && (
        <div className="mb-4">
          {data.warnings.map((warning, idx) => (
            <div key={idx} className="flex items-center gap-2 text-sm text-yellow-600 dark:text-yellow-400">
              <AlertTriangle size={14} />
              {warning}
            </div>
          ))}
        </div>
      )}

      {/* Recommendation */}
      <div className={`p-3 rounded-lg ${data.color_code === 'green' ? 'bg-green-500/10' : data.color_code === 'yellow' ? 'bg-yellow-500/10' : 'bg-red-500/10'}`}>
        <p className={`text-sm font-medium ${colorMap[data.color_code]}`}>{data.recommendation}</p>
      </div>
    </div>
  );
}
