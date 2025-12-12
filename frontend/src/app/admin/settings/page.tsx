'use client';

import { useState } from 'react';
import { Save, Globe, Bell, Shield, CreditCard, Mail, Database, Palette, Check } from 'lucide-react';

export default function SettingsPage() {
  const [saved, setSaved] = useState(false);
  const [settings, setSettings] = useState({
    siteName: 'Trading Maven',
    siteUrl: 'https://tradingmaven.com',
    supportEmail: 'support@tradingmaven.com',
    maxUsersPerPlan: { free: 100, pro: 500, enterprise: -1 },
    defaultModel: 'gpt-4.1',
    enableRegistration: true,
    requireEmailVerification: true,
    enableMT5: true,
    enableBacktest: true,
    enableAIChat: true,
    maintenanceMode: false,
    riskWarning: true,
    maxTradesPerDay: 100,
    defaultRiskPercent: 2,
    smtpHost: 'smtp.gmail.com',
    smtpPort: 587,
    smtpUser: '',
    smtpPass: '',
    primaryColor: '#22c55e',
    darkMode: true,
  });

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const Section = ({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) => (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-6">
      <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-800">
        <Icon size={20} className="text-primary-500"/>
        <h2 className="text-lg font-semibold text-white">{title}</h2>
      </div>
      {children}
    </div>
  );

  const Toggle = ({ label, description, checked, onChange }: { label: string; description?: string; checked: boolean; onChange: () => void }) => (
    <div className="flex items-center justify-between py-3">
      <div>
        <p className="text-sm font-medium text-white">{label}</p>
        {description && <p className="text-xs text-gray-500">{description}</p>}
      </div>
      <button onClick={onChange} className={`w-12 h-6 rounded-full transition-all ${checked ? 'bg-primary-600' : 'bg-gray-700'}`}>
        <div className={`w-5 h-5 rounded-full bg-white transition-all ${checked ? 'translate-x-6' : 'translate-x-0.5'}`}/>
      </button>
    </div>
  );

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">System Settings</h1>
          <p className="text-gray-400 text-sm">Configure global application settings</p>
        </div>
        <button onClick={handleSave} className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${saved ? 'bg-green-600 text-white' : 'bg-primary-600 hover:bg-primary-700 text-white'}`}>
          {saved ? <Check size={18}/> : <Save size={18}/>}
          <span>{saved ? 'Saved!' : 'Save Changes'}</span>
        </button>
      </div>

      {/* General Settings */}
      <Section title="General Settings" icon={Globe}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Site Name</label>
            <input type="text" value={settings.siteName} onChange={e => setSettings({ ...settings, siteName: e.target.value })}
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-primary-500 outline-none"/>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Site URL</label>
            <input type="text" value={settings.siteUrl} onChange={e => setSettings({ ...settings, siteUrl: e.target.value })}
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-primary-500 outline-none"/>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Support Email</label>
            <input type="email" value={settings.supportEmail} onChange={e => setSettings({ ...settings, supportEmail: e.target.value })}
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-primary-500 outline-none"/>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Default AI Model</label>
            <select value={settings.defaultModel} onChange={e => setSettings({ ...settings, defaultModel: e.target.value })}
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-primary-500 outline-none">
              <option value="gpt-4.1">GPT-4.1</option>
              <option value="gpt-4o">GPT-4o</option>
              <option value="claude-3.5">Claude 3.5 Sonnet</option>
              <option value="mistral-large">Mistral Large</option>
            </select>
          </div>
        </div>
      </Section>

      {/* Features */}
      <Section title="Features" icon={Shield}>
        <div className="divide-y divide-gray-800">
          <Toggle label="Enable Registration" description="Allow new users to register" checked={settings.enableRegistration} onChange={() => setSettings({ ...settings, enableRegistration: !settings.enableRegistration })}/>
          <Toggle label="Email Verification" description="Require email verification for new users" checked={settings.requireEmailVerification} onChange={() => setSettings({ ...settings, requireEmailVerification: !settings.requireEmailVerification })}/>
          <Toggle label="MT5 Integration" description="Enable MetaTrader 5 connection" checked={settings.enableMT5} onChange={() => setSettings({ ...settings, enableMT5: !settings.enableMT5 })}/>
          <Toggle label="Backtesting" description="Enable strategy backtesting feature" checked={settings.enableBacktest} onChange={() => setSettings({ ...settings, enableBacktest: !settings.enableBacktest })}/>
          <Toggle label="AI Chat" description="Enable AI chat assistant" checked={settings.enableAIChat} onChange={() => setSettings({ ...settings, enableAIChat: !settings.enableAIChat })}/>
          <Toggle label="Maintenance Mode" description="Put site in maintenance mode" checked={settings.maintenanceMode} onChange={() => setSettings({ ...settings, maintenanceMode: !settings.maintenanceMode })}/>
          <Toggle label="Risk Warning" description="Show risk warning to users" checked={settings.riskWarning} onChange={() => setSettings({ ...settings, riskWarning: !settings.riskWarning })}/>
        </div>
      </Section>

      {/* Trading Limits */}
      <Section title="Trading Limits" icon={CreditCard}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Max Trades Per Day</label>
            <input type="number" value={settings.maxTradesPerDay} onChange={e => setSettings({ ...settings, maxTradesPerDay: parseInt(e.target.value) })}
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-primary-500 outline-none"/>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Default Risk %</label>
            <input type="number" value={settings.defaultRiskPercent} onChange={e => setSettings({ ...settings, defaultRiskPercent: parseInt(e.target.value) })}
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-primary-500 outline-none"/>
          </div>
        </div>
        <div className="mt-4">
          <label className="block text-sm text-gray-400 mb-2">Max Users Per Plan</label>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Free</label>
              <input type="number" value={settings.maxUsersPerPlan.free} onChange={e => setSettings({ ...settings, maxUsersPerPlan: { ...settings.maxUsersPerPlan, free: parseInt(e.target.value) } })}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-primary-500 outline-none"/>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Pro</label>
              <input type="number" value={settings.maxUsersPerPlan.pro} onChange={e => setSettings({ ...settings, maxUsersPerPlan: { ...settings.maxUsersPerPlan, pro: parseInt(e.target.value) } })}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-primary-500 outline-none"/>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Enterprise (-1 = unlimited)</label>
              <input type="number" value={settings.maxUsersPerPlan.enterprise} onChange={e => setSettings({ ...settings, maxUsersPerPlan: { ...settings.maxUsersPerPlan, enterprise: parseInt(e.target.value) } })}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-primary-500 outline-none"/>
            </div>
          </div>
        </div>
      </Section>

      {/* Email Settings */}
      <Section title="Email Settings" icon={Mail}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">SMTP Host</label>
            <input type="text" value={settings.smtpHost} onChange={e => setSettings({ ...settings, smtpHost: e.target.value })}
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-primary-500 outline-none"/>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">SMTP Port</label>
            <input type="number" value={settings.smtpPort} onChange={e => setSettings({ ...settings, smtpPort: parseInt(e.target.value) })}
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-primary-500 outline-none"/>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">SMTP Username</label>
            <input type="text" value={settings.smtpUser} onChange={e => setSettings({ ...settings, smtpUser: e.target.value })} placeholder="Enter username..."
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-primary-500 outline-none"/>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">SMTP Password</label>
            <input type="password" value={settings.smtpPass} onChange={e => setSettings({ ...settings, smtpPass: e.target.value })} placeholder="Enter password..."
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-primary-500 outline-none"/>
          </div>
        </div>
      </Section>

      {/* Appearance */}
      <Section title="Appearance" icon={Palette}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Primary Color</label>
            <div className="flex gap-2">
              <input type="color" value={settings.primaryColor} onChange={e => setSettings({ ...settings, primaryColor: e.target.value })}
                className="w-12 h-10 bg-gray-800 border border-gray-700 rounded-lg cursor-pointer"/>
              <input type="text" value={settings.primaryColor} onChange={e => setSettings({ ...settings, primaryColor: e.target.value })}
                className="flex-1 px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-primary-500 outline-none"/>
            </div>
          </div>
        </div>
        <div className="mt-4">
          <Toggle label="Dark Mode" description="Enable dark mode by default" checked={settings.darkMode} onChange={() => setSettings({ ...settings, darkMode: !settings.darkMode })}/>
        </div>
      </Section>

      {/* Danger Zone */}
      <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-5">
        <h2 className="text-lg font-semibold text-red-400 mb-4">Danger Zone</h2>
        <div className="flex flex-wrap gap-3">
          <button className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg text-sm">Clear All Cache</button>
          <button className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg text-sm">Reset All Settings</button>
          <button className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg text-sm">Export Database</button>
        </div>
      </div>
    </div>
  );
}
