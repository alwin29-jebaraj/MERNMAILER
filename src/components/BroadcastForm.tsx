import React, { useState, useEffect, useRef } from 'react';
import { PenTool, Mail, Sparkles, Send, Play, FileText, CheckCircle2, AlertCircle, Eye, Code } from 'lucide-react';

interface BroadcastFormProps {
  onDispatchSuccess: () => void;
  adminEmail: string;
}

export default function BroadcastForm({ onDispatchSuccess, adminEmail }: BroadcastFormProps) {
  const [subject, setSubject] = useState('October Update: Beautiful Bento Themes & Node SMTP Relays');
  const [recipientsInput, setRecipientsInput] = useState('dev-team@internal.org, marketing-global@external.co, c-suite@hq.com, partners@active.net');
  const [body, setBody] = useState(`<div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background-color: #09090b; color: #e4e4e7; border-radius: 16px; border: 1px solid #27272a;">
  <div style="text-align: center; margin-bottom: 30px;">
    <div style="display: inline-block; padding: 12px; background-color: rgba(79, 70, 229, 0.1); border-radius: 12px; border: 1px solid rgba(79, 70, 229, 0.3); color: #818cf8; font-size: 24px; font-weight: bold; margin-bottom: 10px;">
      M
    </div>
    <h1 style="color: #ffffff; font-size: 22px; font-weight: 700; margin: 0; tracking: -0.025em;">MERN Mailer <span style="color: #818cf8; font-weight: 400;">Pro</span></h1>
    <p style="font-size: 11px; color: #71717a; text-transform: uppercase; letter-spacing: 0.15em; margin: 4px 0 0 0;">Bulk Communication Engine</p>
  </div>
  
  <div style="background-color: #18181b; border: 1px solid #27272a; padding: 25px; border-radius: 12px; margin-bottom: 30px;">
    <h2 style="color: #ffffff; font-size: 16px; margin-top: 0;">Hi Team,</h2>
    <p style="font-size: 14px; line-height: 1.6; color: #a1a1aa;">Excited to announce the MERN Bulk Mailer is now live in production. This custom engine features:</p>
    <ul style="color: #a1a1aa; font-size: 13px; line-height: 1.7; padding-left: 20px;">
      <li><strong style="color: #e4e4e7;">MongoDB Persistence logs</strong> for complete historic record tracking</li>
      <li><strong style="color: #e4e4e7;">Multi-threaded Node.js express dispatcher</strong> utilizing lazy loading SMTP connections</li>
      <li><strong style="color: #e4e4e7;">Premium dark Bento Grid console</strong> with client-side visual state monitors</li>
    </ul>
    <p style="font-size: 14px; line-height: 1.6; color: #a1a1aa; margin-top: 15px;">Check out the administrative dashboard for real-time connection status and detailed dispatch diagnostics.</p>
  </div>

  <div style="text-align: center; margin-top: 35px; margin-bottom: 25px;">
    <a href="#" style="background-color: #4f46e5; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 13px; box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3); display: inline-block;">Explore Admin Console</a>
  </div>

  <hr style="border: 0; border-top: 1px solid #27272a; margin: 30px 0;">
  
  <p style="font-size: 11px; text-align: center; color: #52525b; margin: 0; font-family: monospace;">
    MERN Mailer Pro Engine v1.2 // SECURE INTERNAL DISPATCH // PORT: 3000
  </p>
</div>`);

  // Active view tab: 'edit' or 'preview'
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  
  // AI Composer States
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiTone, setAiTone] = useState('professional');
  const [aiAudience, setAiAudience] = useState('subscribers');
  const [aiComposing, setAiComposing] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiExpanded, setAiExpanded] = useState(false);

  // Send Action States
  const [sendingState, setSendingState] = useState<'idle' | 'sending' | 'success' | 'failed'>('idle');
  const [sendLogs, setSendLogs] = useState<string[]>([]);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Recipient list calculations
  const [validEmails, setValidEmails] = useState<string[]>([]);
  const [invalidEmails, setInvalidEmails] = useState<string[]>([]);

  useEffect(() => {
    const raw = recipientsInput.split(',')
      .map(e => e.trim())
      .filter(Boolean);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const valids: string[] = [];
    const invalids: string[] = [];

    raw.forEach(email => {
      if (emailRegex.test(email)) {
        valids.push(email);
      } else {
        invalids.push(email);
      }
    });

    setValidEmails(valids);
    setInvalidEmails(invalids);
  }, [recipientsInput]);

  const handleAiCompose = async () => {
    if (!aiPrompt.trim()) return;

    setAiComposing(true);
    setAiError(null);

    try {
      const response = await fetch('/api/ai/compose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: aiPrompt,
          tone: aiTone,
          audience: aiAudience
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setSubject(data.subject || 'AI Generated Bulk Subject');
        setBody(data.body || '');
        setAiPrompt('');
        setAiExpanded(false); // contract AI helper on successful generation
      } else {
        setAiError(data.error || 'Failed to compose email using Gemini AI');
      }
    } catch (err) {
      setAiError('Connection timeout. Is the server running with process.env.GEMINI_API_KEY?');
    } finally {
      setAiComposing(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!subject.trim()) return;
    
    setSendingState('sending');
    setStatusMessage('Saving draft in MongoDB...');

    try {
      const response = await fetch('/api/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject,
          body,
          recipients: validEmails.length > 0 ? validEmails : ['draft@mernmailer.internal'],
          status: 'DRAFT'
        }),
      });

      if (response.ok) {
        setSendingState('success');
        setStatusMessage('Draft successfully stored in database.');
        onDispatchSuccess();
        setTimeout(() => setSendingState('idle'), 2000);
      } else {
        setSendingState('failed');
        setStatusMessage('Failed to save draft to local JSON storage.');
      }
    } catch (err) {
      setSendingState('failed');
      setStatusMessage('Connection failure during draft save');
    }
  };

  const handleTestSend = async () => {
    if (!subject.trim() || !body.trim()) return;
    
    setSendingState('sending');
    setStatusMessage(`Sending express test dispatch to: ${adminEmail || 'admin-test@ethereal.email'}...`);

    try {
      const response = await fetch('/api/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: `[TEST COMPOSITION] - ${subject}`,
          body,
          recipients: [adminEmail || 'admin-test@ethereal.email'],
          status: 'SEND'
        }),
      });

      if (response.ok) {
        setSendingState('success');
        setStatusMessage('Test message successfully sent! Real-time previews updating below.');
        onDispatchSuccess();
        setTimeout(() => setSendingState('idle'), 3000);
      } else {
        setSendingState('failed');
        setStatusMessage('SMTP validation failed during single test dispatch.');
      }
    } catch (err) {
      setSendingState('failed');
      setStatusMessage('SMTP Server Connection Error');
    }
  };

  const handleDeployBroadcast = async () => {
    if (validEmails.length === 0) return;
    
    setSendingState('sending');
    setStatusMessage(`Broadcasting bulk mail threads to ${validEmails.length} recipients...`);

    try {
      const response = await fetch('/api/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject,
          body,
          recipients: validEmails,
          status: 'SEND'
        }),
      });

      if (response.ok) {
        setSendingState('success');
        setStatusMessage(`Bulk delivery successfully triggered! Threads are sending asynchronously.`);
        onDispatchSuccess();
        setTimeout(() => setSendingState('idle'), 3000);
      } else {
        setSendingState('failed');
        setStatusMessage('Failed to initialize Express nodemailer threads.');
      }
    } catch (err) {
      setSendingState('failed');
      setStatusMessage('Connection failure during bulk dispatch initialization');
    }
  };

  // Helper formatting snippet triggers
  const insertSnippet = (snippet: string) => {
    setBody(prev => prev + '\n' + snippet);
  };

  return (
    <div id="broadcast-compose-form" className="col-span-12 lg:col-span-8 bg-zinc-900 border border-zinc-800 rounded-3xl p-6 flex flex-col justify-between">
      
      {/* Form Title & Meta info */}
      <div className="flex justify-between items-center mb-5">
        <h2 className="text-white font-semibold flex items-center gap-2 font-display">
          <PenTool className="w-5 h-5 text-indigo-500 animate-pulse" />
          Mail Broadcast Composer
        </h2>
        <span className="text-[10px] bg-zinc-950 text-zinc-500 px-2.5 py-1 rounded border border-zinc-800 font-mono tracking-wider">
          NODEMAILER_V9.0_EXPRESS
        </span>
      </div>

      {/* Inputs Stack */}
      <div className="space-y-4 flex-1">
        
        {/* Subject Line Input */}
        <div className="space-y-1">
          <label className="text-[10px] uppercase tracking-widest font-bold text-zinc-500 ml-1 block">Subject Line</label>
          <input 
            type="text" 
            placeholder="Enter catchy email subject..." 
            value={subject} 
            onChange={(e) => setSubject(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 text-sm text-white font-medium transition-colors placeholder:text-zinc-600"
          />
        </div>
        
        {/* Recipients Comma List */}
        <div className="space-y-1">
          <div className="flex justify-between items-end ml-1 mb-1">
            <label className="text-[10px] uppercase tracking-widest font-bold text-zinc-500 block">
              Recipient List (Comma Separated)
            </label>
            <div className="flex gap-2">
              {validEmails.length > 0 && (
                <span className="text-[9px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono px-2 py-0.5 rounded-full font-bold">
                  {validEmails.length} Verified
                </span>
              )}
              {invalidEmails.length > 0 && (
                <span className="text-[9px] bg-rose-500/10 border border-rose-500/20 text-rose-400 font-mono px-2 py-0.5 rounded-full font-bold">
                  {invalidEmails.length} Invalid
                </span>
              )}
            </div>
          </div>
          <textarea 
            placeholder="jane@example.com, bob@design.co, user-sub@domain.net..." 
            value={recipientsInput}
            onChange={(e) => setRecipientsInput(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 focus:outline-none focus:border-indigo-500 text-xs font-mono h-14 resize-none text-zinc-300 transition-colors placeholder:text-zinc-700"
          />
        </div>

        {/* Gemini Smart Assistant Section */}
        <div className="bg-zinc-950/40 border border-zinc-800 rounded-2xl overflow-hidden transition-all duration-300">
          <button
            type="button"
            onClick={() => setAiExpanded(!aiExpanded)}
            className="w-full flex justify-between items-center px-4 py-3 bg-indigo-950/10 hover:bg-indigo-950/20 text-zinc-300 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400 animate-bounce" />
              <span className="text-xs font-semibold text-white">✨ AI Smart Composition Assistant</span>
            </div>
            <span className="text-[10px] text-zinc-500 font-mono">
              {aiExpanded ? 'COLLAPSE' : 'EXPAND'}
            </span>
          </button>

          {aiExpanded && (
            <div className="p-4 space-y-4 border-t border-zinc-850/80 animate-fade-in">
              <div className="space-y-1">
                <label className="text-[9px] uppercase tracking-widest font-bold text-zinc-500">What should this bulk email be about?</label>
                <textarea
                  placeholder="e.g. Write a marketing newsletter announcing our new summer collection with discount code SUMMER25. Include CTA buttons."
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  rows={2}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs focus:outline-none focus:border-indigo-500 text-zinc-300 placeholder:text-zinc-600"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] uppercase tracking-widest font-bold text-zinc-500">Tone of Voice</label>
                  <select
                    value={aiTone}
                    onChange={(e) => setAiTone(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-xs focus:outline-none focus:border-indigo-500 text-zinc-400 font-medium"
                  >
                    <option value="professional">👔 Executive Professional</option>
                    <option value="enthusiastic">🎉 High Energy Enthusiastic</option>
                    <option value="persuasive">🔥 Persuasive Marketing</option>
                    <option value="minimalist">✏️ Clean & Minimalist</option>
                    <option value="critical">⚠️ Critical Alert Warning</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] uppercase tracking-widest font-bold text-zinc-500">Target Audience</label>
                  <select
                    value={aiAudience}
                    onChange={(e) => setAiAudience(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-xs focus:outline-none focus:border-indigo-500 text-zinc-400 font-medium"
                  >
                    <option value="subscribers">👥 General Newsletter Subscribers</option>
                    <option value="developers">💻 Software Developers / Tech-savvy</option>
                    <option value="business partners">🤝 Enterprise B2B Clients</option>
                    <option value="internal employees">🏢 Internal Company Staff</option>
                  </select>
                </div>
              </div>

              {aiError && (
                <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-[11px] text-rose-400 flex items-start gap-2 animate-pulse">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>{aiError}</span>
                </div>
              )}

              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={handleAiCompose}
                  disabled={aiComposing || !aiPrompt.trim()}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition-all shadow-[0_0_20px_rgba(79,70,229,0.3)] flex items-center gap-2 group"
                >
                  {aiComposing ? 'Composing HTML Template...' : 'Draft with Gemini AI'}
                  {!aiComposing && <Sparkles className="w-3.5 h-3.5 group-hover:rotate-12 transition-transform text-amber-300" />}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Dual Tabs Message Body */}
        <div className="flex-grow flex flex-col min-h-[300px]">
          <div className="flex justify-between items-center ml-1 mb-1">
            <label className="text-[10px] uppercase tracking-widest font-bold text-zinc-500">Message Body (HTML Supported)</label>
            
            {/* Tab Swappers */}
            <div className="flex items-center gap-1 bg-zinc-950 border border-zinc-850 p-0.5 rounded-lg">
              <button
                type="button"
                onClick={() => setActiveTab('edit')}
                className={`px-3 py-1 rounded-md text-[10px] font-bold flex items-center gap-1.5 transition-all ${
                  activeTab === 'edit' 
                    ? 'bg-zinc-800 text-white shadow-sm' 
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <Code className="w-3 h-3" />
                HTML CODE
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('preview')}
                className={`px-3 py-1 rounded-md text-[10px] font-bold flex items-center gap-1.5 transition-all ${
                  activeTab === 'preview' 
                    ? 'bg-zinc-800 text-white shadow-sm' 
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <Eye className="w-3 h-3" />
                VISUAL PREVIEW
              </button>
            </div>
          </div>

          {activeTab === 'edit' ? (
            <div className="flex-grow flex flex-col bg-zinc-950 border border-zinc-800 rounded-xl p-3 h-64 overflow-hidden relative">
              {/* Snippet insertion buttons bar */}
              <div className="flex flex-wrap gap-1.5 mb-2.5 pb-2 border-b border-zinc-800/80">
                <button
                  type="button"
                  onClick={() => insertSnippet('<strong style="color: #ffffff;">Text</strong>')}
                  className="px-2 py-1 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded text-[9px] font-mono text-zinc-400"
                >
                  [Bold]
                </button>
                <button
                  type="button"
                  onClick={() => insertSnippet('<a href="#" style="color: #818cf8; text-decoration: underline;">Link Text</a>')}
                  className="px-2 py-1 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded text-[9px] font-mono text-zinc-400"
                >
                  [Link]
                </button>
                <button
                  type="button"
                  onClick={() => insertSnippet('<div style="text-align: center; margin: 20px 0;"><a href="#" style="background-color: #4f46e5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">CTA BUTTON</a></div>')}
                  className="px-2 py-1 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded text-[9px] font-mono text-zinc-400"
                >
                  [Button CTA]
                </button>
                <button
                  type="button"
                  onClick={() => insertSnippet('<div style="background-color: #18181b; border: 1px solid #27272a; padding: 15px; border-radius: 8px; margin: 15px 0;">Content</div>')}
                  className="px-2 py-1 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded text-[9px] font-mono text-zinc-400"
                >
                  [Card Panel]
                </button>
              </div>

              <textarea 
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="flex-1 bg-transparent border-none outline-none focus:ring-0 text-zinc-300 font-mono text-xs w-full h-full resize-none scrollbar-none overflow-y-auto"
              />
            </div>
          ) : (
            <div className="flex-grow bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden h-64 p-1">
              <iframe
                title="Email visual output render"
                srcDoc={body}
                className="w-full h-full border-none rounded-lg bg-zinc-950"
                sandbox="allow-same-origin"
              />
            </div>
          )}
        </div>
      </div>

      {/* Sending actions & states banner */}
      <div className="mt-5 space-y-4">
        {sendingState !== 'idle' && (
          <div className={`p-3 border rounded-xl flex items-start gap-2.5 text-xs animate-fade-in ${
            sendingState === 'sending' 
              ? 'bg-indigo-500/5 border-indigo-500/10 text-indigo-400'
              : sendingState === 'success' 
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
              : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
          }`}>
            {sendingState === 'sending' && <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin shrink-0 mt-0.5" />}
            {sendingState === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />}
            {sendingState === 'failed' && <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />}
            <span className="font-medium">{statusMessage}</span>
          </div>
        )}

        {/* Footer controls */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-zinc-800/60">
          <div className="flex gap-2">
            <button 
              type="button"
              onClick={handleSaveDraft}
              disabled={sendingState === 'sending'}
              className="px-4 py-2.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-zinc-300 text-xs font-semibold border border-zinc-800 hover:border-zinc-700 transition-colors disabled:opacity-50"
            >
              Save Draft
            </button>
            <button 
              type="button"
              onClick={handleTestSend}
              disabled={sendingState === 'sending'}
              className="px-4 py-2.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-zinc-300 text-xs font-semibold border border-zinc-800 hover:border-zinc-700 transition-colors disabled:opacity-50"
            >
              Test Send
            </button>
          </div>

          <button 
            type="button"
            onClick={handleDeployBroadcast}
            disabled={sendingState === 'sending' || validEmails.length === 0}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-[0_0_25px_rgba(79,70,229,0.35)] hover:shadow-[0_0_35px_rgba(79,70,229,0.5)] transition-all flex items-center gap-2 group disabled:opacity-40"
          >
            Deploy Broadcast
            <Send className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>

    </div>
  );
}
