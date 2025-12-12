'use client';

import { useState } from 'react';
import { Search, Plus, MoreHorizontal, Edit3, Trash2, Ban, CheckCircle, Mail, Shield, User, Filter, Download } from 'lucide-react';

interface UserData {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'user' | 'premium';
  plan: 'Free' | 'Pro' | 'Enterprise';
  status: 'active' | 'inactive' | 'banned';
  trades: number;
  joined: string;
  lastActive: string;
}

const mockUsers: UserData[] = [
  { id: 1, name: 'Admin User', email: 'admin@autotrading.com', role: 'admin', plan: 'Enterprise', status: 'active', trades: 0, joined: '2024-01-01', lastActive: '2 min ago' },
  { id: 2, name: 'Rahul Sharma', email: 'rahul@example.com', role: 'premium', plan: 'Pro', status: 'active', trades: 156, joined: '2024-06-15', lastActive: '1 hour ago' },
  { id: 3, name: 'Priya Patel', email: 'priya@example.com', role: 'user', plan: 'Free', status: 'active', trades: 23, joined: '2024-08-20', lastActive: '3 hours ago' },
  { id: 4, name: 'Amit Kumar', email: 'amit@example.com', role: 'premium', plan: 'Enterprise', status: 'active', trades: 892, joined: '2024-03-10', lastActive: '30 min ago' },
  { id: 5, name: 'Sneha Gupta', email: 'sneha@example.com', role: 'user', plan: 'Pro', status: 'inactive', trades: 45, joined: '2024-07-05', lastActive: '2 days ago' },
  { id: 6, name: 'Vikram Singh', email: 'vikram@example.com', role: 'user', plan: 'Free', status: 'banned', trades: 12, joined: '2024-09-01', lastActive: '1 week ago' },
];

export default function UsersPage() {
  const [users, setUsers] = useState<UserData[]>(mockUsers);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive' | 'banned'>('all');
  const [menuId, setMenuId] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState<UserData | null>(null);

  const filtered = users.filter(u => {
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || u.status === filter;
    return matchSearch && matchFilter;
  });

  const toggleStatus = (id: number) => {
    setUsers(users.map(u => u.id === id ? { ...u, status: u.status === 'active' ? 'inactive' : 'active' } : u));
    setMenuId(null);
  };

  const banUser = (id: number) => {
    setUsers(users.map(u => u.id === id ? { ...u, status: 'banned' } : u));
    setMenuId(null);
  };

  const deleteUser = (id: number) => {
    if (confirm('Are you sure you want to delete this user?')) {
      setUsers(users.filter(u => u.id !== id));
    }
    setMenuId(null);
  };

  const changeRole = (id: number, role: 'admin' | 'user' | 'premium') => {
    setUsers(users.map(u => u.id === id ? { ...u, role } : u));
    setMenuId(null);
  };

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">User Management</h1>
          <p className="text-gray-400 text-sm">Manage all users, roles, and permissions</p>
        </div>
        <button onClick={() => { setEditUser(null); setShowModal(true); }} className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-all">
          <Plus size={18}/><span>Add User</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"/>
          <input type="text" placeholder="Search users..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-primary-500 outline-none"/>
        </div>
        <div className="flex gap-2">
          {(['all', 'active', 'inactive', 'banned'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm capitalize transition-all ${filter === f ? 'bg-primary-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>
              {f}
            </button>
          ))}
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg">
          <Download size={18}/><span>Export</span>
        </button>
      </div>

      {/* Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left px-5 py-4 text-sm font-medium text-gray-400">User</th>
                <th className="text-left px-5 py-4 text-sm font-medium text-gray-400">Role</th>
                <th className="text-left px-5 py-4 text-sm font-medium text-gray-400">Plan</th>
                <th className="text-left px-5 py-4 text-sm font-medium text-gray-400">Status</th>
                <th className="text-left px-5 py-4 text-sm font-medium text-gray-400">Trades</th>
                <th className="text-left px-5 py-4 text-sm font-medium text-gray-400">Last Active</th>
                <th className="text-right px-5 py-4 text-sm font-medium text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(user => (
                <tr key={user.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-white font-medium">{user.name.charAt(0)}</div>
                      <div>
                        <p className="text-sm font-medium text-white">{user.name}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${user.role === 'admin' ? 'bg-red-500/20 text-red-400' : user.role === 'premium' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-gray-700 text-gray-400'}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${user.plan === 'Enterprise' ? 'bg-purple-500/20 text-purple-400' : user.plan === 'Pro' ? 'bg-primary-500/20 text-primary-400' : 'bg-gray-700 text-gray-400'}`}>
                      {user.plan}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${user.status === 'active' ? 'bg-green-500/20 text-green-400' : user.status === 'inactive' ? 'bg-gray-700 text-gray-400' : 'bg-red-500/20 text-red-400'}`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-300">{user.trades}</td>
                  <td className="px-5 py-4 text-sm text-gray-500">{user.lastActive}</td>
                  <td className="px-5 py-4">
                    <div className="relative flex justify-end">
                      <button onClick={() => setMenuId(menuId === user.id ? null : user.id)} className="p-2 hover:bg-gray-700 rounded-lg text-gray-400">
                        <MoreHorizontal size={18}/>
                      </button>
                      {menuId === user.id && (
                        <div className="absolute right-0 top-full mt-1 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-10 py-1">
                          <button onClick={() => { setEditUser(user); setShowModal(true); setMenuId(null); }} className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-700 flex items-center gap-2">
                            <Edit3 size={14}/> Edit User
                          </button>
                          <button onClick={() => toggleStatus(user.id)} className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-700 flex items-center gap-2">
                            <CheckCircle size={14}/> {user.status === 'active' ? 'Deactivate' : 'Activate'}
                          </button>
                          <button className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-700 flex items-center gap-2">
                            <Mail size={14}/> Send Email
                          </button>
                          <div className="border-t border-gray-700 my-1"/>
                          <button onClick={() => changeRole(user.id, 'admin')} className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-700 flex items-center gap-2">
                            <Shield size={14}/> Make Admin
                          </button>
                          <button onClick={() => changeRole(user.id, 'premium')} className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-700 flex items-center gap-2">
                            <User size={14}/> Make Premium
                          </button>
                          <div className="border-t border-gray-700 my-1"/>
                          <button onClick={() => banUser(user.id)} className="w-full px-4 py-2 text-left text-sm text-yellow-400 hover:bg-gray-700 flex items-center gap-2">
                            <Ban size={14}/> Ban User
                          </button>
                          <button onClick={() => deleteUser(user.id)} className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-gray-700 flex items-center gap-2">
                            <Trash2 size={14}/> Delete User
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="p-8 text-center text-gray-500">No users found</div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-2xl font-bold text-white">{users.length}</p>
          <p className="text-sm text-gray-500">Total Users</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-2xl font-bold text-green-500">{users.filter(u => u.status === 'active').length}</p>
          <p className="text-sm text-gray-500">Active</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-2xl font-bold text-yellow-500">{users.filter(u => u.role === 'premium').length}</p>
          <p className="text-sm text-gray-500">Premium</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-2xl font-bold text-red-500">{users.filter(u => u.status === 'banned').length}</p>
          <p className="text-sm text-gray-500">Banned</p>
        </div>
      </div>
    </div>
  );
}
