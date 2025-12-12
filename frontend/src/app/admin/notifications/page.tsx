'use client';

import { useState } from 'react';
import { Bell, Send, Plus, Trash2, Users, User, Clock, Check, X } from 'lucide-react';

interface Notification {
  id: number;
  title: string;
  message: string;
  type: 'all' | 'premium' | 'specific';
  status: 'sent' | 'scheduled' | 'draft';
  sentAt?: string;
  scheduledAt?: string;
  recipients: number;
  readRate: number;
}

const mockNotifications: Notification[] = [
  { id: 1, title: 'New Feature: AI Chat', message: 'We have launched a new AI Chat feature...', type: 'all', status: 'sent', sentAt: '2024-12-12 10:00', recipients: 1247, readRate: 68 },
  { id: 2, title: 'Premium Offer', message: 'Get 50% off on annual subscription...', type: 'premium', status: 'sent', sentAt: '2024-12-10 14:30', recipients: 279, readRate: 82 },
  { id: 3, title: 'Maintenance Notice', message: 'Scheduled maintenance on Dec 15...', type: 'all', status: 'scheduled', scheduledAt: '2024-12-14 09:00', recipients: 1247, readRate: 0 },
  { id: 4, title: 'Welcome Message', message: 'Welcome to Trading Maven...', type: 'specific', status: 'draft', recipients: 0, readRate: 0 },
];

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [showEditor, setShowEditor] = useState(false);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState<'all' | 'premium' | 'specific'>('all');
  const [schedule, setSchedule] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');

  const sendNotification = () => {
    const newNotif: Notification = {
      id: Date.now(),
      title,
      message,
      type,
      status: schedule ? 'scheduled' : 'sent',
      sentAt: schedule ? undefined : new Date().toISOString(),
      scheduledAt: schedule ? scheduleDate : undefined,
      recipients: type === 'all' ? 1247 : type === 'premium' ? 279 : 1,
      readRate: 0,
    };
    setNotifications([newNotif, ...notifications]);
    setShowEditor(false);
    setTitle('');
    setMessage('');
    setType('all');
    setSchedule(false);
    setScheduleDate('');
  };

  const deleteNotification = (id: number) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Notifications</h1>
          <p className="text-gray-400 text-sm">Send notifications to users</p>
        </div>
        <button onClick={() => setShowEditor(true)} className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-all">
          <Plus size={18}/><span>New Notification</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-2xl font-bold text-white">{notifications.length}</p>
          <p className="text-sm text-gray-500">Total Sent</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-2xl font-bold text-green-500">{notifications.filter(n => n.status === 'sent').length}</p>
          <p className="text-sm text-gray-500">Delivered</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-2xl font-bold text-yellow-500">{notifications.filter(n => n.status === 'scheduled').length}</p>
          <p className="text-sm text-gray-500">Scheduled</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-2xl font-bold text-primary-500">72%</p>
          <p className="text-sm text-gray-500">Avg Read Rate</p>
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-4">
        {notifications.map(notif => (
          <div key={notif.id} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${notif.status === 'sent' ? 'bg-green-500/10' : notif.status === 'scheduled' ? 'bg-yellow-500/10' : 'bg-gray-800'}`}>
                  <Bell size={20} className={notif.status === 'sent' ? 'text-green-500' : notif.status === 'scheduled' ? 'text-yellow-500' : 'text-gray-500'}/>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-white">{notif.title}</h3>
                    <span className={`px-2 py-0.5 text-xs rounded-full ${notif.status === 'sent' ? 'bg-green-500/20 text-green-400' : notif.status === 'scheduled' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-gray-700 text-gray-400'}`}>
                      {notif.status}
                    </span>
                    <span className={`px-2 py-0.5 text-xs rounded-full ${notif.type === 'all' ? 'bg-blue-500/20 text-blue-400' : notif.type === 'premium' ? 'bg-purple-500/20 text-purple-400' : 'bg-gray-700 text-gray-400'}`}>
                      {notif.type === 'all' ? 'All Users' : notif.type === 'premium' ? 'Premium' : 'Specific'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 mb-2">{notif.message}</p>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1"><Users size={12}/> {notif.recipients} recipients</span>
                    {notif.sentAt && <span className="flex items-center gap-1"><Clock size={12}/> Sent: {notif.sentAt}</span>}
                    {notif.scheduledAt && <span className="flex items-center gap-1"><Clock size={12}/> Scheduled: {notif.scheduledAt}</span>}
                    {notif.status === 'sent' && <span className="flex items-center gap-1"><Check size={12}/> {notif.readRate}% read</span>}
                  </div>
                </div>
              </div>
              <button onClick={() => deleteNotification(notif.id)} className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-red-400">
                <Trash2 size={18}/>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Editor Modal */}
      {showEditor && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl w-full max-w-lg">
            <div className="flex items-center justify-between p-4 border-b border-gray-800">
              <h2 className="text-lg font-semibold text-white">New Notification</h2>
              <button onClick={() => setShowEditor(false)} className="p-2 hover:bg-gray-800 rounded-lg text-gray-400"><X size={20}/></button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Title</label>
                <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Notification title..."
                  className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-primary-500 outline-none"/>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Message</label>
                <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Notification message..." rows={4}
                  className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-primary-500 outline-none resize-none"/>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Recipients</label>
                <select value={type} onChange={e => setType(e.target.value as any)}
                  className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-primary-500 outline-none">
                  <option value="all">All Users (1,247)</option>
                  <option value="premium">Premium Users (279)</option>
                  <option value="specific">Specific User</option>
                </select>
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" id="schedule" checked={schedule} onChange={e => setSchedule(e.target.checked)} className="rounded"/>
                <label htmlFor="schedule" className="text-sm text-gray-400">Schedule for later</label>
              </div>
              {schedule && (
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Schedule Date & Time</label>
                  <input type="datetime-local" value={scheduleDate} onChange={e => setScheduleDate(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-primary-500 outline-none"/>
                </div>
              )}
            </div>
            <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-800">
              <button onClick={() => setShowEditor(false)} className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg">Cancel</button>
              <button onClick={sendNotification} disabled={!title || !message} className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg disabled:opacity-50">
                <Send size={18}/><span>{schedule ? 'Schedule' : 'Send Now'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
