// ClarityLoop – API Client
// All API calls go through this client. Never exposes secrets.

import type {
  Message, Conversation, Project, Branch, Task, Evidence,
  Assumption, FeasibilityAssessment, WorkflowNode, WorkflowEdge,
  FocusSession, UserPreferences, RouterResult, StreamChunk,
  UploadedFile, ChallengeResult, StuckGuidance, DiagnosticsStatus,
  ConfidenceResult,
} from '@/types';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.detail || err.error || `API error ${res.status}`);
  }
  return res.json();
}

// ── Health ────────────────────────────────────────────────────────────────────

export const health = () => apiFetch<{ status: string; demo_mode: boolean; provider: string; model: string; has_api_key: boolean }>('/health');

// ── Chat ──────────────────────────────────────────────────────────────────────

export async function* streamChat(body: {
  message: string;
  conversation_id?: string;
  branch_id?: string;
  project_id?: string;
  depth?: string;
  mode_override?: string;
  file_ids?: string[];
}): AsyncGenerator<StreamChunk> {
  const res = await fetch(`${BASE_URL}/api/chat/stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok || !res.body) {
    throw new Error(`Chat stream failed: ${res.status}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        try {
          const chunk = JSON.parse(line.slice(6)) as StreamChunk;
          yield chunk;
        } catch {
          // Skip malformed chunks
        }
      }
    }
  }
}

export const classifyMessage = (message: string, has_files = false) =>
  apiFetch<RouterResult>('/api/chat/route', {
    method: 'POST',
    body: JSON.stringify({ message, has_files }),
  });

export const challengeAnswer = (original_response: string, original_question: string) =>
  apiFetch<ChallengeResult>('/api/chat/challenge', {
    method: 'POST',
    body: JSON.stringify({ original_response, original_question }),
  });

export const getStuckGuidance = (body: {
  task_title: string;
  task_description?: string;
  completed_steps?: string[];
  stuck_context?: string;
}) => apiFetch<StuckGuidance>('/api/chat/stuck', { method: 'POST', body: JSON.stringify(body) });

// ── Conversations ─────────────────────────────────────────────────────────────

export const listConversations = (project_id?: string) =>
  apiFetch<Conversation[]>(`/api/conversations/${project_id ? `?project_id=${project_id}` : ''}`);

export const createConversation = (body: { title?: string; project_id?: string }) =>
  apiFetch<Conversation>('/api/conversations/', { method: 'POST', body: JSON.stringify(body) });

export const getConversation = (id: string) => apiFetch<Conversation>(`/api/conversations/${id}`);

export const getMessages = (conv_id: string) =>
  apiFetch<Message[]>(`/api/conversations/${conv_id}/messages`);

export const deleteConversation = (conv_id: string) =>
  apiFetch<{ message: string }>(`/api/conversations/${conv_id}`, { method: 'DELETE' });

export const deleteAllConversations = () =>
  apiFetch<{ message: string }>('/api/conversations/', { method: 'DELETE' });

// ── Projects ──────────────────────────────────────────────────────────────────

export const listProjects = () => apiFetch<Project[]>('/api/projects/');

export const createProject = (body: { title: string; description?: string; objective?: string }) =>
  apiFetch<Project>('/api/projects/', { method: 'POST', body: JSON.stringify(body) });

export const getProject = (id: string) => apiFetch<Project>(`/api/projects/${id}`);

export const updateProject = (id: string, body: Partial<Project>) =>
  apiFetch<Project>(`/api/projects/${id}`, { method: 'PATCH', body: JSON.stringify(body) });

export const deleteProject = (id: string) =>
  apiFetch<{ message: string }>(`/api/projects/${id}?confirmed=true`, { method: 'DELETE' });

// ── Branches ──────────────────────────────────────────────────────────────────

export const listBranches = (project_id: string) =>
  apiFetch<Branch[]>(`/api/branches/?project_id=${project_id}`);

export const createBranch = (project_id: string, body: {
  title: string;
  purpose?: string;
  parent_branch_id?: string;
  source_message_id?: string;
  inherited_summary?: string;
}) => apiFetch<Branch>(`/api/branches/?project_id=${project_id}`, { method: 'POST', body: JSON.stringify(body) });

export const getBranch = (id: string) => apiFetch<Branch>(`/api/branches/${id}`);

export const getBranchMessages = (branch_id: string) =>
  apiFetch<Message[]>(`/api/branches/${branch_id}/messages`);

export const getBreadcrumb = (branch_id: string) =>
  apiFetch<Array<{ id: string; title: string; status: string }>>(`/api/branches/${branch_id}/breadcrumb`);

export const updateBranchStatus = (id: string, status: string, local_summary?: string) =>
  apiFetch(`/api/branches/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status, local_summary }),
  });

// ── Tasks ─────────────────────────────────────────────────────────────────────

export const listTasks = (project_id: string) =>
  apiFetch<Task[]>(`/api/tasks/?project_id=${project_id}`);

export const createTask = (project_id: string, body: Partial<Task>) =>
  apiFetch<Task>(`/api/tasks/?project_id=${project_id}`, { method: 'POST', body: JSON.stringify(body) });

export const updateTask = (id: string, body: Partial<Task>) =>
  apiFetch<Task>(`/api/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(body) });

export const completeTask = (id: string) =>
  apiFetch<Task>(`/api/tasks/${id}/complete`, { method: 'POST' });

export const blockTask = (id: string, blocker_description: string) =>
  apiFetch(`/api/tasks/${id}/block`, { method: 'POST', body: JSON.stringify({ blocker_description }) });

// ── Feasibility ───────────────────────────────────────────────────────────────

export const assessFeasibility = (body: {
  project_id: string;
  description: string;
  resource_profile?: Record<string, unknown>;
}) => apiFetch<FeasibilityAssessment>('/api/feasibility/assess', { method: 'POST', body: JSON.stringify(body) });

export const getAssessment = (id: string) => apiFetch<FeasibilityAssessment>(`/api/feasibility/${id}`);

export const getProjectAssessments = (project_id: string) =>
  apiFetch<FeasibilityAssessment[]>(`/api/feasibility/project/${project_id}`);

export const approveScope = (assessment_id: string, approved: boolean) =>
  apiFetch(`/api/feasibility/${assessment_id}/approve-scope`, {
    method: 'POST',
    body: JSON.stringify({ approved }),
  });

export const getConfidenceDetails = (assessment_id: string) =>
  apiFetch<ConfidenceResult>(`/api/feasibility/${assessment_id}/confidence`);

// ── Assumptions ───────────────────────────────────────────────────────────────

export const listAssumptions = (project_id: string) =>
  apiFetch<Assumption[]>(`/api/assumptions/?project_id=${project_id}`);

export const createAssumption = (project_id: string, body: Partial<Assumption>) =>
  apiFetch<Assumption>(`/api/assumptions/?project_id=${project_id}`, { method: 'POST', body: JSON.stringify(body) });

export const updateAssumption = (id: string, body: Partial<Assumption>) =>
  apiFetch<Assumption>(`/api/assumptions/${id}`, { method: 'PATCH', body: JSON.stringify(body) });

export const deleteAssumption = (id: string) =>
  apiFetch(`/api/assumptions/${id}`, { method: 'DELETE' });

// ── Canvas ────────────────────────────────────────────────────────────────────

export const listNodes = (project_id: string) =>
  apiFetch<WorkflowNode[]>(`/api/canvas/nodes/${project_id}`);

export const createNode = (project_id: string, body: Partial<WorkflowNode>) =>
  apiFetch<WorkflowNode>(`/api/canvas/nodes/${project_id}`, { method: 'POST', body: JSON.stringify(body) });

export const updateNode = (id: string, body: Partial<WorkflowNode>) =>
  apiFetch<WorkflowNode>(`/api/canvas/nodes/${id}`, { method: 'PATCH', body: JSON.stringify(body) });

export const deleteNode = (id: string) =>
  apiFetch(`/api/canvas/nodes/${id}`, { method: 'DELETE' });

export const listEdges = (project_id: string) =>
  apiFetch<WorkflowEdge[]>(`/api/canvas/edges/${project_id}`);

export const createEdge = (project_id: string, body: Partial<WorkflowEdge>) =>
  apiFetch<WorkflowEdge>(`/api/canvas/edges/${project_id}`, { method: 'POST', body: JSON.stringify(body) });

export const resetLayout = (project_id: string) =>
  apiFetch(`/api/canvas/layout/reset/${project_id}`, { method: 'POST' });

// ── Focus ─────────────────────────────────────────────────────────────────────

export const startFocus = (body: {
  project_id: string;
  task_id?: string;
  current_action?: string;
  why_it_matters?: string;
  expected_result?: string;
}) => apiFetch<FocusSession>('/api/focus/start', { method: 'POST', body: JSON.stringify(body) });

export const getActiveFocus = () =>
  apiFetch<FocusSession | null>('/api/focus/active');

export const exitFocus = (session_id: string, reason?: string) =>
  apiFetch(`/api/focus/${session_id}/exit`, {
    method: 'POST',
    body: JSON.stringify({ reason: reason || 'user_exited' }),
  });

export const reportStuck = (session_id: string) =>
  apiFetch<{ stuck_count: number; message: string }>(`/api/focus/${session_id}/stuck`, { method: 'POST' });

// ── Files ─────────────────────────────────────────────────────────────────────

export const uploadFile = (project_id: string, file: File) => {
  const form = new FormData();
  form.append('file', file);
  return apiFetch<UploadedFile>(`/api/files/upload/${project_id}`, {
    method: 'POST',
    headers: {},  // Let browser set Content-Type for multipart
    body: form,
  });
};

export const listFiles = (project_id: string) =>
  apiFetch<UploadedFile[]>(`/api/files/${project_id}`);

// ── Preferences ───────────────────────────────────────────────────────────────

export const getPreferences = () => apiFetch<UserPreferences>('/api/preferences/');

export const updatePreferences = (body: Partial<UserPreferences>) =>
  apiFetch('/api/preferences/', { method: 'PUT', body: JSON.stringify(body) });

export const getResourceProfile = () => apiFetch('/api/preferences/resource-profile');

export const updateResourceProfile = (body: Record<string, unknown>) =>
  apiFetch('/api/preferences/resource-profile', { method: 'PUT', body: JSON.stringify(body) });

// ── Diagnostics ───────────────────────────────────────────────────────────────

export const getDiagnosticsStatus = () => apiFetch<DiagnosticsStatus>('/api/diagnostics/status');

export const getAgentRuns = (limit = 20) =>
  apiFetch<unknown[]>(`/api/diagnostics/agent-runs?limit=${limit}`);
