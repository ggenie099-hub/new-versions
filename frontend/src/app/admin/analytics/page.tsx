'use client';

import { useState } from 'react';
import { TrendingUp, Users, DollarSign, Activity, BarChart3, PieChart, ArrowUpRight, ArrowDownRight } from 'lucide-react';

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<'7d' | '30d' | '90d' | '1y'>('30d');

  const stats = [
    { label: 'Total Revenue', value: '$45,680', change: '+23%', up: true, icon: DollarSign, color: 'text-green-500', bg: 'bg-green-500/10' },
    { label: 'Active Users', value: '1,247', change: '+12%', up: true, icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'Total Trades', value: '15,420', change: '+18%', up: true, icon: Activity, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { label: 'Conversion Rate', value: '24.5%', change: '-2%', up: false, icon: TrendingUp, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
  ];

  const trafficSources = [
    { source: 'Direct', visits: 4520, percentage: 35 },
    { source: 'Google', visits: 3890, percentage: 30 },
    { source: 'Social Media', visits: 2340, percentage: 18 },
    { source: 'Referral', visits: 1560, percentage: 12 },
    { source: 'Email', visits: 650, percentage: 5 },
  ];

  const topPages = [
    { page: '/dashboard', views: 12450, unique: 8920 },
    { page: '/dashboard/ai-chat', views: 8930, unique: 6540 },
    { page: '/dashboard/backtest', views: 5670, unique: 4230 },
    { page: '/dashboard/trades', views: 4560, unique: 3450 },
    { page: '/blog', views: 3240, unique: 2890 },
  ];

  const userGrowth = [
    { month: 'Jul', users: 450 },
    { month: 'Aug', users: 580 },
    { month: 'Sep', users: 720 },
    { month: 'Oct', users: 890 },
    { month: 'Nov', users: 1050 },
    { month: 'Dec', users: 1247 },
  ];

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Analytics</h1>
          <p className="text-gray-400 text-sm">Track your platform performance</p>
        </div>
        <div className="flex gap-2">
          {(['7d', '30d', '90d', '1y'] as const).map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-lg text-sm transition-all ${period === p ? 'bg-primary-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <div className="flex items-start justify-between mb-3">
                <div className={`p-2.5 rounded-lg ${stat.bg}`}><Icon size={20} className={stat.color}/></div>
                <div className={`flex items-center gap-1 text-xs ${stat.up ? 'text-green-500' : 'text-red-500'}`}>
                  {stat.up ? <ArrowUpRight size={14}/> : <ArrowDownRight size={14}/>}
                  <span>{stat.change}</span>
                </div>
              </div>
              <p className="text-2xl font-bold text-white mb-1">{stat.value}</p>
              <p className="text-sm text-gray-500">{stat.label}</p>
            </div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* User Growth Chart */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-white">User Growth</h2>
            <BarChart3 size={20} className="text-gray-500"/>
          </div>
          <div className="h-64 flex items-end justify-between gap-2">
            {userGrowth.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full bg-primary-600/20 rounded-t-lg relative" style={{ height: `${(d.users / 1300) * 100}%` }}>
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs text-gray-400">{d.users}</div>
                </div>
                <span className="text-xs text-gray-500">{d.month}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Traffic Sources */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-white">Traffic Sources</h2>
            <PieChart size={20} className="text-gray-500"/>
          </div>
          <div className="space-y-4">
            {trafficSources.map((source, i) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-300">{source.source}</span>
                  <span className="text-sm text-gray-500">{source.visits.toLocaleString()} ({source.percentage}%)</span>
                </div>
                <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full bg-primary-600 rounded-full" style={{ width: `${source.percentage}%` }}/>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Pages */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl">
        <div className="p-5 border-b border-gray-800">
          <h2 className="text-lg font-semibold text-white">Top Pages</h2>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-800">
              <th className="text-left px-5 py-3 text-sm font-medium text-gray-400">Page</th>
              <th className="text-right px-5 py-3 text-sm font-medium text-gray-400">Views</th>
              <th className="text-right px-5 py-3 text-sm font-medium text-gray-400">Unique</th>
              <th className="text-right px-5 py-3 text-sm font-medium text-gray-400">Bounce Rate</th>
            </tr>
          </thead>
          <tbody>
            {topPages.map((page, i) => (
              <tr key={i} className="border-b border-gray-800 hover:bg-gray-800/50">
                <td className="px-5 py-4 text-sm text-white font-mono">{page.page}</td>
                <td className="px-5 py-4 text-sm text-gray-400 text-right">{page.views.toLocaleString()}</td>
                <td className="px-5 py-4 text-sm text-gray-400 text-right">{page.unique.toLocaleString()}</td>
                <td className="px-5 py-4 text-sm text-gray-400 text-right">{(Math.random() * 30 + 20).toFixed(1)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
