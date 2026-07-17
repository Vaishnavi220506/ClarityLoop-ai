'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import Link from 'next/link';
import {
  Brain, MessageSquare, FolderOpen, Settings, Shield,
  Zap, Eye, ExternalLink, CheckCircle2, AlertCircle, Home,
} from 'lucide-react';
import { health, updatePreferences } from '@/lib/api';
import { usePreferencesStore } from '@/stores';

type HealthStatus = Awaited<ReturnType<typeof health>>;

function SidebarNav() {
  return (
    <aside className="sidebar" style={{ flexShrink: 0 }}>
      <div style={{ padding: '16px 14px', borderBottom: '1px solid var(--border-subtle)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 10, background: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Brain size={16} color="white" />
          </div>
          <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>ClarityLoop</span>
        </div>
      </div>
      <nav style={{ flex: 1, padding: 8 }}>
        <Link href="/" className="sidebar-item" style={{ textDecoration: 'none' }}>
          <Home size={14} /> Home
        </Link>
        <Link href="/chat" className="sidebar-item" style={{ textDecoration: 'none' }}>
          <MessageSquare size={14} /> Chat
        </Link>
        <Link href="/projects" className="sidebar-item" style={{ textDecoration: 'none' }}>
          <FolderOpen size={14} /> Projects
        </Link>
        <Link href="/settings" className="sidebar-item active" style={{ textDecoration: 'none' }}>
          <Settings size={14} /> Settings
        </Link>
      </nav>
    </aside>
  );
}

export default function SettingsPage() {
  const { preferences, setPreferences } = usePreferencesStore();
  const [status, setStatus] = useState<HealthStatus | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    health().then(setStatus).catch(() => {});
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updatePreferences(preferences);
      toast.success('Preferences saved');
    } catch { toast.error('Failed to save'); }
    finally { setSaving(false); }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <SidebarNav />
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <header style={{ padding: '20px 32px', borderBottom: '1px solid var(--border-subtle)' }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>Settings</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>Configure your ClarityLoop experience</p>
        </header>

        <main style={{ padding: '24px 32px', maxWidth: 680 }}>
          {/* API & Provider Status */}
          <section style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: 24, marginBottom: 20 }}>
            <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Zap size={16} style={{ color: 'var(--accent-primary)' }} /> API & Provider Status
            </h2>
            {status ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Active Provider</span>
                  <span style={{ fontSize: 12, fontWeight: 600, padding: '4px 12px', borderRadius: 20, background: status.provider === 'demo' ? 'rgba(251,191,36,0.1)' : 'rgba(52,211,153,0.1)', color: status.provider === 'demo' ? 'var(--warning)' : 'var(--success)' }}>
                    {status.provider === 'gemini' ? '✓ Google Gemini' : status.provider === 'openai' ? '✓ OpenAI' : '⚠ Demo Mode'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Model</span>
                  <span style={{ fontSize: 12, padding: '4px 12px', borderRadius: 8, background: 'var(--bg-tertiary)', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{status.model}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>API Key</span>
                  <span style={{ fontSize: 12, padding: '4px 12px', borderRadius: 20, background: status.has_api_key ? 'rgba(52,211,153,0.1)' : 'rgba(251,191,36,0.1)', color: status.has_api_key ? 'var(--success)' : 'var(--warning)' }}>
                    {status.has_api_key ? '✓ Configured' : '⚠ Not set'}
                  </span>
                </div>
                {!status.has_api_key && (
                  <div style={{ marginTop: 8, padding: 14, borderRadius: 'var(--radius-md)', background: 'rgba(124,92,252,0.05)', border: '1px solid rgba(124,92,252,0.15)' }}>
                    <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                      <strong style={{ color: 'var(--accent-secondary)' }}>Get a free Gemini API key:</strong><br />
                      1. Go to <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener" style={{ color: 'var(--accent-secondary)', textDecoration: 'underline' }}>aistudio.google.com/apikey</a><br />
                      2. Click &quot;Create API key&quot; (no billing required)<br />
                      3. Paste it as <code style={{ fontSize: 11, background: 'var(--bg-tertiary)', padding: '2px 6px', borderRadius: 4 }}>GEMINI_API_KEY=your-key</code> in <code style={{ fontSize: 11, background: 'var(--bg-tertiary)', padding: '2px 6px', borderRadius: 4 }}>backend/.env</code><br />
                      4. Restart the backend server
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="skeleton" style={{ height: 100 }} />
            )}
          </section>

          <section style={{ background: 'linear-gradient(135deg, rgba(124,92,252,0.10), rgba(16,185,129,0.06))', border: '1px solid rgba(124,92,252,0.28)', borderRadius: 'var(--radius-lg)', padding: 24, marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <Shield size={16} style={{ color: 'var(--accent-secondary)' }} />
                  <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>Free local AI</h2>
                </div>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: 430 }}>
                  Run answers privately on this computer with Ollama. No API key or per-message charges.
                </p>
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, padding: '5px 10px', borderRadius: 20, background: status?.provider === 'ollama' ? 'rgba(52,211,153,0.14)' : 'rgba(255,255,255,0.06)', color: status?.provider === 'ollama' ? 'var(--success)' : 'var(--text-muted)' }}>
                {status?.provider === 'ollama' ? 'Active' : 'Optional'}
              </span>
            </div>
            <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '10px 14px', alignItems: 'center', fontSize: 12 }}>
              <span style={{ color: 'var(--text-muted)' }}>Recommended model</span>
              <code style={{ width: 'fit-content', color: 'var(--text-primary)', background: 'var(--bg-tertiary)', padding: '5px 8px', borderRadius: 6 }}>llama3.2:3b</code>
              <span style={{ color: 'var(--text-muted)' }}>One-time setup</span>
              <code style={{ color: 'var(--text-primary)', background: 'var(--bg-tertiary)', padding: '7px 9px', borderRadius: 6, overflowX: 'auto' }}>ollama pull llama3.2:3b</code>
            </div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 18 }}>
              <a href="https://ollama.com/download" target="_blank" rel="noopener" className="btn-primary" style={{ textDecoration: 'none', fontSize: 12, padding: '8px 12px' }}>
                Install Ollama <ExternalLink size={13} />
              </a>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', alignSelf: 'center' }}>Then set <code>OLLAMA_ENABLED=true</code> in <code>backend/.env</code> and restart the backend.</span>
            </div>
          </section>

          {/* Answer Preferences */}
          <section style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: 24, marginBottom: 20 }}>
            <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 16 }}>Answer Preferences</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[
                { label: 'Default answer depth', key: 'answer_depth' as const, options: ['quick', 'simple', 'adaptive', 'detailed', 'step_by_step', 'technical'] },
                { label: 'Skill level', key: 'skill_level' as const, options: ['beginner', 'intermediate', 'advanced'] },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>{f.label}</label>
                  <select
                    value={preferences[f.key] as string}
                    onChange={(e) => setPreferences({ [f.key]: e.target.value })}
                    style={{
                      width: '100%', background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)', padding: '10px 14px', fontSize: 13,
                      color: 'var(--text-primary)', outline: 'none',
                    }}
                  >
                    {f.options.map(o => <option key={o} value={o}>{o.replace('_', ' ')}</option>)}
                  </select>
                </div>
              ))}
              <div>
                <label style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>Preferred language</label>
                <input
                  value={preferences.preferred_language}
                  onChange={(e) => setPreferences({ preferred_language: e.target.value })}
                  style={{
                    width: '100%', background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)', padding: '10px 14px', fontSize: 13,
                    color: 'var(--text-primary)', outline: 'none',
                  }}
                />
              </div>
            </div>
          </section>

          {/* Focus Mode */}
          <section style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: 24, marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>Adaptive Focus Mode</h3>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Activates when you appear stuck on a task</p>
              </div>
              <button
                onClick={() => setPreferences({ focus_mode_preference: !preferences.focus_mode_preference })}
                style={{
                  width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer',
                  background: preferences.focus_mode_preference ? 'var(--accent-primary)' : 'var(--bg-elevated)',
                  position: 'relative', transition: 'background var(--transition-fast)',
                }}
              >
                <motion.div
                  animate={{ x: preferences.focus_mode_preference ? 22 : 3 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  style={{ width: 18, height: 18, borderRadius: 9, background: 'white', position: 'absolute', top: 3 }}
                />
              </button>
            </div>
          </section>

          <button onClick={handleSave} disabled={saving} className="btn-primary" style={{ width: '100%', padding: '12px' }}>
            {saving ? 'Saving…' : 'Save Preferences'}
          </button>
        </main>
      </div>
    </div>
  );
}
