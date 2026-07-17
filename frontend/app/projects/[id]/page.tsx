'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import Link from 'next/link';
import { use } from 'react';
import {
  getProject, listTasks, listBranches, listAssumptions, getProjectAssessments, assessFeasibility,
  completeTask, createBranch, updateAssumption,
} from '@/lib/api';
import type { Project, Task, Branch, Assumption, FeasibilityAssessment } from '@/types';
import { VERDICT_LABELS, VERDICT_COLORS, TASK_STATUS_LABELS, TASK_STATUS_COLORS, parseJsonSafe, cn } from '@/lib/utils';
import { 
  ArrowLeft, Home, BarChart2, CheckSquare, GitBranch, Search, 
  Bookmark, Zap, CheckCircle2, AlertTriangle, Lightbulb 
} from 'lucide-react';

// ── Sidebar ───────────────────────────────────────────────────────────────────

function Sidebar({ projectId }: { projectId: string }) {
  return (
    <aside className="sidebar" style={{ flexShrink: 0, width: 260 }}>
      <div style={{ padding: '14px 14px 12px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: 6 }}>
        <Link href="/" className="sidebar-item" style={{ textDecoration: 'none', padding: '6px 10px', fontSize: 13, color: 'var(--text-muted)' }}>
          <Home size={14} /> Home
        </Link>
        <Link href="/projects" className="sidebar-item" style={{ textDecoration: 'none', padding: '6px 10px', fontSize: 13, color: 'var(--text-muted)' }}>
          <ArrowLeft size={14} /> Back to Projects
        </Link>
      </div>
      <nav className="flex-1 overflow-y-auto" style={{ padding: '12px 8px' }}>
        <div style={{ padding: '0 8px 6px', fontSize: 10, fontWeight: 650, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Project details</div>
        {[
          { label: 'Overview', icon: BarChart2, active: true },
          { label: 'Tasks', icon: CheckSquare },
          { label: 'Branches', icon: GitBranch },
          { label: 'Evidence', icon: Search },
          { label: 'Assumptions', icon: Bookmark },
        ].map((item) => (
          <div
            key={item.label}
            className={`sidebar-item ${item.active ? 'active' : ''}`}
            style={{ padding: '8px 12px', cursor: 'pointer', opacity: item.active ? 1 : 0.7 }}
          >
            <item.icon size={14} />
            <span>{item.label}</span>
          </div>
        ))}
      </nav>
    </aside>
  );
}

// ── Empty States ──────────────────────────────────────────────────────────────

function GlowingEmptyState({ icon: Icon, color, title, description, actionText, onAction }: { icon: any, color: string, title: string, description: string, actionText?: string, onAction?: () => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', textAlign: 'center' }}>
      <motion.div animate={{ y: [0, -4, 0] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        style={{ 
          width: 56, height: 56, borderRadius: 14, marginBottom: 16,
          background: `${color}15`, border: `1px solid ${color}30`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: `inset 0 0 16px ${color}10, 0 0 24px ${color}20`,
        }}>
        <Icon size={24} style={{ color }} strokeWidth={1.5} />
      </motion.div>
      <h3 style={{ fontSize: 15, fontWeight: 650, color: 'var(--text-primary)', marginBottom: 6 }}>{title}</h3>
      <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: actionText ? 20 : 0, maxWidth: 300, lineHeight: 1.5 }}>{description}</p>
      {actionText && onAction && (
        <button onClick={onAction} className="btn-ghost" style={{ padding: '8px 16px', fontSize: 12 }}>
          {actionText}
        </button>
      )}
    </div>
  );
}

// ── Verdict Banner ────────────────────────────────────────────────────────────

function VerdictBanner({ assessment }: { assessment: FeasibilityAssessment | null }) {
  if (!assessment) return null;
  const key = assessment.verdict as keyof typeof VERDICT_LABELS;
  const colorClass = VERDICT_COLORS[key] || 'bg-zinc-500/10';
  
  let bg = 'rgba(255,255,255,0.05)', color = 'var(--text-secondary)', border = 'var(--border-subtle)';
  if (colorClass.includes('emerald')) { bg = 'rgba(16,185,129,0.1)'; color = 'var(--success)'; border = 'rgba(16,185,129,0.2)'; }
  if (colorClass.includes('amber')) { bg = 'rgba(245,158,11,0.1)'; color = 'var(--warning)'; border = 'rgba(245,158,11,0.2)'; }
  if (colorClass.includes('rose')) { bg = 'rgba(244,63,94,0.1)'; color = 'var(--danger)'; border = 'rgba(244,63,94,0.2)'; }

  return (
    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
      style={{ padding: '16px 20px', borderRadius: 'var(--radius-xl)', background: bg, border: `1px solid ${border}`, marginBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color, letterSpacing: '-0.01em' }}>{VERDICT_LABELS[key]}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4, fontWeight: 500 }}>
            Confidence score: <span style={{ color: 'var(--text-primary)' }}>{Math.round(assessment.confidence_score * 100)}%</span>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Review rounds: {assessment.review_rounds}</div>
          {assessment.recommended_next_action && (
            <div style={{ fontSize: 12, color: 'var(--text-primary)', maxWidth: 280, fontWeight: 500 }}>{assessment.recommended_next_action}</div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ── Task Card ─────────────────────────────────────────────────────────────────

function TaskCard({ task, onComplete }: { task: Task; onComplete: () => void }) {
  const statusKey = task.status as keyof typeof TASK_STATUS_LABELS;
  const isCompleted = task.status === 'completed';
  return (
    <motion.div layout
      style={{
        padding: 16, borderRadius: 'var(--radius-lg)', transition: 'all var(--transition-fast)',
        background: task.is_primary_next ? 'rgba(124,58,237,0.05)' : 'var(--bg-elevated)',
        border: `1px solid ${task.is_primary_next ? 'rgba(124,58,237,0.2)' : 'var(--border-subtle)'}`,
        opacity: isCompleted ? 0.6 : 1,
      }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <button onClick={onComplete} disabled={isCompleted || task.status === 'abandoned'}
          style={{
            marginTop: 2, width: 18, height: 18, borderRadius: 6, flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s',
            background: isCompleted ? 'var(--success)' : 'transparent',
            border: `1px solid ${isCompleted ? 'var(--success)' : 'var(--border-default)'}`,
            color: 'white', cursor: isCompleted ? 'default' : 'pointer',
          }}>
          {isCompleted && <CheckSquare size={12} />}
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            {task.is_primary_next && <span style={{ fontSize: 11, color: 'var(--accent-primary)', fontWeight: 650 }}>→ Next step</span>}
            <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, fontWeight: 600, ...getTaskStatusStyle(statusKey) }}>
              {TASK_STATUS_LABELS[statusKey]}
            </span>
          </div>
          <p style={{ fontSize: 14, color: 'var(--text-primary)', textDecoration: isCompleted ? 'line-through' : 'none', marginBottom: task.phase ? 4 : 0 }}>
            {task.title}
          </p>
          {task.phase && <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Phase: {task.phase}</p>}
          {task.blocker_description && (
            <div style={{ display: 'flex', gap: 6, marginTop: 8, padding: '6px 10px', background: 'rgba(239,68,68,0.1)', borderRadius: 6, border: '1px solid rgba(239,68,68,0.2)', fontSize: 12, color: 'var(--danger)' }}>
              <AlertTriangle size={14} style={{ flexShrink: 0 }} /> {task.blocker_description}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function getTaskStatusStyle(status: string) {
  if (status === 'completed') return { background: 'rgba(16,185,129,0.1)', color: 'var(--success)' };
  if (status === 'in_progress') return { background: 'rgba(59,130,246,0.1)', color: 'var(--info)' };
  if (status === 'blocked') return { background: 'rgba(239,68,68,0.1)', color: 'var(--danger)' };
  return { background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' };
}

// ── Assumption Panel ──────────────────────────────────────────────────────────

function AssumptionRow({ assumption, onUpdate }: { assumption: Assumption; onUpdate: (a: Assumption) => void }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(assumption.current_value || '');

  const save = async () => {
    try {
      const updated = await updateAssumption(assumption.id, { current_value: value });
      onUpdate(updated);
      setEditing(false);
      toast.success('Assumption updated');
    } catch {
      toast.error('Failed to update assumption');
    }
  };

  return (
    <div style={{
      padding: 16, borderRadius: 'var(--radius-lg)', fontSize: 13,
      background: assumption.needs_reanalysis ? 'rgba(245,158,11,0.05)' : 'var(--bg-elevated)',
      border: `1px solid ${assumption.needs_reanalysis ? 'rgba(245,158,11,0.2)' : 'var(--border-subtle)'}`
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ flex: 1 }}>
          <p style={{ color: 'var(--text-primary)', fontWeight: 500, marginBottom: 4 }}>{assumption.statement}</p>
          {assumption.category && <p style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{assumption.category}</p>}
          {editing ? (
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <input value={value} onChange={(e) => setValue(e.target.value)}
                style={{ flex: 1, background: 'var(--bg-primary)', border: '1px solid var(--border-default)', borderRadius: 6, padding: '4px 8px', color: 'var(--text-primary)', fontSize: 13, outline: 'none' }}
              />
              <button onClick={save} className="btn-primary" style={{ padding: '4px 12px', fontSize: 12 }}>Save</button>
              <button onClick={() => setEditing(false)} className="btn-ghost" style={{ padding: '4px 12px', fontSize: 12 }}>Cancel</button>
            </div>
          ) : (
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 8 }}>
              Value: <span style={{ color: 'var(--text-primary)' }}>{assumption.current_value || 'Not set'}</span>
            </p>
          )}
        </div>
        <button onClick={() => setEditing(!editing)} style={{ fontSize: 12, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>
          {editing ? 'Cancel' : 'Edit'}
        </button>
      </div>
      {assumption.needs_reanalysis && (
        <p style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 11, color: 'var(--warning)', marginTop: 12 }}>
          <AlertTriangle size={12} /> This change may affect previous conclusions
        </p>
      )}
    </div>
  );
}

// ── Main Project Page ─────────────────────────────────────────────────────────

export default function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [assumptions, setAssumptions] = useState<Assumption[]>([]);
  const [assessment, setAssessment] = useState<FeasibilityAssessment | null>(null);
  const [loading, setLoading] = useState(true);
  const [assessing, setAssessing] = useState(false);
  const [feasibilityInput, setFeasibilityInput] = useState('');

  useEffect(() => {
    Promise.all([
      getProject(id), listTasks(id), listBranches(id), listAssumptions(id), getProjectAssessments(id),
    ]).then(([p, t, b, a, assessments]) => {
      setProject(p); setTasks(t); setBranches(b); setAssumptions(a); setAssessment(assessments[0] || null);
    }).catch(() => toast.error('Failed to load project'))
    .finally(() => setLoading(false));
  }, [id]);

  const handleComplete = async (taskId: string) => {
    try {
      const updated = await completeTask(taskId);
      setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));
      toast.success('Task completed! 🎉');
    } catch {
      toast.error('Failed to complete task');
    }
  };

  const handleAssess = async () => {
    if (!feasibilityInput.trim()) return;
    setAssessing(true);
    try {
      const result = await assessFeasibility({ project_id: id, description: feasibilityInput });
      setAssessment(result);
      if (project) setProject({ ...project, current_verdict: result.verdict });
      toast.success('Feasibility assessment complete');
      setFeasibilityInput('');
    } catch (err: unknown) {
      toast.error((err as Error).message);
    } finally {
      setAssessing(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100vh', background: 'var(--bg-primary)' }}>
        <div style={{ width: 260, borderRight: '1px solid var(--border-subtle)' }} />
        <div style={{ flex: 1, padding: 32 }}>
          <div style={{ height: 28, width: 240, background: 'var(--bg-elevated)', borderRadius: 8, animation: 'pulse 2s infinite', marginBottom: 24 }} />
          <div style={{ height: 120, borderRadius: 16, background: 'var(--bg-elevated)', animation: 'pulse 2s infinite', marginBottom: 24 }} />
          <div style={{ height: 300, borderRadius: 16, background: 'var(--bg-elevated)', animation: 'pulse 2s infinite' }} />
        </div>
      </div>
    );
  }

  if (!project) return <div style={{ padding: 32, color: 'var(--text-muted)' }}>Project not found</div>;

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--bg-primary)' }}>
      <Sidebar projectId={id} />
      <div style={{ flex: 1, overflowY: 'auto' }}>
        
        {/* Header */}
        <header style={{ position: 'sticky', top: 0, zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 32px', background: 'rgba(9,9,11,0.85)', backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--border-subtle)' }}>
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>{project.title}</h1>
            {project.description && <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>{project.description}</p>}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>{project.progress_pct}% complete</span>
            <div style={{ width: 100, height: 6, background: 'var(--bg-tertiary)', borderRadius: 3, overflow: 'hidden' }}>
              <motion.div initial={{ width: 0 }} animate={{ width: `${project.progress_pct}%` }} style={{ height: '100%', background: 'var(--accent-gradient)', borderRadius: 3 }} />
            </div>
          </div>
        </header>

        <main style={{ padding: '32px', maxWidth: 1000, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
          <VerdictBanner assessment={assessment} />

          {/* Feasibility Assessment */}
          <section className="glass-card" style={{ padding: 24 }}>
            <h2 style={{ fontSize: 16, fontWeight: 650, color: 'var(--text-primary)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Zap size={16} style={{ color: 'var(--accent-primary)' }} /> Run Feasibility Assessment
            </h2>
            <textarea
              value={feasibilityInput} onChange={(e) => setFeasibilityInput(e.target.value)}
              placeholder="Describe the project or idea to assess… e.g. 'Build a medical image classifier for 5 conditions with 16GB RAM and no GPU in 8 weeks'"
              style={{ width: '100%', background: 'var(--bg-primary)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-lg)', padding: '12px 16px', fontSize: 14, color: 'var(--text-primary)', outline: 'none', transition: 'border-color 0.2s', resize: 'none', marginBottom: 12, minHeight: 80 }}
              onFocus={e => e.target.style.borderColor = 'var(--accent-primary)'} onBlur={e => e.target.style.borderColor = 'var(--border-default)'}
            />
            <button onClick={handleAssess} disabled={assessing || !feasibilityInput.trim()} className="btn-primary" style={{ padding: '10px 20px', fontSize: 14, opacity: assessing || !feasibilityInput.trim() ? 0.6 : 1 }}>
              {assessing ? 'Running analysis...' : 'Assess Feasibility'}
            </button>
          </section>

          {/* Tasks */}
          <section className="glass-card" style={{ padding: 24 }}>
            <h2 style={{ fontSize: 16, fontWeight: 650, color: 'var(--text-primary)', marginBottom: 16 }}>Tasks ({tasks.length})</h2>
            {tasks.length === 0 ? (
              <GlowingEmptyState 
                icon={CheckSquare} color="#10b981" 
                title="No tasks yet" 
                description="Run a feasibility assessment to automatically generate an execution plan with tasks."
              />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {tasks.map((t) => <TaskCard key={t.id} task={t} onComplete={() => handleComplete(t.id)} />)}
              </div>
            )}
          </section>

          {/* Branches */}
          <section className="glass-card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h2 style={{ fontSize: 16, fontWeight: 650, color: 'var(--text-primary)' }}>Branches ({branches.length})</h2>
              <button className="btn-ghost" style={{ padding: '6px 12px', fontSize: 12 }}
                onClick={async () => {
                  const branch = await createBranch(id, { title: 'New exploration', purpose: 'explore' });
                  setBranches((prev) => [...prev, branch]);
                  toast.success('Branch created');
                }}>
                + New branch
              </button>
            </div>
            {branches.length === 0 ? (
              <GlowingEmptyState 
                icon={GitBranch} color="#3b82f6" 
                title="No branches yet" 
                description="Branches let you explore alternative technical approaches without losing your main thread."
              />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {branches.map((b) => (
                  <div key={b.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderRadius: 'var(--radius-lg)', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}>
                    <div>
                      <p style={{ fontSize: 14, color: 'var(--text-primary)', fontWeight: 500 }}>{b.title}</p>
                      {b.purpose && <p style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'capitalize', marginTop: 4 }}>{b.purpose.replace('_', ' ')}</p>}
                    </div>
                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 12, background: b.status === 'active' ? 'rgba(16,185,129,0.1)' : 'var(--bg-tertiary)', color: b.status === 'active' ? 'var(--success)' : 'var(--text-secondary)', textTransform: 'capitalize' }}>
                      {b.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Assumptions */}
          {assumptions.length > 0 && (
            <section className="glass-card" style={{ padding: 24 }}>
              <h2 style={{ fontSize: 16, fontWeight: 650, color: 'var(--text-primary)', marginBottom: 16 }}>Assumptions</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {assumptions.map((a) => (
                  <AssumptionRow key={a.id} assumption={a} onUpdate={(updated) => setAssumptions((prev) => prev.map((x) => (x.id === a.id ? updated : x)))} />
                ))}
              </div>
            </section>
          )}

          {/* Assessment Details */}
          {assessment && (
            <section className="glass-card" style={{ padding: 24 }}>
              <h2 style={{ fontSize: 16, fontWeight: 650, color: 'var(--text-primary)', marginBottom: 20 }}>Assessment Details</h2>
              {(() => {
                const blockers = parseJsonSafe<string[]>(assessment.blockers_json, []);
                const risks = parseJsonSafe<string[]>(assessment.risks_json, []);
                const whatWould = parseJsonSafe<string[]>(assessment.what_would_make_feasible as string, []);
                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    {blockers.length > 0 && (
                      <div>
                        <h3 style={{ fontSize: 13, fontWeight: 650, color: 'var(--danger)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}><AlertTriangle size={14} /> Blockers</h3>
                        <ul style={{ margin: 0, paddingLeft: 24, display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {blockers.map((b, i) => <li key={i} style={{ color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.5 }}>{typeof b === 'object' ? (b.reason || b.description || JSON.stringify(b)) : b}</li>)}
                        </ul>
                      </div>
                    )}
                    {risks.length > 0 && (
                      <div>
                        <h3 style={{ fontSize: 13, fontWeight: 650, color: 'var(--warning)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}><AlertTriangle size={14} /> Risks</h3>
                        <ul style={{ margin: 0, paddingLeft: 24, display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {risks.map((r, i) => <li key={i} style={{ color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.5 }}>{typeof r === 'object' ? (r.risk || r.description || JSON.stringify(r)) : r}</li>)}
                        </ul>
                      </div>
                    )}
                    {assessment.realistic_alternative && (
                      <div>
                        <h3 style={{ fontSize: 13, fontWeight: 650, color: 'var(--info)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}><Lightbulb size={14} /> Realistic Alternative</h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.5, margin: 0 }}>{typeof assessment.realistic_alternative === 'object' ? JSON.stringify(assessment.realistic_alternative) : assessment.realistic_alternative}</p>
                      </div>
                    )}
                    {whatWould.length > 0 && (
                      <div>
                        <h3 style={{ fontSize: 13, fontWeight: 650, color: 'var(--success)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}><CheckCircle2 size={14} /> What Would Make It Feasible</h3>
                        <ul style={{ margin: 0, paddingLeft: 24, display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {whatWould.map((w, i) => <li key={i} style={{ color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.5 }}>{typeof w === 'object' ? (w.action || w.description || JSON.stringify(w)) : w}</li>)}
                        </ul>
                      </div>
                    )}
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', paddingTop: 16, borderTop: '1px solid var(--border-subtle)', display: 'flex', gap: 16 }}>
                      <span>Confidence: {Math.round(assessment.confidence_score * 100)}%</span>
                      <span>Review rounds: {assessment.review_rounds}</span>
                      <span>Agents: {parseJsonSafe<string[]>(assessment.agents_used, []).join(', ')}</span>
                    </div>
                  </div>
                );
              })()}
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
