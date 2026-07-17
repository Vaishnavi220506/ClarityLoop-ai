'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import Link from 'next/link';
import {
  Send, StopCircle, Plus, MessageSquare, Settings, Brain,
  PanelLeftClose, PanelLeft, Sparkles,
  FolderOpen, Zap, Paperclip, FileText, X, LoaderCircle,
  Target, Search, GitBranch, Pin, Trash2, Eraser, Home,
} from 'lucide-react';
import { useChatStore } from '@/stores';
import { streamChat, listConversations, getMessages, createProject, uploadFile, health, listFiles, deleteConversation, deleteAllConversations } from '@/lib/api';
import type { RouterMode, AnswerDepth, Conversation, UploadedFile } from '@/types';
import { MODE_LABELS, MODE_COLORS, cn } from '@/lib/utils';

// ── Markdown Renderer ─────────────────────────────────────────────────────────

function renderMarkdown(text: string): string {
  return text
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(/```[\w]*\n?([\s\S]+?)```/g, '<pre><code>$1</code></pre>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>')
    .replace(/\n/g, '<br/>');
}

// ── Sidebar Chat Item ─────────────────────────────────────────────────────────

function SidebarChatItem({
  conv,
  isActive,
  isPinned,
  onSelect,
  onPin,
  onDelete,
}: {
  conv: Conversation;
  isActive: boolean;
  isPinned: boolean;
  onSelect: () => void;
  onPin: () => void;
  onDelete: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onClick={onSelect}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`sidebar-item ${isActive ? 'active' : ''}`}
      style={{ position: 'relative', paddingRight: hovered ? 56 : 12 }}
    >
      <MessageSquare size={13} style={{ flexShrink: 0, opacity: 0.7 }} />
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
        {isPinned && <span style={{ color: 'var(--accent-secondary)', marginRight: 3, fontSize: 10 }}>📌</span>}
        {conv.title || 'Untitled chat'}
      </span>

      {/* Hover actions */}
      {hovered && (
        <div
          style={{
            position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)',
            display: 'flex', gap: 2,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onPin(); }}
            title={isPinned ? 'Unpin' : 'Pin'}
            style={{
              width: 22, height: 22, borderRadius: 5,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: isPinned ? 'var(--accent-glow)' : 'var(--bg-primary)',
              border: '1px solid var(--border-default)',
              color: isPinned ? 'var(--accent-secondary)' : 'var(--text-muted)',
              cursor: 'pointer', transition: 'all var(--transition-fast)',
            }}
          >
            <Pin size={10} />
          </button>
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(); }}
            title="Delete chat"
            style={{
              width: 22, height: 22, borderRadius: 5,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'var(--bg-primary)', border: '1px solid var(--border-default)',
              color: 'var(--text-muted)', cursor: 'pointer',
              transition: 'all var(--transition-fast)',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--danger)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(239,68,68,0.3)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border-default)'; }}
          >
            <Trash2 size={10} />
          </button>
        </div>
      )}
    </div>
  );
}

// ── Sidebar ───────────────────────────────────────────────────────────────────

function Sidebar({
  conversations, activeId, onSelect, onNew, collapsed, files,
  pinnedIds, onPin, onDeleteChat, onClearAll,
}: {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  collapsed: boolean;
  onToggle: () => void;
  files?: UploadedFile[];
  pinnedIds: Set<string>;
  onPin: (id: string) => void;
  onDeleteChat: (id: string) => void;
  onClearAll: () => void;
}) {
  const pinned = conversations.filter(c => pinnedIds.has(c.id));
  const unpinned = conversations.filter(c => !pinnedIds.has(c.id));

  return (
    <aside className={`sidebar ${collapsed ? 'sidebar-collapsed' : ''}`} style={{ flexShrink: 0 }}>
      {!collapsed && (
        <>
          {/* Logo + New Chat */}
          <div style={{ padding: '14px 14px 12px', borderBottom: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 12 }}>
              <div style={{ width: 26, height: 26, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--accent-gradient)', flexShrink: 0 }}>
                <Brain size={13} color="white" />
              </div>
              <span style={{ fontWeight: 700, fontSize: 13, letterSpacing: '-0.03em', color: 'var(--text-primary)' }}>ClarityLoop</span>
            </div>
            <button
              onClick={onNew}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 12px', borderRadius: 'var(--radius-md)',
                background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)',
                color: 'var(--text-secondary)', fontSize: 13, fontWeight: 500, cursor: 'pointer',
                transition: 'all var(--transition-fast)', letterSpacing: '-0.01em',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-tertiary)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-primary)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-elevated)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-secondary)'; }}
            >
              <Plus size={14} />
              New chat
              <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--text-muted)', background: 'var(--bg-primary)', padding: '1px 6px', borderRadius: 4 }}>⌘N</span>
            </button>
          </div>

          {/* Conversation list */}
          <div className="flex-1 overflow-y-auto" style={{ padding: '8px 8px' }}>
            {/* Pinned section */}
            {pinned.length > 0 && (
              <>
                <div style={{ padding: '4px 8px 6px', fontSize: 10, fontWeight: 650, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Pin size={9} /> Pinned
                </div>
                {pinned.map((conv) => (
                  <SidebarChatItem
                    key={conv.id} conv={conv} isActive={activeId === conv.id} isPinned
                    onSelect={() => onSelect(conv.id)} onPin={() => onPin(conv.id)} onDelete={() => onDeleteChat(conv.id)}
                  />
                ))}
              </>
            )}

            {/* Recent section */}
            {unpinned.length > 0 && (
              <>
                <div style={{ padding: '8px 8px 6px', fontSize: 10, fontWeight: 650, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>Recent</span>
                  <button
                    onClick={onClearAll}
                    title="Clear all chats"
                    style={{
                      display: 'flex', alignItems: 'center', gap: 3,
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: 'var(--text-muted)', fontSize: 10, fontWeight: 500, padding: '2px 4px',
                      borderRadius: 4, transition: 'all var(--transition-fast)',
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--danger)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)'; }}
                  >
                    <Eraser size={9} /> Clear all
                  </button>
                </div>
                {unpinned.map((conv) => (
                  <SidebarChatItem
                    key={conv.id} conv={conv} isActive={activeId === conv.id} isPinned={false}
                    onSelect={() => onSelect(conv.id)} onPin={() => onPin(conv.id)} onDelete={() => onDeleteChat(conv.id)}
                  />
                ))}
              </>
            )}

            {conversations.length === 0 && (
              <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
                <MessageSquare size={18} style={{ margin: '0 auto 8px', opacity: 0.3 }} />
                <div>No conversations yet</div>
                <div style={{ fontSize: 11, marginTop: 4, opacity: 0.7 }}>Start typing to begin</div>
              </div>
            )}

            {/* Files */}
            {files && files.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <div style={{ padding: '4px 8px 6px', fontSize: 10, fontWeight: 650, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Files</div>
                {files.map((file) => (
                  <div key={file.id} className="sidebar-item" style={{ opacity: 0.8 }}>
                    <FileText size={13} style={{ flexShrink: 0, color: 'var(--accent-secondary)' }} />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{file.original_filename}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Bottom nav */}
          <div style={{ padding: '8px 8px 12px', borderTop: '1px solid var(--border-subtle)' }}>
            <Link href="/" className="sidebar-item" style={{ textDecoration: 'none' }}>
              <Home size={13} style={{ opacity: 0.7 }} /> Home
            </Link>
            <Link href="/projects" className="sidebar-item" style={{ textDecoration: 'none' }}>
              <FolderOpen size={13} style={{ opacity: 0.7 }} /> Projects
            </Link>
            <Link href="/settings" className="sidebar-item" style={{ textDecoration: 'none' }}>
              <Settings size={13} style={{ opacity: 0.7 }} /> Settings
            </Link>
          </div>
        </>
      )}
    </aside>
  );
}

// ── Mode Indicator ────────────────────────────────────────────────────────────

function ModeIndicator({ mode, reason }: { mode: RouterMode | null; reason: string | null }) {
  if (!mode) return null;
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }}
      className={cn('mode-badge', MODE_COLORS[mode])} title={reason || ''}
      style={{ fontSize: 10, fontWeight: 650, letterSpacing: '0.03em' }}
    >
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'currentColor', opacity: 0.8 }} />
      {MODE_LABELS[mode]}
    </motion.span>
  );
}

// ── Message Bubble ────────────────────────────────────────────────────────────

function MessageBubble({ role, content, mode, isStreaming }: {
  role: 'user' | 'assistant' | 'system'; content: string; mode?: RouterMode | null; isStreaming?: boolean;
}) {
  const isUser = role === 'user';
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}
      style={{
        display: 'flex', gap: 12, flexDirection: isUser ? 'row-reverse' : 'row',
        maxWidth: '100%', padding: '0 20px', alignItems: 'flex-start',
      }}
    >
      <div style={{
        width: 30, height: 30, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, fontSize: 11, fontWeight: 700,
        background: isUser ? 'var(--accent-gradient)' : 'var(--bg-elevated)',
        border: isUser ? 'none' : '1px solid var(--border-default)', color: 'white',
        boxShadow: isUser ? '0 2px 8px rgba(124,58,237,0.3)' : 'none',
      }}>
        {isUser ? 'You' : <Brain size={14} style={{ color: 'var(--accent-secondary)' }} />}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        {!isUser && mode && <div style={{ marginBottom: 6 }}><ModeIndicator mode={mode} reason={null} /></div>}
        <div className={isUser ? 'msg-user' : 'msg-assistant'}
          style={{ padding: isUser ? '11px 16px' : '14px 18px', display: 'inline-block', maxWidth: '100%' }}>
          {content ? (
            <div className={cn('message-content', isStreaming && !isUser && 'streaming-cursor')}
              style={{ fontSize: 14 }} dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }} />
          ) : isStreaming ? (
            <div className="streaming-cursor" style={{ color: 'var(--text-muted)' }}>&nbsp;</div>
          ) : null}
        </div>
      </div>
    </motion.div>
  );
}

// ── Empty State ───────────────────────────────────────────────────────────────

function EmptyState({ onSend }: { onSend: (msg: string) => void }) {
  const suggestions = [
    { icon: Target, color: '#7c3aed', label: 'Feasibility check', msg: 'Can I build a recommendation engine with 16GB RAM and no GPU?' },
    { icon: Brain, color: '#10b981', label: 'Learn a concept', msg: 'Explain how transformers work in simple terms' },
    { icon: Search, color: '#3b82f6', label: 'Research a topic', msg: 'What are the best open-source LLMs available in 2025?' },
    { icon: GitBranch, color: '#f59e0b', label: 'Debug code', msg: "I'm getting a TypeError: cannot read property 'map' of undefined" },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
      style={{ textAlign: 'center', paddingTop: 64, maxWidth: 580, margin: '0 auto', padding: '64px 20px 0' }}>
      <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          width: 56, height: 56, borderRadius: 16, margin: '0 auto 20px',
          background: 'var(--accent-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 32px rgba(124,58,237,0.3)',
        }}>
        <Brain size={24} color="white" />
      </motion.div>
      <h2 style={{ fontSize: 20, fontWeight: 750, color: 'var(--text-primary)', marginBottom: 8, letterSpacing: '-0.03em' }}>
        What do you need clarity on?
      </h2>
      <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 28, lineHeight: 1.6 }}>
        Describe a project idea, ask anything, or pick a starting point below.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {suggestions.map((s) => (
          <motion.button key={s.label} whileHover={{ y: -2, scale: 1.01 }} whileTap={{ scale: 0.98 }}
            onClick={() => onSend(s.msg)}
            style={{
              textAlign: 'left', padding: '14px 16px', borderRadius: 'var(--radius-md)',
              background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)',
              cursor: 'pointer', transition: 'all var(--transition-fast)',
            }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
              <s.icon size={13} style={{ color: s.color, flexShrink: 0 }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>{s.label}</span>
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.msg}</div>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}

// ── Chat Input ────────────────────────────────────────────────────────────────

function ChatInput({
  onSend, isStreaming, onStop, depth, onDepthChange, files, onChooseFiles, onRemoveFile, isUploading,
}: {
  onSend: (msg: string) => void; isStreaming: boolean; onStop: () => void;
  depth: AnswerDepth; onDepthChange: (d: AnswerDepth) => void;
  files: UploadedFile[]; onChooseFiles: (files: FileList | null) => void;
  onRemoveFile: (id: string) => void; isUploading: boolean;
}) {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = () => {
    const msg = value.trim();
    if (!msg || isStreaming) return;
    onSend(msg);
    setValue('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); }
  };

  const handleInput = () => {
    const ta = textareaRef.current;
    if (ta) { ta.style.height = 'auto'; ta.style.height = Math.min(ta.scrollHeight, 160) + 'px'; }
  };

  const DEPTHS: AnswerDepth[] = ['quick', 'simple', 'adaptive', 'detailed', 'step_by_step', 'technical'];

  return (
    <div style={{ padding: '12px 20px 20px', maxWidth: '100%', width: '100%' }}>
      <div className="chat-input-wrapper">
        <input ref={fileInputRef} type="file" className="sr-only" multiple
          accept=".pdf,.pptx,.docx,.xlsx,.xls,.csv,.txt,.md,.json,.png,.jpg,.jpeg,.webp,.py,.js,.ts,.tsx,.html,.css"
          onChange={(e) => { onChooseFiles(e.target.files); e.target.value = ''; }} />

        {files.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, padding: '10px 14px 0' }}>
            {files.map((file) => (
              <span key={file.id} style={{
                display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 8px', borderRadius: 7,
                background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.2)',
                color: 'var(--text-secondary)', fontSize: 11, fontWeight: 500,
              }}>
                <FileText size={11} style={{ color: 'var(--accent-secondary)' }} />
                {file.original_filename}
                <button aria-label={`Remove ${file.original_filename}`} onClick={() => onRemoveFile(file.id)}
                  style={{ border: 0, background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', padding: 0 }}>
                  <X size={11} />
                </button>
              </span>
            ))}
          </div>
        )}

        <textarea ref={textareaRef} value={value} onChange={(e) => setValue(e.target.value)}
          onInput={handleInput} onKeyDown={handleKeyDown}
          placeholder="Ask anything or describe your project idea…" disabled={isStreaming} rows={1}
          style={{
            width: '100%', background: 'transparent', border: 'none', outline: 'none',
            color: 'var(--text-primary)', padding: '16px 18px 8px', fontSize: 14,
            resize: 'none', minHeight: 50, maxHeight: 160,
            fontFamily: 'var(--font-sans)', letterSpacing: '-0.01em', lineHeight: 1.6,
          }}
        />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 12px 12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button type="button" onClick={() => fileInputRef.current?.click()} disabled={isUploading || isStreaming}
              style={{
                display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 'var(--radius-sm)',
                background: 'transparent', border: '1px solid var(--border-subtle)',
                color: 'var(--text-muted)', fontSize: 11, fontWeight: 500, cursor: 'pointer',
                transition: 'all var(--transition-fast)',
              }}
              title="Attach files (PDF, PPTX, DOCX, CSV…)">
              {isUploading ? <LoaderCircle size={12} className="animate-spin" /> : <Paperclip size={12} />} Attach
            </button>
            <select value={depth} onChange={(e) => onDepthChange(e.target.value as AnswerDepth)}
              style={{
                fontSize: 11, background: 'transparent', color: 'var(--text-muted)',
                border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)',
                padding: '5px 8px', outline: 'none', cursor: 'pointer', fontFamily: 'var(--font-sans)',
              }}>
              {DEPTHS.map(d => (
                <option key={d} value={d} style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)' }}>
                  {d.replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>

          {isStreaming ? (
            <button onClick={onStop} style={{
              display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 'var(--radius-sm)',
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
              color: 'var(--danger)', fontSize: 11, fontWeight: 500, cursor: 'pointer',
            }}>
              <StopCircle size={12} /> Stop
            </button>
          ) : (
            <motion.button whileHover={value.trim() ? { scale: 1.05 } : {}} whileTap={value.trim() ? { scale: 0.95 } : {}}
              onClick={handleSubmit} disabled={!value.trim()}
              style={{
                width: 34, height: 34, borderRadius: 10,
                background: value.trim() ? 'var(--accent-gradient)' : 'var(--bg-elevated)',
                border: 'none', cursor: value.trim() ? 'pointer' : 'default',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all var(--transition-fast)',
                opacity: value.trim() ? 1 : 0.35,
                boxShadow: value.trim() ? '0 2px 8px rgba(124,58,237,0.3)' : 'none',
              }}>
              <Send size={14} color="white" />
            </motion.button>
          )}
        </div>
      </div>
      <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 10.5, marginTop: 8, letterSpacing: '0.01em' }}>
        ClarityLoop separates verified facts from assumptions. Always verify critical decisions.
      </p>
    </div>
  );
}

// ── Main Chat Page ────────────────────────────────────────────────────────────

export default function ChatPage() {
  const {
    messages, streamingContent, isStreaming, conversationId, currentMode, routingReason,
    depth, projectId, addMessage, setMessages, appendStreamingContent, setIsStreaming, setConversationId, setProjectId,
    setCurrentMode, setRoutingReason, setDepth, finalizeStreaming, setStreamingContent,
  } = useChatStore();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isDemo, setIsDemo] = useState(false);
  const [provider, setProvider] = useState('');
  const [model, setModel] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<UploadedFile[]>([]);
  const [projectFiles, setProjectFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [pinnedIds, setPinnedIds] = useState<Set<string>>(() => {
    if (typeof window !== 'undefined') {
      try { return new Set(JSON.parse(localStorage.getItem('cl-pinned') || '[]')); } catch { return new Set(); }
    }
    return new Set();
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const walkthroughStarted = useRef(false);

  // Persist pinned IDs
  useEffect(() => {
    localStorage.setItem('cl-pinned', JSON.stringify([...pinnedIds]));
  }, [pinnedIds]);

  useEffect(() => {
    listConversations().then(setConversations).catch(() => {});
    health().then(d => {
      setIsDemo(d.demo_mode);
      setProvider(d.provider || '');
      setModel(d.model || '');
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (projectId) listFiles(projectId).then(setProjectFiles).catch(() => {});
  }, [projectId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  const handleNewChat = useCallback(() => {
    useChatStore.getState().clearMessages();
    setCurrentMode(null);
    setRoutingReason(null);
  }, [setCurrentMode, setRoutingReason]);

  const handleSelectConversation = useCallback(async (id: string) => {
    try {
      const saved = await getMessages(id);
      setMessages(saved);
      setConversationId(id);
      setAttachedFiles([]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not open conversation');
    }
  }, [setConversationId, setMessages]);

  const handlePin = useCallback((id: string) => {
    setPinnedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const handleDeleteChat = useCallback(async (id: string) => {
    try {
      await deleteConversation(id);
      setConversations(prev => prev.filter(c => c.id !== id));
      if (conversationId === id) handleNewChat();
      toast.success('Chat deleted');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete');
    }
  }, [conversationId, handleNewChat]);

  const handleClearAll = useCallback(async () => {
    if (!confirm('Delete all conversations? This cannot be undone.')) return;
    try {
      await deleteAllConversations();
      setConversations([]);
      handleNewChat();
      setPinnedIds(new Set());
      toast.success('All chats cleared');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to clear');
    }
  }, [handleNewChat]);

  const handleChooseFiles = useCallback(async (files: FileList | null) => {
    if (!files?.length) return;
    setIsUploading(true);
    try {
      let pid = projectId;
      if (!pid) {
        const project = await createProject({ title: `Files: ${files[0].name}`, description: 'Documents attached from chat' });
        pid = project.id;
        setProjectId(project.id);
      }
      const uploaded = await Promise.all(Array.from(files).map((f) => uploadFile(pid!, f)));
      setAttachedFiles((cur) => [...cur, ...uploaded]);
      setProjectFiles((cur) => { const fresh = uploaded.filter(u => !cur.find(c => c.id === u.id)); return [...cur, ...fresh]; });
      toast.success(`${uploaded.length} file${uploaded.length === 1 ? '' : 's'} ready`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  }, [projectId, setProjectId]);

  const handleSend = useCallback(async (message: string) => {
    if (isStreaming) return;
    addMessage({ id: crypto.randomUUID(), role: 'user', content: message, has_citations: false, has_feasibility: false, created_at: new Date().toISOString() });
    setIsStreaming(true);
    setStreamingContent('');
    const ac = new AbortController();
    setAbortController(ac);

    try {
      let messageId = '';
      for await (const chunk of streamChat({ message, conversation_id: conversationId ?? undefined, project_id: projectId ?? undefined, depth, file_ids: attachedFiles.map(f => f.id) })) {
        if (ac.signal.aborted) break;
        if (chunk.type === 'routing') {
          if (chunk.mode) setCurrentMode(chunk.mode as RouterMode);
          if (chunk.routing_reason) setRoutingReason(chunk.routing_reason);
          if (chunk.conversation_id) setConversationId(chunk.conversation_id);
          if (chunk.message_id) messageId = chunk.message_id;
        } else if (chunk.type === 'token' && chunk.content) {
          appendStreamingContent(chunk.content);
        } else if (chunk.type === 'done') {
          if (chunk.message_id) messageId = chunk.message_id;
          if (chunk.conversation_id) setConversationId(chunk.conversation_id);
          finalizeStreaming(messageId || crypto.randomUUID());
          listConversations().then(setConversations).catch(() => {});
        } else if (chunk.type === 'error') {
          toast.error(chunk.content || 'Stream error');
          setIsStreaming(false);
          setStreamingContent('');
        }
      }
    } catch (err: unknown) {
      if (!ac.signal.aborted) {
        toast.error((err as Error).message || 'Failed to send');
        setIsStreaming(false);
        setStreamingContent('');
      }
    }
  }, [isStreaming, conversationId, projectId, depth, attachedFiles, addMessage, appendStreamingContent, setIsStreaming, setCurrentMode, setRoutingReason, setConversationId, finalizeStreaming, setStreamingContent]);

  useEffect(() => {
    if (walkthroughStarted.current || !new URLSearchParams(window.location.search).has('walkthrough')) return;
    walkthroughStarted.current = true;
    handleSend('Give me a short walkthrough of ClarityLoop using a practical example: can a student build an on-device image classifier with 2GB RAM and no GPU? Show the verdict, assumptions, blockers, and next step.');
  }, [handleSend]);

  const handleStop = () => {
    abortController?.abort();
    setIsStreaming(false);
    if (streamingContent) finalizeStreaming(crypto.randomUUID());
  };

  const allMessages = [
    ...messages,
    ...(isStreaming && streamingContent ? [{
      id: 'streaming', role: 'assistant' as const, content: streamingContent,
      has_citations: false, has_feasibility: false, created_at: new Date().toISOString(),
    }] : []),
  ];

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--bg-primary)' }}>
      <Sidebar
        conversations={conversations} activeId={conversationId}
        onSelect={handleSelectConversation} onNew={handleNewChat}
        collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(v => !v)}
        files={projectId ? projectFiles : []}
        pinnedIds={pinnedIds} onPin={handlePin}
        onDeleteChat={handleDeleteChat} onClearAll={handleClearAll}
      />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative', minWidth: 0 }}>
        {isDemo && (
          <div className="demo-banner">
            ⚠️ Running in Demo Mode — responses are mocked.{' '}
            <span style={{ opacity: 0.7 }}>Set GEMINI_API_KEY in backend/.env for live AI.</span>
          </div>
        )}

        {/* Header */}
        <header style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 16px', height: 52, borderBottom: '1px solid var(--border-subtle)',
          background: 'var(--bg-primary)', flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button onClick={() => setSidebarCollapsed(v => !v)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--text-muted)', display: 'flex', alignItems: 'center',
                padding: '5px', borderRadius: 6, transition: 'color var(--transition-fast)',
              }}
              title={sidebarCollapsed ? 'Show sidebar' : 'Hide sidebar'}>
              {sidebarCollapsed ? <PanelLeft size={16} /> : <PanelLeftClose size={16} />}
            </button>
            {currentMode && <ModeIndicator mode={currentMode} reason={routingReason} />}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {provider && !isDemo && (
              <span style={{
                fontSize: 11, padding: '3px 10px', borderRadius: 20,
                background: 'rgba(16,185,129,0.08)', color: 'var(--success)',
                border: '1px solid rgba(16,185,129,0.18)', fontWeight: 550,
              }}>
                ● {provider === 'gemini' ? 'Gemini 2.0 Flash' : provider === 'ollama' ? `Local Ollama${model ? ` · ${model}` : ''}` : model || provider}
              </span>
            )}
            <Link href="/" style={{ textDecoration: 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <div style={{ width: 24, height: 24, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--accent-gradient)' }}>
                  <Brain size={12} color="white" />
                </div>
                <span style={{ fontWeight: 700, fontSize: 13, letterSpacing: '-0.03em', color: 'var(--text-primary)' }}>ClarityLoop</span>
              </div>
            </Link>
          </div>
        </header>

        {/* Messages */}
        <main style={{ flex: 1, overflowY: 'auto', paddingTop: 20 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 8 }}>
            {allMessages.length === 0 && <EmptyState onSend={handleSend} />}
            <AnimatePresence>
              {allMessages.map((msg) => (
                <MessageBubble key={msg.id} role={msg.role} content={msg.content}
                  mode={msg.routing_mode} isStreaming={msg.id === 'streaming'} />
              ))}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </div>
        </main>

        <ChatInput
          onSend={handleSend} isStreaming={isStreaming} onStop={handleStop}
          depth={depth} onDepthChange={setDepth} files={attachedFiles}
          onChooseFiles={handleChooseFiles}
          onRemoveFile={(id) => setAttachedFiles(f => f.filter(x => x.id !== id))}
          isUploading={isUploading}
        />
      </div>
    </div>
  );
}
