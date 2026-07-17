'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Plus, FolderOpen, Settings, MessageSquare, Brain, Search, LayoutDashboard, Home, X, CheckSquare, GitBranch, Bookmark } from 'lucide-react';
import { listProjects, createProject } from '@/lib/api';
import type { Project } from '@/types';
import { VERDICT_LABELS, VERDICT_COLORS, cn } from '@/lib/utils';
import Link from 'next/link';

// ── Sidebar ───────────────────────────────────────────────────────────────────

function Sidebar() {
  return (
    <aside className="sidebar" style={{ flexShrink: 0, width: 260 }}>
      {/* Logo */}
      <div style={{ padding: '14px 14px 12px', borderBottom: '1px solid var(--border-subtle)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 12 }}>
          <div style={{ width: 26, height: 26, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--accent-gradient)', flexShrink: 0 }}>
            <Brain size={13} color="white" />
          </div>
          <span style={{ fontWeight: 700, fontSize: 13, letterSpacing: '-0.03em', color: 'var(--text-primary)' }}>ClarityLoop</span>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto" style={{ padding: '12px 8px' }}>
        <div style={{ padding: '0 8px 6px', fontSize: 10, fontWeight: 650, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Menu</div>
        
        <Link href="/" className="sidebar-item" style={{ textDecoration: 'none', padding: '8px 12px' }}>
          <Home size={13} style={{ opacity: 0.7 }} />
          <span>Home</span>
        </Link>
        
        <Link href="/chat" className="sidebar-item" style={{ textDecoration: 'none', padding: '8px 12px' }}>
          <MessageSquare size={13} style={{ opacity: 0.7 }} />
          <span>Chat</span>
        </Link>
        
        <Link href="/projects" className="sidebar-item active" style={{ textDecoration: 'none', padding: '8px 12px' }}>
          <FolderOpen size={13} style={{ opacity: 0.7 }} />
          <span>Projects</span>
        </Link>
        
        <Link href="/settings" className="sidebar-item" style={{ textDecoration: 'none', padding: '8px 12px' }}>
          <Settings size={13} style={{ opacity: 0.7 }} />
          <span>Settings</span>
        </Link>
      </nav>
    </aside>
  );
}

// ── Verdict Badge ─────────────────────────────────────────────────────────────

function VerdictBadge({ verdict }: { verdict?: string }) {
  if (!verdict) return <span style={{ fontSize: 11, color: 'var(--text-muted)', background: 'var(--bg-tertiary)', padding: '2px 8px', borderRadius: 12 }}>No assessment</span>;
  const key = verdict as keyof typeof VERDICT_LABELS;
  const colorClass = VERDICT_COLORS[key] || 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';
  
  // Convert Tailwind classes to inline styles for consistency with the new design system
  let bg = 'rgba(255,255,255,0.05)', color = 'var(--text-secondary)', border = 'var(--border-subtle)';
  if (colorClass.includes('emerald')) { bg = 'rgba(16,185,129,0.1)'; color = 'var(--success)'; border = 'rgba(16,185,129,0.2)'; }
  if (colorClass.includes('amber')) { bg = 'rgba(245,158,11,0.1)'; color = 'var(--warning)'; border = 'rgba(245,158,11,0.2)'; }
  if (colorClass.includes('rose')) { bg = 'rgba(244,63,94,0.1)'; color = 'var(--danger)'; border = 'rgba(244,63,94,0.2)'; }
  
  return (
    <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 12, background: bg, color, border: `1px solid ${border}`, letterSpacing: '0.02em' }}>
      {VERDICT_LABELS[key] || verdict}
    </span>
  );
}

// ── Project Card ──────────────────────────────────────────────────────────────

function ProjectCard({ project }: { project: Project }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} whileHover={{ y: -3 }} transition={{ duration: 0.25 }}>
      <Link href={`/projects/${project.id}`} style={{ textDecoration: 'none', display: 'block' }}>
        <div style={{
          padding: 20, borderRadius: 'var(--radius-xl)',
          background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
          transition: 'all var(--transition-smooth)', cursor: 'pointer', height: '100%',
          display: 'flex', flexDirection: 'column',
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(124,58,237,0.3)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 24px rgba(0,0,0,0.2)'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border-subtle)'; (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'; }}>
          
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ flex: 1, minWidth: 0, paddingRight: 12 }}>
              <h3 style={{ fontSize: 15, fontWeight: 650, color: 'var(--text-primary)', letterSpacing: '-0.02em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {project.title}
              </h3>
              {project.description && (
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {project.description}
                </p>
              )}
            </div>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <LayoutDashboard size={14} style={{ color: 'var(--text-muted)' }} />
            </div>
          </div>

          <div style={{ marginTop: 'auto', paddingTop: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <VerdictBadge verdict={project.current_verdict} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>{project.progress_pct}%</span>
              <div style={{ width: 64, height: 4, background: 'var(--bg-tertiary)', borderRadius: 2, overflow: 'hidden' }}>
                <motion.div initial={{ width: 0 }} animate={{ width: `${project.progress_pct}%` }} style={{ height: '100%', background: 'var(--accent-gradient)', borderRadius: 2 }} />
              </div>
            </div>
          </div>

          {project.is_demo && (
            <div style={{ marginTop: 12, fontSize: 10, color: 'var(--warning)', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Demo Project</div>
          )}
        </div>
      </Link>
    </motion.div>
  );
}

// ── New Project Modal ─────────────────────────────────────────────────────────

function NewProjectModal({ onClose, onCreated }: { onClose: () => void; onCreated: (p: Project) => void }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);
    try {
      const project = await createProject({ title: title.trim(), description: description.trim() || undefined });
      toast.success('Project created');
      onCreated(project);
      onClose();
    } catch (err: unknown) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 20 }} onClick={onClose}>
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-2xl)', padding: 24, width: '100%', maxWidth: 420, boxShadow: '0 24px 48px rgba(0,0,0,0.4)' }}
        onClick={(e) => e.stopPropagation()}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 20, letterSpacing: '-0.02em' }}>New Project</h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6, fontWeight: 500 }}>Project title *</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. AI Recommendation Engine" autoFocus
              style={{ width: '100%', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '10px 14px', fontSize: 14, color: 'var(--text-primary)', outline: 'none', transition: 'border-color var(--transition-fast)' }}
              onFocus={e => e.target.style.borderColor = 'var(--accent-primary)'} onBlur={e => e.target.style.borderColor = 'var(--border-subtle)'}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6, fontWeight: 500 }}>Description (optional)</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What are you trying to build?" rows={3}
              style={{ width: '100%', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '10px 14px', fontSize: 14, color: 'var(--text-primary)', outline: 'none', transition: 'border-color var(--transition-fast)', resize: 'none' }}
              onFocus={e => e.target.style.borderColor = 'var(--accent-primary)'} onBlur={e => e.target.style.borderColor = 'var(--border-subtle)'}
            />
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: '10px', borderRadius: 'var(--radius-md)', background: 'transparent', border: '1px solid var(--border-default)', color: 'var(--text-secondary)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
            <button type="submit" disabled={!title.trim() || loading} style={{ flex: 1, padding: '10px', borderRadius: 'var(--radius-md)', background: 'var(--accent-gradient)', border: 'none', color: 'white', fontSize: 13, fontWeight: 600, cursor: (!title.trim() || loading) ? 'not-allowed' : 'pointer', opacity: (!title.trim() || loading) ? 0.5 : 1 }}>
              {loading ? 'Creating…' : 'Create Project'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ── Onboarding Modal ─────────────────────────────────────────────────────────

function OnboardingModal({ onClose }: { onClose: () => void }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 20 }} onClick={onClose}>
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-2xl)', padding: 32, width: '100%', maxWidth: 500, boxShadow: '0 24px 48px rgba(0,0,0,0.4)', position: 'relative' }}
        onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}><X size={16} /></button>
        <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
          <FolderOpen size={24} style={{ color: 'var(--accent-primary)' }} />
        </div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12, letterSpacing: '-0.02em' }}>Welcome to Project Workspaces</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
          Convert your chat insights into persistent projects. Here's what you can do inside a project workspace:
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 32 }}>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><CheckSquare size={16} style={{ color: 'var(--success)' }} /></div>
            <div><strong style={{ display: 'block', fontSize: 14, color: 'var(--text-primary)' }}>Task Management</strong><span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Auto-generate execution steps from feasibility assessments.</span></div>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(59,130,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><GitBranch size={16} style={{ color: 'var(--info)' }} /></div>
            <div><strong style={{ display: 'block', fontSize: 14, color: 'var(--text-primary)' }}>Branching Options</strong><span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Explore alternative technical paths without losing your main thread.</span></div>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(245,158,11,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Bookmark size={16} style={{ color: 'var(--warning)' }} /></div>
            <div><strong style={{ display: 'block', fontSize: 14, color: 'var(--text-primary)' }}>Assumption Tracking</strong><span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Log unverified claims and track evidence for each hypothesis.</span></div>
          </div>
        </div>
        <button onClick={onClose} className="btn-primary" style={{ width: '100%', padding: 12, justifyContent: 'center' }}>Got it, let's build</button>
      </motion.div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem('clarityloop_projects_onboarded')) {
      setShowOnboarding(true);
    }
    listProjects()
      .then(setProjects)
      .catch(() => toast.error('Failed to load projects'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--bg-primary)' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        
        {/* Header */}
        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', height: 60, borderBottom: '1px solid var(--border-subtle)', flexShrink: 0 }}>
          <h1 style={{ fontSize: 16, fontWeight: 650, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>Projects</h1>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input type="text" placeholder="Search projects..." 
                style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-full)', padding: '6px 16px 6px 32px', fontSize: 13, color: 'var(--text-primary)', outline: 'none', width: 200 }} 
              />
            </div>
            <button onClick={() => setShowNew(true)} className="btn-primary" style={{ padding: '6px 16px', fontSize: 13, gap: 6 }}>
              <Plus size={14} /> New Project
            </button>
          </div>
        </header>

        <main style={{ flex: 1, overflowY: 'auto', padding: '32px 24px' }}>
          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
              {[...Array(3)].map((_, i) => (
                <div key={i} style={{ height: 140, borderRadius: 'var(--radius-xl)', background: 'var(--bg-elevated)', animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }} />
              ))}
            </div>
          ) : projects.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: 400 }}>
              <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                style={{ 
                  width: 64, height: 64, borderRadius: 16, marginBottom: 24,
                  background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: 'inset 0 0 20px rgba(124,58,237,0.1), 0 0 32px rgba(124,58,237,0.15)',
                }}>
                <FolderOpen size={28} style={{ color: 'var(--accent-primary)', opacity: 0.9 }} strokeWidth={1.5} />
              </motion.div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8, letterSpacing: '-0.02em' }}>No projects yet</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 24, maxWidth: 320, textAlign: 'center', lineHeight: 1.6 }}>
                Create a project to track feasibility, tasks and branches in a dedicated workspace.
              </p>
              <button onClick={() => setShowNew(true)} className="btn-primary" style={{ padding: '10px 20px', fontSize: 14, gap: 8 }}>
                <Plus size={16} /> Create your first project
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
              {projects.map((p) => (
                <ProjectCard key={p.id} project={p} />
              ))}
            </div>
          )}
        </main>
      </div>

      <AnimatePresence>
        {showNew && <NewProjectModal onClose={() => setShowNew(false)} onCreated={(p) => setProjects((prev) => [p, ...prev])} />}
        {showOnboarding && (
          <OnboardingModal onClose={() => {
            setShowOnboarding(false);
            localStorage.setItem('clarityloop_projects_onboarded', 'true');
          }} />
        )}
      </AnimatePresence>
    </div>
  );
}
