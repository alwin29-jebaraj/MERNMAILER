import React, { useState, useEffect } from 'react';
import { X, Settings, Server, Key, Eye, EyeOff, Check, AlertTriangle, Play } from 'lucide-react';
import { SMTPConfig } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveSuccess: () => void;
}

export default function SettingsModal({ isOpen, onClose, onSaveSuccess }: SettingsModalProps) {
  const [useCustomSmtp, setUseCustomSmtp] = useState(false);
  const [host, setHost] = useState('');
  const [port, setPort] = useState('587');
  const [secure, setSecure] = useState(false);
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [fromName, setFromName] = useState('MERN Mailer Pro');
  const [fromAddress, setFromAddress] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  
  const [showPass, setShowPass] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<{ success: boolean; message: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  // Fetch settings on open
  useEffect(() => {
    if (isOpen) {
      fetch('/api/settings')
        .then(res => res.json())
        .then(data => {
          setUseCustomSmtp(data.useCustomSmtp);
          if (data.smtpConfig) {
            setHost(data.smtpConfig.host || '');
            setPort(String(data.smtpConfig.port || '587'));
            setSecure(!!data.smtpConfig.secure);
            setUser(data.smtpConfig.user || '');
            setPass(data.smtpConfig.pass || '');
            setFromName(data.smtpConfig.fromName || 'MERN Mailer Pro');
            setFromAddress(data.smtpConfig.fromAddress || '');
          }
        })
        .catch(err => console.error("Error fetching settings:", err));
      
      setVerifyResult(null);
      setSaveStatus(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    setVerifying(true);
    setVerifyResult(null);

    const configPayload = {
      host,
      port: Number(port),
      secure,
      user,
      pass,
      fromName,
      fromAddress: fromAddress || user
    };

    try {
      const response = await fetch('/api/settings/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ smtpConfig: configPayload }),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setVerifyResult({ success: true, message: data.message });
      } else {
        setVerifyResult({ success: false, message: data.error || 'Failed to authenticate SMTP credentials' });
      }
    } catch (err) {
      setVerifyResult({ success: false, message: 'Could not connect to verification endpoint.' });
    } finally {
      setVerifying(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveStatus(null);

    const smtpConfig: SMTPConfig = {
      host,
      port: Number(port),
      secure,
      user,
      pass,
      fromName,
      fromAddress: fromAddress || user
    };

    const payload: any = {
      useCustomSmtp,
      smtpConfig
    };

    if (adminPassword.trim()) {
      payload.adminPassword = adminPassword;
    }

    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setSaveStatus('success');
        onSaveSuccess();
        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        setSaveStatus(data.error || 'Failed to update configurations');
      }
    } catch (err) {
      setSaveStatus('Network connection error while saving');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div id="settings-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-[0_25px_60px_rgba(0,0,0,0.8)] relative max-h-[90vh] flex flex-col">
        
        {/* Header bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-950/40">
          <div className="flex items-center gap-2.5 text-white font-semibold">
            <Settings className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-display">System Configuration</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content body Scrollable */}
        <form onSubmit={handleSaveSettings} className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* SMTP Mode Selection */}
          <div className="bg-zinc-950/40 border border-zinc-800/60 p-4 rounded-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-white flex items-center gap-2">
                  <Server className="w-4 h-4 text-indigo-400" />
                  SMTP Delivery Server
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Choose between the built-in sandbox server or your own custom SMTP relay.
                </p>
              </div>
              <div className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  id="smtp-toggle"
                  className="sr-only peer"
                  checked={useCustomSmtp}
                  onChange={(e) => setUseCustomSmtp(e.target.checked)}
                />
                <div className="w-11 h-6 bg-zinc-800 rounded-full peer peer-focus:ring-2 peer-focus:ring-indigo-500/20 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-zinc-400 peer-checked:after:bg-indigo-400 after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600/20 border border-zinc-700"></div>
                <span className="ml-2.5 text-xs font-mono font-bold text-zinc-400">
                  {useCustomSmtp ? 'CUSTOM' : 'SANDBOX'}
                </span>
              </div>
            </div>

            {!useCustomSmtp && (
              <div className="mt-4 p-3 bg-indigo-500/5 border border-indigo-500/10 rounded-xl text-xs text-indigo-300 leading-relaxed">
                🚀 <strong>Auto Sandbox Active:</strong> MERN Mailer will automatically generate a real, high-performance Ethereal SMTP account. Each sent mail triggers a clickable <strong>"View Test Dispatch"</strong> link inside your mail history, allowing you to instantly preview fully rendered HTML outputs. No credential setup required!
              </div>
            )}
          </div>

          {/* Custom SMTP Configuration Inputs */}
          {useCustomSmtp && (
            <div className="space-y-4 border-l-2 border-indigo-600/40 pl-4 py-1 animate-fade-in">
              <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Custom SMTP Settings</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 space-y-1">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-zinc-500">SMTP Server Host</label>
                  <input
                    type="text"
                    required={useCustomSmtp}
                    placeholder="smtp.gmail.com"
                    value={host}
                    onChange={(e) => setHost(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 text-white transition-colors"
                  />
                </div>
                
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-zinc-500">Port</label>
                  <input
                    type="number"
                    required={useCustomSmtp}
                    placeholder="587"
                    value={port}
                    onChange={(e) => setPort(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 text-white transition-colors font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 py-1">
                <input
                  type="checkbox"
                  id="secure-checkbox"
                  checked={secure}
                  onChange={(e) => setSecure(e.target.checked)}
                  className="rounded bg-zinc-950 border-zinc-800 text-indigo-600 focus:ring-indigo-500/20 focus:ring-offset-zinc-900"
                />
                <label htmlFor="secure-checkbox" className="text-xs text-zinc-400 cursor-pointer select-none">
                  SSL/TLS Secure Transport Encryption (Check for SSL Port 465, uncheck for Port 587/TLS)
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-zinc-500">SMTP Username</label>
                  <input
                    type="text"
                    required={useCustomSmtp}
                    placeholder="user@example.com"
                    value={user}
                    onChange={(e) => setUser(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 text-white transition-colors"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-zinc-500">SMTP Password</label>
                  <div className="relative">
                    <input
                      type={showPass ? 'text' : 'password'}
                      required={useCustomSmtp && !pass}
                      placeholder={pass ? "••••••••••••" : "SMTP Password"}
                      value={pass}
                      onChange={(e) => setPass(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-4 pr-11 py-2.5 text-sm focus:outline-none focus:border-indigo-500 text-white transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                      tabIndex={-1}
                    >
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-zinc-500">Default Sender Name</label>
                  <input
                    type="text"
                    required={useCustomSmtp}
                    placeholder="MERN Mailer Pro"
                    value={fromName}
                    onChange={(e) => setFromName(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 text-white transition-colors"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-zinc-500">Default Sender Email</label>
                  <input
                    type="email"
                    placeholder="defaults to username if blank"
                    value={fromAddress}
                    onChange={(e) => setFromAddress(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 text-white transition-colors"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={verifying || !host || !user}
                  className="px-4 py-2 bg-zinc-950 border border-zinc-800 hover:border-indigo-500/40 hover:bg-zinc-900 rounded-xl text-xs font-semibold text-zinc-300 transition-all flex items-center gap-2 disabled:opacity-40"
                >
                  {verifying ? 'Verifying Host Connection...' : 'Verify SMTP Relay Connection'}
                  <Play className="w-3.5 h-3.5 text-indigo-400" />
                </button>
              </div>

              {verifyResult && (
                <div className={`p-3 border rounded-xl flex items-start gap-2.5 text-xs leading-relaxed ${
                  verifyResult.success 
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                    : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                }`}>
                  {verifyResult.success ? <Check className="w-4 h-4 shrink-0 mt-0.5" /> : <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />}
                  <span>{verifyResult.message}</span>
                </div>
              )}
            </div>
          )}

          {/* Admin Lock Settings */}
          <div className="border-t border-zinc-800/80 pt-5 space-y-4">
            <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
              <Key className="w-4 h-4 text-indigo-400" />
              Administrative Credentials
            </h4>

            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-widest font-bold text-zinc-500">Change Admin Access Password</label>
              <input
                type="text"
                placeholder="Leave blank to retain current passcode"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 text-white transition-colors"
              />
            </div>
          </div>

          {/* Save status notice */}
          {saveStatus && saveStatus !== 'success' && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-400 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{saveStatus}</span>
            </div>
          )}

          {saveStatus === 'success' && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-400 flex items-start gap-2">
              <Check className="w-4 h-4 shrink-0 mt-0.5" />
              <span>Configuration file saved successfully! Hot reloading settings...</span>
            </div>
          )}

        </form>

        {/* Footer controls */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-zinc-800 bg-zinc-950/40">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold border border-zinc-700 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSaveSettings}
            disabled={saving}
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-[0_0_20px_rgba(79,70,229,0.3)] disabled:opacity-50"
          >
            {saving ? 'Saving Config...' : 'Apply Configuration'}
          </button>
        </div>

      </div>
    </div>
  );
}
