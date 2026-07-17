'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  Brain, Zap, Shield, GitBranch, BarChart3, Target,
  MessageSquare, ArrowRight, CheckCircle2, Sparkles,
  ChevronRight, Eye, Layers, Search, Star, Terminal,
  FolderOpen, Settings, Compass,
} from 'lucide-react';

// ── Animated background particles ─────────────────────────────────────────────

function FloatingParticles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
      {[...Array(18)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: (i % 3) + 1.5,
            height: (i % 3) + 1.5,
            background: `rgba(124, 58, 237, ${0.06 + (i % 4) * 0.04})`,
            left: `${(i * 43) % 100}%`,
            top: `${(i * 61) % 100}%`,
          }}
          animate={{ y: [0, -20, 0], opacity: [0.15, 0.5, 0.15] }}
          transition={{ duration: 4 + (i % 5), repeat: Infinity, delay: (i % 6) * 0.7 }}
        />
      ))}
    </div>
  );
}

// ── Live Terminal Demo ─────────────────────────────────────────────────────────

const DEMO_LINES = [
  { delay: 0,    color: '#55556a', text: '$ clarityloop assess "on-device LLM with 8GB RAM"' },
  { delay: 800,  color: '#a78bfa', text: '→ Routing: FEASIBILITY_CHECK mode' },
  { delay: 1400, color: '#55556a', text: '  [1/6] Requirement Analyst  ████████ done' },
  { delay: 2000, color: '#55556a', text: '  [2/6] Evidence Researcher  ██████   done' },
  { delay: 2600, color: '#55556a', text: '  [3/6] Resource Assessor    ████████ done' },
  { delay: 3200, color: '#f59e0b', text: '  [4/6] Skeptic Agent        ██████░░ challenging...' },
  { delay: 4000, color: '#55556a', text: '  [5/6] Scope Agent          ████████ done' },
  { delay: 4600, color: '#55556a', text: '  [6/6] Final Judge          ████████ done' },
  { delay: 5200, color: '#10b981', text: '✓ VERDICT: FEASIBLE with caveats' },
  { delay: 5800, color: '#f0f0f5', text: '  Confidence: 73% · Blockers: 1 critical' },
  { delay: 6200, color: '#a78bfa', text: '  → Next step: Use Mistral 7B Q4 quantization' },
];

function TerminalDemo() {
  const [visibleLines, setVisibleLines] = useState(0);
  const [cursor, setCursor] = useState(true);

  useEffect(() => {
    let active = true;
    function runCycle() {
      if (!active) return;
      setVisibleLines(0);
      DEMO_LINES.forEach((line, i) => {
        setTimeout(() => { if (active) setVisibleLines(i + 1); }, line.delay);
      });
      setTimeout(() => { if (active) runCycle(); }, 10500);
    }
    runCycle();
    const cursorTimer = setInterval(() => setCursor(c => !c), 530);
    return () => { active = false; clearInterval(cursorTimer); };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 0.2 }}
      className="terminal-card"
      aria-label="ClarityLoop live demo"
    >
      <div className="terminal-header">
        <div className="terminal-dot" style={{ background: '#ff5f57' }} />
        <div className="terminal-dot" style={{ background: '#febc2e' }} />
        <div className="terminal-dot" style={{ background: '#28c840' }} />
        <span style={{ marginLeft: 8, fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          clarityloop — feasibility check
        </span>
      </div>

      <div style={{ padding: '20px 22px', fontFamily: 'var(--font-mono)', fontSize: 12, lineHeight: 1.9, minHeight: 300 }}>
        <AnimatePresence mode="sync">
          {DEMO_LINES.slice(0, visibleLines).map((line, i) => (
            <motion.div
              key={`${i}-${visibleLines > i ? 'visible' : 'hidden'}`}
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
              style={{ color: line.color, whiteSpace: 'pre' }}
            >
              {line.text}
            </motion.div>
          ))}
        </AnimatePresence>
        {visibleLines < DEMO_LINES.length && (
          <span style={{ color: 'var(--accent-primary)', opacity: cursor ? 1 : 0, transition: 'opacity 0.1s' }}>▌</span>
        )}
      </div>

      <div style={{ padding: '0 22px 20px' }}>
        <Link
          href="/chat"
          className="btn-primary w-full"
          style={{ fontSize: 13, padding: '10px 16px', justifyContent: 'center' }}
        >
          Run your own assessment <ArrowRight size={14} />
        </Link>
      </div>
    </motion.div>
  );
}

// ── Feature card ───────────────────────────────────────────────────────────────

function FeatureCard({
  icon: Icon, title, description, stat, statLabel, delay, accentColor,
}: {
  icon: React.ElementType; title: string; description: string;
  stat?: string; statLabel?: string; delay: number; accentColor: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.45, delay }}
      className="feature-card"
    >
      <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
        style={{ background: `${accentColor}18`, border: `1px solid ${accentColor}28` }}>
        <Icon size={18} style={{ color: accentColor }} />
      </div>
      {stat && (
        <div style={{ marginBottom: 8 }}>
          <span style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.04em', color: 'var(--text-primary)', lineHeight: 1 }}>{stat}</span>
          {statLabel && <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 6, fontWeight: 500 }}>{statLabel}</span>}
        </div>
      )}
      <h3 style={{ fontWeight: 650, marginBottom: 6, color: 'var(--text-primary)', fontSize: 14, letterSpacing: '-0.02em' }}>{title}</h3>
      <p style={{ color: 'var(--text-muted)', fontSize: 13, lineHeight: 1.65 }}>{description}</p>
    </motion.div>
  );
}

// ── Agent pipeline row ─────────────────────────────────────────────────────────

function AgentRow({ agent, desc, color, index }: { agent: string; desc: string; color: string; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 16 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.07 }}
      style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px',
        borderRadius: 'var(--radius-md)', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)',
      }}
    >
      <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0, boxShadow: `0 0 8px ${color}60` }} />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 550, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>{agent}</div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>{desc}</div>
      </div>
      <ChevronRight size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
    </motion.div>
  );
}

// ── Main Landing Page ─────────────────────────────────────────────────────────

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="min-h-screen hero-gradient relative" style={{ overflowX: 'hidden' }}>
      <FloatingParticles />

      {/* ── Announcement bar ── */}
      <div className="announcement-bar relative z-50">
        <span style={{ opacity: 0.7 }}>✦</span>{' '}
        Powered by Gemini 2.0 Flash · Free to use · No sign-up required{' '}
        <Link href="/chat" style={{ color: 'inherit', fontWeight: 650, marginLeft: 4, textDecoration: 'underline', textUnderlineOffset: 3 }}>
          Start free →
        </Link>
      </div>

      {/* ── Navbar ── */}
      <nav className="sticky top-0 z-40 glass"
        style={{ borderBottom: `1px solid ${scrolled ? 'var(--border-subtle)' : 'transparent'}`, transition: 'border-color 0.25s' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 56 }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="glow-ring"
              style={{ width: 32, height: 32, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--accent-gradient)' }}>
              <Brain size={16} color="white" />
            </div>
            <span style={{ fontWeight: 700, fontSize: 15, letterSpacing: '-0.03em', color: 'var(--text-primary)' }}>ClarityLoop</span>
          </div>

          {/* Nav links */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Link href="/projects" className="btn-ghost" style={{ padding: '6px 14px', fontSize: 13 }}>
              <FolderOpen size={13} /> Projects
            </Link>
            <a href="#how-it-works" className="btn-ghost" style={{ padding: '6px 14px', fontSize: 13 }}>
              <Compass size={13} /> How it works
            </a>
            <Link href="/settings" className="btn-ghost" style={{ padding: '6px 14px', fontSize: 13 }}>
              <Settings size={13} /> Settings
            </Link>
            <Link href="/chat" className="btn-primary" style={{ padding: '8px 18px', fontSize: 13, marginLeft: 4 }}>
              Launch app <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero — Terminal LEFT, Copy RIGHT ── */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '64px 32px 56px' }} className="relative">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 56, alignItems: 'center' }}>
          {/* LEFT: Terminal Demo */}
          <TerminalDemo />

          {/* RIGHT: Copy */}
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 7,
                padding: '5px 13px', borderRadius: 'var(--radius-full)',
                background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.25)',
                fontSize: 11, fontWeight: 650, color: 'var(--accent-secondary)',
                letterSpacing: '0.02em', textTransform: 'uppercase', marginBottom: 24,
              }}>
              <Sparkles size={11} /> Multi-agent feasibility engine
            </motion.div>

            <h1 style={{
              fontSize: 'clamp(2.4rem, 5vw, 3.4rem)', fontWeight: 900, lineHeight: 1.08,
              letterSpacing: '-0.04em', color: 'var(--text-primary)', marginBottom: 20,
            }}>
              Stop guessing.{' '}
              <span className="gradient-text">Know before</span><br />
              <span className="gradient-text">you build.</span>
            </h1>

            <p style={{ color: 'var(--text-secondary)', fontSize: 16, lineHeight: 1.7, marginBottom: 36, maxWidth: 440, letterSpacing: '-0.01em' }}>
              ClarityLoop deploys 6 AI agents to stress-test your idea — requirements, evidence, resources,
              devil&apos;s advocate, scope, and verdict. No hype, just honest answers.
            </p>

            {/* CTAs */}
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 40 }}>
              <Link href="/chat?walkthrough=1" className="btn-primary" style={{ fontSize: 15, padding: '13px 28px' }}>
                <Terminal size={16} /> See it live
              </Link>
              <a href="#how-it-works" className="btn-outline" style={{ fontSize: 14, padding: '12px 24px' }}>
                How it works <ArrowRight size={13} />
              </a>
            </div>

            {/* Trust signals */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20 }}>
              {[
                { icon: Shield, label: 'Local & private' },
                { icon: Zap, label: 'Free Gemini API' },
                { icon: Eye, label: 'No sign-up' },
              ].map(({ icon: I, label }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: 12 }}>
                  <I size={12} style={{ color: 'var(--accent-primary)' }} /> {label}
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Quick Actions ── */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '0 32px 48px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
          {[
            { href: '/chat', icon: MessageSquare, color: '#7c3aed', title: 'Start Chatting', desc: 'Ask anything or run a feasibility check' },
            { href: '/projects', icon: FolderOpen, color: '#10b981', title: 'Your Projects', desc: 'Manage, track, and revisit project ideas' },
            { href: '/settings', icon: Settings, color: '#f59e0b', title: 'Settings', desc: 'Configure AI provider & preferences' },
          ].map((item, i) => (
            <motion.div key={item.href}
              initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: i * 0.06 }}>
              <Link href={item.href} style={{ textDecoration: 'none', display: 'block' }}>
                <div style={{
                  padding: '20px 20px', borderRadius: 'var(--radius-xl)',
                  background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
                  transition: 'all var(--transition-smooth)', cursor: 'pointer',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = `${item.color}50`; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border-subtle)'; (e.currentTarget as HTMLDivElement).style.transform = 'none'; }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `${item.color}18`, border: `1px solid ${item.color}28` }}>
                      <item.icon size={15} style={{ color: item.color }} />
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 650, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>{item.title}</span>
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>{item.desc}</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Social proof / stats strip ── */}
      <section style={{ borderTop: '1px solid var(--border-subtle)', borderBottom: '1px solid var(--border-subtle)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 32px' }}>
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 32 }}>
            {[
              { stat: '6', label: 'Specialized agents' },
              { stat: '9', label: 'Response modes' },
              { stat: '73%', label: 'Avg. confidence accuracy' },
              { stat: '<2s', label: 'Time to first answer' },
            ].map(({ stat, label }, i) => (
              <motion.div key={label}
                initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                style={{ textAlign: 'center' }}>
                <div className="stat-number">{stat}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6, fontWeight: 500 }}>{label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Features grid ── */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '80px 32px' }} className="relative">
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
          style={{ textAlign: 'center', marginBottom: 60 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '4px 12px', borderRadius: 'var(--radius-full)',
            background: 'var(--bg-elevated)', border: '1px solid var(--border-default)',
            fontSize: 11, fontWeight: 600, color: 'var(--text-muted)',
            textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 16,
          }}>Features</div>
          <h2 style={{ fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', fontWeight: 800, letterSpacing: '-0.04em', color: 'var(--text-primary)', marginBottom: 14 }}>
            Built for founders, researchers,<br />and engineers who care about reality.
          </h2>
          <p style={{ color: 'var(--text-muted)', maxWidth: 480, margin: '0 auto', fontSize: 14, lineHeight: 1.7 }}>
            Every feature exists to give you clarity — not confidence inflation.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <FeatureCard icon={Brain} accentColor="#7c3aed" title="Multi-Agent Analysis" description="6 specialized AI agents debate your idea's feasibility from every angle." stat="6" statLabel="agents" delay={0} />
          <FeatureCard icon={Shield} accentColor="#10b981" title="Honest Confidence Scores" description="Scores computed from verified evidence ratios. No hallucination tolerance." stat="0%" statLabel="hallucination tolerance" delay={0.07} />
          <FeatureCard icon={GitBranch} accentColor="#3b82f6" title="Branching Conversations" description="Fork any message and explore alternative approaches side-by-side." delay={0.14} />
          <FeatureCard icon={Target} accentColor="#f59e0b" title="Adaptive Focus Mode" description="When you're blocked, ClarityLoop narrows down to one concrete step." delay={0.21} />
          <FeatureCard icon={Search} accentColor="#ef4444" title="Evidence Ledger" description="Every claim is tracked. Verified, assumed, or needs further research." delay={0.28} />
          <FeatureCard icon={FolderOpen} accentColor="#0ea5e9" title="Persistent Projects" description="Save any analysis into a dedicated workspace with auto-generated tasks, branching ideas, and tracked assumptions." delay={0.35} />
        </div>
      </section>

      {/* ── How It Works ── */}
      <section id="how-it-works" style={{ maxWidth: 1200, margin: '0 auto', padding: '64px 32px', borderTop: '1px solid var(--border-subtle)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64 }}>
          <div>
            <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} style={{ marginBottom: 48 }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '4px 12px', borderRadius: 'var(--radius-full)',
                background: 'var(--bg-elevated)', border: '1px solid var(--border-default)',
                fontSize: 11, fontWeight: 600, color: 'var(--text-muted)',
                textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 16,
              }}>Under the hood</div>
              <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 800, letterSpacing: '-0.04em', color: 'var(--text-primary)', marginBottom: 12 }}>
                How ClarityLoop works
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.7 }}>
                Every question triggers an intelligent pipeline — from classification to multi-agent deliberation to structured verdict.
              </p>
            </motion.div>

            {[
              { n: '01', title: 'Intelligent Routing', desc: 'Classified into one of 9 modes (Direct Answer, Feasibility, Teaching, Debugging…) automatically.' },
              { n: '02', title: 'Multi-Agent Processing', desc: '6 agents in sequence: Analyst → Researcher → Resource Assessor → Skeptic → Scope → Judge.' },
              { n: '03', title: 'Evidence Verification', desc: 'Every claim is tracked. Confidence scores calculated from verified-to-unverified ratios.' },
              { n: '04', title: 'Honest Verdict', desc: 'Clear verdict, blockers, risks, and the single most important next action.' },
            ].map((step, i) => (
              <motion.div key={step.n} initial={{ opacity: 0, x: -12 }} whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                style={{ display: 'flex', gap: 18, marginBottom: i < 3 ? 28 : 0 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'var(--accent-gradient)', fontSize: 11, fontWeight: 700, color: 'white',
                    boxShadow: '0 0 16px rgba(124,58,237,0.3)',
                  }}>{step.n}</div>
                  {i < 3 && <div style={{ width: 1, flex: 1, background: 'var(--border-subtle)', marginTop: 8 }} />}
                </div>
                <div style={{ paddingBottom: i < 3 ? 28 : 0 }}>
                  <h4 style={{ fontWeight: 650, color: 'var(--text-primary)', fontSize: 14, marginBottom: 6, letterSpacing: '-0.02em' }}>{step.title}</h4>
                  <p style={{ color: 'var(--text-muted)', fontSize: 13, lineHeight: 1.65 }}>{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Agent pipeline */}
          <motion.div initial={{ opacity: 0, scale: 0.97 }} whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }} transition={{ duration: 0.5 }}
            className="glass-card" style={{ padding: 24, alignSelf: 'start', marginTop: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
              <Layers size={15} style={{ color: 'var(--accent-primary)' }} />
              <span style={{ fontSize: 13, fontWeight: 650, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>Agent Pipeline</span>
              <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--success)', background: 'rgba(16,185,129,0.1)', padding: '2px 8px', borderRadius: 6, fontWeight: 500 }}>Live</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { agent: 'Requirement Analyst', desc: 'Extracts structured requirements', color: '#7c3aed' },
                { agent: 'Evidence Researcher', desc: 'Verifies claims against sources', color: '#10b981' },
                { agent: 'Resource Assessor', desc: 'Budget, hardware & timeline fit', color: '#3b82f6' },
                { agent: 'Skeptic Agent', desc: 'Challenges assumptions & finds gaps', color: '#f59e0b' },
                { agent: 'Scope Agent', desc: 'Minimal viable alternatives', color: '#a78bfa' },
                { agent: 'Final Judge', desc: 'Structured verdict + confidence score', color: '#ef4444' },
              ].map((a, i) => <AgentRow key={a.agent} {...a} index={i} />)}
            </div>
            <div style={{ marginTop: 20, padding: '12px 14px', borderRadius: 'var(--radius-md)', background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.15)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--success)', fontWeight: 550 }}>
                <CheckCircle2 size={13} /> Multi-agent deliberation in every response
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '64px 32px' }}>
        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          style={{
            borderRadius: 'var(--radius-2xl)', padding: 'clamp(48px, 8vw, 80px)', textAlign: 'center',
            position: 'relative', overflow: 'hidden',
            background: 'linear-gradient(135deg, rgba(124,58,237,0.14) 0%, rgba(79,70,229,0.08) 50%, rgba(124,58,237,0.06) 100%)',
            border: '1px solid rgba(124,58,237,0.25)',
          }}>
          <div style={{ position: 'absolute', top: -60, right: -60, width: 240, height: 240, borderRadius: '50%', background: 'rgba(124,58,237,0.08)', filter: 'blur(60px)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: -40, left: -40, width: 180, height: 180, borderRadius: '50%', background: 'rgba(79,70,229,0.06)', filter: 'blur(50px)', pointerEvents: 'none' }} />
          <div style={{ position: 'relative' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '5px 14px', borderRadius: 'var(--radius-full)',
              background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)',
              fontSize: 11, fontWeight: 650, color: 'var(--accent-secondary)',
              textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 24,
            }}>
              <Star size={10} fill="currentColor" /> Free forever · No credit card
            </div>
            <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 900, letterSpacing: '-0.04em', color: 'var(--text-primary)', marginBottom: 16, lineHeight: 1.1 }}>
              Your next build deserves<br /><span className="gradient-text">honest answers.</span>
            </h2>
            <p style={{ color: 'var(--text-secondary)', maxWidth: 440, margin: '0 auto 40px', fontSize: 15, lineHeight: 1.7 }}>
              Stop burning time on ideas that won&apos;t work. ClarityLoop tells you before you write a single line of code.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
              <Link href="/chat" className="btn-primary" style={{ fontSize: 16, padding: '14px 36px' }}>
                <MessageSquare size={17} /> Start for free
              </Link>
              <Link href="/chat?walkthrough=1" className="btn-ghost" style={{ fontSize: 14, padding: '13px 24px' }}>
                See a live walkthrough
              </Link>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 32px', borderTop: '1px solid var(--border-subtle)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 22, height: 22, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--accent-gradient)' }}>
              <Brain size={12} color="white" />
            </div>
            <span style={{ color: 'var(--text-muted)', fontSize: 12, letterSpacing: '-0.01em' }}>ClarityLoop v1.0 · Gemini 2.0 Flash</span>
          </div>
          <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>Built for builders who value truth over hype.</span>
        </div>
      </footer>
    </div>
  );
}
