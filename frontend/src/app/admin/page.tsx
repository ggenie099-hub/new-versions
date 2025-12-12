'use client';

import { useState, useEffect } from 'react';
import { Users, Bot, FileText, CreditCard, TrendingUp, Activity, DollarSign, Eye, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface Stats {
  totalUsers: number;
  activeUsers: number;
  totalBlogs: number;
  totalRevenue: number;
  totalTrades: number;
  activeAgents: number;
  newUsersToday: number;
  apiCalls: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalUsers: 1247,
    activeUsers: 342,
    totalBlogs: 28,
    totalRevenue: 45680,
    totalTrades: 15420,
    activeAgents: 10,
    newUsersToday: 23,
    apiCalls: 89450
  });
  const [recentUsers, setRecentUsers] = useState([
    { id: 1, name: 'Rahul Sharma', email: 'rahul@example.com', plan: 'Pro', status: 'active', joined: '2 hours ago' },
    { id: 2, name: 'Priya Patel', email: 'priya@example.com', plan: 'Free', status: 'active', joined: '5 hours ago' },
    { id: 3, name: 'Amit Kumar', email: 'amit@example.com', plan: 'Enterprise', status: 'active', joined: '1 day ago' },
    { id: 4, name: 'Sneha Gupta', email: 'sneha@example.com', plan: 'Pro', status: 'inactive', joined: '2 days ago' },
  ]);
  const [recentActivity, setRecentActivity] = useState([
    { id: 1, action: 'New user registered', user: 'Rahul Sharma', time: '2 min ago', type: 'user' },
    { id: 2, action: 'Blog published', user: 'Admin', time: '15 min ago', type: 'blog' },
    { id: 3, action: 'Subscription upgraded', user: 'Priya Patel', time: '1 hour ago', type: 'payment' },
    { id: 4, action: 'API key generated', user: 'System', time: '2 hours ago', type: 'system' },
    { id: 5, action: 'Trade executed', user: 'Amit Kumar', time: '3 hours ago', type: 'trade' },
  ]);

  const statCards = [
    { label: 'Total Users', value: stats.totalUsers, icon: Users, change: '+12%', up: true, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'Active Today', value: stats.activeUsers, icon: Activity, change: '+8%', up: true, color: 'text-green-500', bg: 'bg-green-500/10' },
    { label: 'Total Revenue', value: `$${stats.totalRevenue.toLocaleString()}`, icon: DollarSign, change: '+23%', up: true, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
    { label: 'Total Trades', value: stats.totalTrades.toLocaleString(), icon: TrendingUp, change: '+15%', up: true, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { label: 'Blog Posts', value: stats.totalBlogs, icon: FileText, change: '+2', up: true, color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
    { label: 'AI Agents', value: stats.activeAgents, icon: Bot, change: '0', up: false, color: 'text-orange-500', bg: 'bg-orange-500/10' },
    { label: 'New Users Today', value: stats.newUsersToday, icon: Users, change: '+5', up: true, color: 'text-pink-500', bg: 'bg-pink-500/10' },
    { label: 'API Calls', value: stats.apiCalls.toLocaleString(), icon: Activity, change: '+18%', up: true, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
  ];

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Admin Dashboard</h1>
        <p className="text-gray-400">Welcome back! Here's what's happening with your platform.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-gray-700 transition-all">
              <div className="flex items-start justify-between mb-3">
                <div className={`p-2.5 rounded-lg ${stat.bg}`}><Icon size={20} className={stat.color}/></div>
                <div className={`flex items-center gap-1 text-xs ${stat.up ? 'text-green-500' : 'text-gray-500'}`}>
                  {stat.up ? <ArrowUpRight size={14}/> : null}
                  <span>{stat.change}</span>
                </div>
              </div>
              <p className="text-2xl font-bold text-white mb-1">{stat.value}</p>
              <p className="text-sm text-gray-500">{stat.label}</p>
            </div>
          );
        })}
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Users */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl">
          <div className="p-5 border-b border-gray-800 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Recent Users</h2>
            <a href="/admin/users" className="text-sm text-primary-500 hover:text-primary-400">View All</a>
          </div>
          <div className="p-5 space-y-4">
            {recentUsers.map(user => (
              <div key={user.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-white font-medium">
                    {user.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{user.name}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`px-2 py-1 text-xs rounded-full ${user.plan === 'Enterprise' ? 'bg-purple-500/20 text-purple-400' : user.plan === 'Pro' ? 'bg-primary-500/20 text-primary-400' : 'bg-gray-700 text-gray-400'}`}>
                    {user.plan}
                  </span>
                  <p className="text-xs text-gray-500 mt-1">{user.joined}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl">
          <div className="p-5 border-b border-gray-800 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Recent Activity</h2>
            <a href="/admin/logs" className="text-sm text-primary-500 hover:text-primary-400">View Logs</a>
          </div>
          <div className="p-5 space-y-4">
            {recentActivity.map(activity => (
              <div key={activity.id} className="flex items-start gap-3">
                <div className={`w-2 h-2 rounded-full mt-2 ${activity.type === 'user' ? 'bg-blue-500' : activity.type === 'blog' ? 'bg-cyan-500' : activity.type === 'payment' ? 'bg-green-500' : activity.type === 'trade' ? 'bg-purple-500' : 'bg-gray-500'}`}/>
                <div className="flex-1">
                  <p className="text-sm text-white">{activity.action}</p>
                  <p className="text-xs text-gray-500">{activity.user} • {activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <a href="/admin/users" className="flex items-center gap-3 p-4 bg-gray-800 hover:bg-gray-700 rounded-lg transition-all">
            <Users size={20} className="text-blue-500"/><span className="text-sm text-white">Manage Users</span>
          </a>
          <a href="/admin/blogs" className="flex items-center gap-3 p-4 bg-gray-800 hover:bg-gray-700 rounded-lg transition-all">
            <FileText size={20} className="text-cyan-500"/><span className="text-sm text-white">Write Blog</span>
          </a>
          <a href="/admin/agents" className="flex items-center gap-3 p-4 bg-gray-800 hover:bg-gray-700 rounded-lg transition-all">
            <Bot size={20} className="text-orange-500"/><span className="text-sm text-white">Edit Agents</span>
          </a>
          <a href="/admin/settings" className="flex items-center gap-3 p-4 bg-gray-800 hover:bg-gray-700 rounded-lg transition-all">
            <CreditCard size={20} className="text-green-500"/><span className="text-sm text-white">Settings</span>
          </a>
        </div>
      </div>
    </div>
  );
}
