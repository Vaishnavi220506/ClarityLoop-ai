// ClarityLoop – TypeScript Type Definitions

export type RouterMode =
  | 'direct_answer'
  | 'teaching'
  | 'research'
  | 'feasibility'
  | 'build_with_me'
  | 'debugging'
  | 'file_analysis'
  | 'decision_support'
  | 'focus_guidance';

export type AnswerDepth = 'quick' | 'simple' | 'detailed' | 'step_by_step' | 'technical' | 'adaptive';

export type TaskStatus =
  | 'not_started'
  | 'in_progress'
  | 'blocked'
  | 'waiting'
  | 'needs_verification'
  | 'completed'
  | 'abandoned';

export type FeasibilityVerdict =
  | 'feasible'
  | 'feasible_with_conditions'
  | 'not_feasible'
  | 'insufficient_evidence';

export type BranchStatus = 'active' | 'blocked' | 'completed' | 'archived';
export type BranchPurpose = 'explore' | 'work_on' | 'challenge' | 'compare' | 'question' | 'blocked' | 'task';

export interface Message {
  id: string;
  conversation_id?: string;
  branch_id?: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  mode?: RouterMode;
  routing_mode?: RouterMode;
  confidence_score?: number;
  has_citations: boolean;
  has_feasibility: boolean;
  created_at: string;
}

export interface Conversation {
  id: string;
  project_id?: string;
  title?: string;
  summary?: string;
  mode: RouterMode;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  title: string;
  description?: string;
  objective?: string;
  summary?: string;
  current_verdict?: FeasibilityVerdict;
  progress_pct: number;
  status: string;
  is_demo: boolean;
  created_at: string;
  updated_at: string;
}

export interface Branch {
  id: string;
  project_id: string;
  parent_branch_id?: string;
  source_message_id?: string;
  title: string;
  purpose?: BranchPurpose;
  local_summary?: string;
  inherited_summary?: string;
  status: BranchStatus;
  depth: number;
  created_at: string;
  updated_at: string;
  children?: Branch[];
}

export interface Task {
  id: string;
  project_id: string;
  branch_id?: string;
  parent_task_id?: string;
  title: string;
  description?: string;
  phase?: string;
  expected_output?: string;
  completion_condition?: string;
  blocker_description?: string;
  status: TaskStatus;
  priority: number;
  is_primary_next: boolean;
  order_index: number;
  is_demo: boolean;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Evidence {
  id: string;
  project_id: string;
  title: string;
  url?: string;
  source_org?: string;
  source_type?: string;
  source_quality: number;
  source_quality_reason?: string;
  access_date?: string;
  supported_claim?: string;
  summary?: string;
  reliability: 'high' | 'medium' | 'low' | 'unknown';
  verification_status: 'verified' | 'partial' | 'unverified' | 'contradicted';
  created_at: string;
}

export interface Assumption {
  id: string;
  project_id: string;
  statement: string;
  category?: string;
  current_value?: string;
  previous_value?: string;
  impact?: string;
  needs_reanalysis: boolean;
  created_at: string;
  updated_at: string;
}

export interface FeasibilityAssessment {
  id: string;
  project_id: string;
  verdict: FeasibilityVerdict;
  confidence_score: number;
  confidence_explanation?: string;
  verified_requirements?: string;
  blockers_json?: string;
  risks_json?: string;
  realistic_alternative?: string;
  what_would_make_feasible?: string;
  recommended_next_action?: string;
  review_rounds: number;
  agents_used?: string;
  scope_change_approved?: boolean;
  created_at: string;
}

export interface ConfidenceSignal {
  name: string;
  present: boolean;
  weight: number;
  is_positive: boolean;
  description: string;
}

export interface ConfidenceResult {
  clamped_score: number;
  as_percent: number;
  label: 'High' | 'Medium' | 'Low' | 'Very Low';
  explanation: string;
  positive_signals: ConfidenceSignal[];
  negative_signals: ConfidenceSignal[];
}

export interface WorkflowNode {
  id: string;
  project_id: string;
  node_type: 'conversation' | 'task' | 'evidence' | 'warning' | 'blocker' | 'decision' | 'completed';
  label: string;
  ref_id?: string;
  ref_type?: string;
  pos_x: number;
  pos_y: number;
  data_json?: string;
  is_collapsed: boolean;
  created_at: string;
}

export interface WorkflowEdge {
  id: string;
  project_id: string;
  source_node_id: string;
  target_node_id: string;
  edge_type: string;
  label?: string;
  created_at: string;
}

export interface FocusSession {
  id: string;
  project_id: string;
  task_id?: string;
  current_action?: string;
  why_it_matters?: string;
  expected_result?: string;
  stuck_count: number;
  is_active: boolean;
  created_at: string;
}

export interface UserPreferences {
  answer_depth: AnswerDepth;
  preferred_language: string;
  skill_level: string;
  explanation_style: string;
  focus_mode_preference: boolean;
  theme: 'dark' | 'light';
  animation_reduced: boolean;
  memory_enabled: boolean;
  budget_preference?: string;
}

export interface RouterResult {
  mode: RouterMode;
  confidence: number;
  complexity: string;
  required_tools: string[];
  needs_web_search: boolean;
  needs_file_context: boolean;
  needs_feasibility_analysis: boolean;
  needs_critic_review: boolean;
  recommended_depth: AnswerDepth;
  workflow_cost: string;
  routing_reason: string;
}

export interface StreamChunk {
  type: 'token' | 'routing' | 'done' | 'error';
  content?: string;
  routing?: RouterResult & { conversation_id?: string; message_id?: string };
  message_id?: string;
  conversation_id?: string;
  mode?: RouterMode;
  confidence?: number;
  routing_reason?: string;
}

export interface UploadedFile {
  id: string;
  project_id: string;
  original_filename: string;
  mime_type: string;
  size_bytes: number;
  summary?: string;
  is_image: boolean;
  row_count?: number;
  col_count?: number;
  parse_error?: string;
  created_at: string;
}

export interface ChallengeResult {
  original_conclusion: string;
  assumptions_found: string[];
  counterexamples: string[];
  missing_evidence: string[];
  scope_changes_detected: string[];
  revised_conclusion: string;
  changes_from_original: string[];
  reason_for_revision: string;
  evidence_added: string[];
  confidence_change: 'increased' | 'decreased' | 'unchanged';
}

export interface StuckGuidance {
  minimum_missing_info: string;
  one_next_action: string;
  expected_result: string;
  why_this_action: string;
}

export interface DiagnosticsStatus {
  demo_mode: boolean;
  provider: string;
  model: string;
  has_api_key: boolean;
  web_search_enabled: boolean;
  max_review_rounds: number;
  max_upload_mb: number;
  total_agent_runs: number;
}
