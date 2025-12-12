'use client';

import { useState } from 'react';
import { Key, Eye, EyeOff, Save, RefreshCw, Check, AlertTriangle, Trash2 } from 'lucide-react';

interface APIKey {
  id: string;
  provider: string;
  name: string;
  key: string;
  status: 'active' | 'invalid' | 'expired';
  lastUsed: string;
  usageCount: number;
  rateLimit: number;
}

const defaultKeys: APIKey[] = [
  { id: '1', provider: 'OpenAI', name: 'GPT-4 API Key', key: 'sk-proj-xxxx...xxxx', status: 'active', lastUsed: '2 min ago', usageCount: 15420, rateLimit: 10000 },
  { id: '2', provider: 'Anthropic', name: 'Claude API Key', key: 'sk-ant-xxxx...xxxx', status: 'active', lastUsed: '5 min ago', usageCount: 8930, rateLimit: 5000 },
  { id: '3', provider: 'Mistral', name: 'Mistral API Key', key: 'xxxx...xxxx', status: 'active', lastUsed: '1 hour ago', usageCount: 2340, rateLimit: 3000 },
  { id: '4', provider: 'Google', name: 'Gemini API Key', key: '', status: 'invalid', lastUsed: 'Never', usageCount: 0, rateLimit: 5000 },
];

export default function APIKeysPage() {
  const [keys, setKeys] = useState<APIKey[]>(defaultKeys);
  const [showKey, setShowKey] = useState<string | null>(null);
  const [editKey, setEditKey] = useState<string | null>(null);
  const [newKeyValue, setNewKeyValue] = useState('');
  const [testing, setTesting] = useState<string | null>(null);

  const providers = [
    { id: 'openai', name: 'OpenAI', description: 'GPT-4, GPT-4o, GPT-4.1', color: 'text-green-500', bg: 'bg-green-500/10' },
    { id: 'anthropic', name: 'Anthropic', description: 'Claude 3.5 Sonnet, Claude 3 Opus', color: 'text-orange-500', bg: 'bg-orange-500/10' },
    { id: 'mistral', name: 'Mistral', description: 'Mistral Large, Mixtral', color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { id: 'google', name: 'Google', description: 'Gemini Pro, Gemini Ultra', color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
  ];

  const saveKey = (id: string) => {
    setKeys(keys.map(k => k.id === id ? { ...k, key: newKeyValue, status: newKeyValue ? 'active' : 'invalid' } : k));
    setEditKey(null);
    setNewKeyValue('');
  };

  const testKey = async (id: string) => {
    setTesting(id);
    await new Promise(r => setTimeout(r, 2000));
    setTesting(null);
    // Simulate test result
    setKeys(keys.map(k => k.id === id ? { ...k, status: k.key ? 'active' : 'invalid' } : k));
  };

  const deleteKey = (id: string) => {
    setKeys(keys.map(k => k.id === id ? { ...k, key: '', status: 'invalid' } : k));
  };

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">API Keys</h1>
        <p className="text-gray-400 text-sm">Manage API keys for AI models. Users will not see these keys.</p>
      </div>

      {/* Warning */}
      <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-6 flex items-start gap-3">
        <AlertTriangle className="text-yellow-500 flex-shrink-0 mt-0.5" size={20}/>
        <div>
          <p className="text-yellow-500 font-medium">Security Notice</p>
          <p className="text-yellow-500/80 text-sm">API keys are encrypted and stored securely. Never share these keys with users.</p>
        </div>
      </div>

      {/* API Keys Grid */}
      <div className="grid gap-4">
        {keys.map(apiKey => {
          const provider = providers.find(p => p.name === apiKey.provider);
          return (
            <div key={apiKey.id} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl ${provider?.bg || 'bg-gray-800'} flex items-center justify-center`}>
                    <Key size={24} className={provider?.color || 'text-gray-500'}/>
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{apiKey.provider}</h3>
                    <p className="text-sm text-gray-500">{provider?.description}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${apiKey.status === 'active' ? 'bg-green-500/20 text-green-400' : apiKey.status === 'expired' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'}`}>
                  {apiKey.status}
                </span>
              </div>

              {/* Key Input */}
              <div className="mb-4">
                <label className="block text-sm text-gray-400 mb-2">API Key</label>
                {editKey === apiKey.id ? (
                  <div className="flex gap-2">
                    <input type="text" value={newKeyValue} onChange={e => setNewKeyValue(e.target.value)} placeholder="Enter API key..."
                      className="flex-1 px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-primary-500 outline-none font-mono text-sm"/>
                    <button onClick={() => saveKey(apiKey.id)} className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg flex items-center gap-2">
                      <Save size={16}/> Save
                    </button>
                    <button onClick={() => { setEditKey(null); setNewKeyValue(''); }} className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg">
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <div className="flex-1 px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg font-mono text-sm flex items-center justify-between">
                      <span className="text-gray-400">
                        {apiKey.key ? (showKey === apiKey.id ? apiKey.key : '••••••••••••••••••••') : 'Not configured'}
                      </span>
                      {apiKey.key && (
                        <button onClick={() => setShowKey(showKey === apiKey.id ? null : apiKey.id)} className="text-gray-500 hover:text-white">
                          {showKey === apiKey.id ? <EyeOff size={16}/> : <Eye size={16}/>}
                        </button>
                      )}
                    </div>
                    <button onClick={() => { setEditKey(apiKey.id); setNewKeyValue(apiKey.key); }} className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg">
                      Edit
                    </button>
                    <button onClick={() => testKey(apiKey.id)} disabled={!apiKey.key || testing === apiKey.id} className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg flex items-center gap-2 disabled:opacity-50">
                      {testing === apiKey.id ? <RefreshCw size={16} className="animate-spin"/> : <Check size={16}/>}
                      Test
                    </button>
                    {apiKey.key && (
                      <button onClick={() => deleteKey(apiKey.id)} className="px-4 py-2 bg-gray-800 hover:bg-red-600/20 text-gray-300 hover:text-red-400 rounded-lg">
                        <Trash2 size={16}/>
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-800">
                <div>
                  <p className="text-xs text-gray-500">Last Used</p>
                  <p className="text-sm text-white">{apiKey.lastUsed}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Total Calls</p>
                  <p className="text-sm text-white">{apiKey.usageCount.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Rate Limit</p>
                  <p className="text-sm text-white">{apiKey.rateLimit.toLocaleString()}/day</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Usage Summary */}
      <div className="mt-8 bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h2 className="text-lg font-semibold text-white mb-4">Usage Summary</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-gray-800 rounded-lg p-4">
            <p className="text-2xl font-bold text-white">{keys.reduce((a, k) => a + k.usageCount, 0).toLocaleString()}</p>
            <p className="text-sm text-gray-500">Total API Calls</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <p className="text-2xl font-bold text-green-500">{keys.filter(k => k.status === 'active').length}</p>
            <p className="text-sm text-gray-500">Active Keys</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <p className="text-2xl font-bold text-yellow-500">$127.45</p>
            <p className="text-sm text-gray-500">Est. Monthly Cost</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <p className="text-2xl font-bold text-primary-500">4</p>
            <p className="text-sm text-gray-500">Providers</p>
          </div>
        </div>
      </div>
    </div>
  );
}
