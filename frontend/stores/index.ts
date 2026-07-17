// ClarityLoop – Zustand Stores

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Message, Conversation, Project, Branch, Task, FocusSession,
  UserPreferences, RouterMode, AnswerDepth,
} from '@/types';

// ── Chat Store ────────────────────────────────────────────────────────────────

interface ChatStore {
  messages: Message[];
  streamingContent: string;
  isStreaming: boolean;
  conversationId: string | null;
  currentMode: RouterMode | null;
  routingReason: string | null;
  depth: AnswerDepth;
  projectId: string | null;
  branchId: string | null;
  addMessage: (msg: Message) => void;
  setMessages: (messages: Message[]) => void;
  setStreamingContent: (content: string) => void;
  appendStreamingContent: (chunk: string) => void;
  setIsStreaming: (v: boolean) => void;
  setConversationId: (id: string | null) => void;
  setCurrentMode: (mode: RouterMode | null) => void;
  setRoutingReason: (reason: string | null) => void;
  setDepth: (depth: AnswerDepth) => void;
  setProjectId: (id: string | null) => void;
  setBranchId: (id: string | null) => void;
  clearMessages: () => void;
  finalizeStreaming: (messageId: string) => void;
}

export const useChatStore = create<ChatStore>((set, get) => ({
  messages: [],
  streamingContent: '',
  isStreaming: false,
  conversationId: null,
  currentMode: null,
  routingReason: null,
  depth: 'adaptive',
  projectId: null,
  branchId: null,

  addMessage: (msg) => set((s) => ({ messages: [...s.messages, msg] })),
  setMessages: (messages) => set({ messages, streamingContent: '' }),
  setStreamingContent: (content) => set({ streamingContent: content }),
  appendStreamingContent: (chunk) => set((s) => ({ streamingContent: s.streamingContent + chunk })),
  setIsStreaming: (v) => set({ isStreaming: v }),
  setConversationId: (id) => set({ conversationId: id }),
  setCurrentMode: (mode) => set({ currentMode: mode }),
  setRoutingReason: (reason) => set({ routingReason: reason }),
  setDepth: (depth) => set({ depth }),
  setProjectId: (id) => set({ projectId: id }),
  setBranchId: (id) => set({ branchId: id }),
  clearMessages: () => set({ messages: [], streamingContent: '', conversationId: null }),
  finalizeStreaming: (messageId) => {
    const { streamingContent, messages } = get();
    const finalMsg: Message = {
      id: messageId,
      role: 'assistant',
      content: streamingContent,
      has_citations: false,
      has_feasibility: false,
      created_at: new Date().toISOString(),
    };
    set({
      messages: [...messages, finalMsg],
      streamingContent: '',
      isStreaming: false,
    });
  },
}));

// ── Project Store ─────────────────────────────────────────────────────────────

interface ProjectStore {
  projects: Project[];
  activeProject: Project | null;
  tasks: Task[];
  branches: Branch[];
  setProjects: (projects: Project[]) => void;
  setActiveProject: (project: Project | null) => void;
  setTasks: (tasks: Task[]) => void;
  setBranches: (branches: Branch[]) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  updateBranch: (id: string, updates: Partial<Branch>) => void;
}

export const useProjectStore = create<ProjectStore>((set) => ({
  projects: [],
  activeProject: null,
  tasks: [],
  branches: [],
  setProjects: (projects) => set({ projects }),
  setActiveProject: (project) => set({ activeProject: project }),
  setTasks: (tasks) => set({ tasks }),
  setBranches: (branches) => set({ branches }),
  updateTask: (id, updates) =>
    set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)) })),
  updateBranch: (id, updates) =>
    set((s) => ({ branches: s.branches.map((b) => (b.id === id ? { ...b, ...updates } : b)) })),
}));

// ── Focus Store ───────────────────────────────────────────────────────────────

interface FocusStore {
  isActive: boolean;
  session: FocusSession | null;
  activate: (session: FocusSession) => void;
  deactivate: () => void;
  updateSession: (updates: Partial<FocusSession>) => void;
}

export const useFocusStore = create<FocusStore>((set) => ({
  isActive: false,
  session: null,
  activate: (session) => set({ isActive: true, session }),
  deactivate: () => set({ isActive: false, session: null }),
  updateSession: (updates) =>
    set((s) => ({ session: s.session ? { ...s.session, ...updates } : null })),
}));

// ── Preferences Store ─────────────────────────────────────────────────────────

interface PreferencesStore {
  preferences: UserPreferences;
  setPreferences: (prefs: Partial<UserPreferences>) => void;
}

const DEFAULT_PREFS: UserPreferences = {
  answer_depth: 'adaptive',
  preferred_language: 'Python',
  skill_level: 'intermediate',
  explanation_style: 'balanced',
  focus_mode_preference: false,
  theme: 'dark',
  animation_reduced: false,
  memory_enabled: true,
};

export const usePreferencesStore = create<PreferencesStore>()(
  persist(
    (set) => ({
      preferences: DEFAULT_PREFS,
      setPreferences: (prefs) =>
        set((s) => ({ preferences: { ...s.preferences, ...prefs } })),
    }),
    { name: 'clarityloop-preferences' }
  )
);
