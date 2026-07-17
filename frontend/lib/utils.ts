// ClarityLoop – Utility functions

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { RouterMode, FeasibilityVerdict, TaskStatus, ConfidenceResult } from '@/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const MODE_LABELS: Record<RouterMode, string> = {
  direct_answer: 'Direct Answer',
  teaching: 'Teaching',
  research: 'Research',
  feasibility: 'Feasibility Analysis',
  build_with_me: 'Build With Me',
  debugging: 'Debugging',
  file_analysis: 'File Analysis',
  decision_support: 'Decision Support',
  focus_guidance: 'Focus Guidance',
};

export const MODE_COLORS: Record<RouterMode, string> = {
  direct_answer: 'bg-slate-500/20 text-slate-300',
  teaching: 'bg-blue-500/20 text-blue-300',
  research: 'bg-purple-500/20 text-purple-300',
  feasibility: 'bg-amber-500/20 text-amber-300',
  build_with_me: 'bg-emerald-500/20 text-emerald-300',
  debugging: 'bg-red-500/20 text-red-300',
  file_analysis: 'bg-cyan-500/20 text-cyan-300',
  decision_support: 'bg-indigo-500/20 text-indigo-300',
  focus_guidance: 'bg-orange-500/20 text-orange-300',
};

export const VERDICT_LABELS: Record<FeasibilityVerdict, string> = {
  feasible: '✅ Feasible',
  feasible_with_conditions: '⚠️ Feasible with Conditions',
  not_feasible: '❌ Not Feasible',
  insufficient_evidence: '❓ Insufficient Evidence',
};

export const VERDICT_COLORS: Record<FeasibilityVerdict, string> = {
  feasible: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
  feasible_with_conditions: 'text-amber-400 border-amber-500/30 bg-amber-500/10',
  not_feasible: 'text-red-400 border-red-500/30 bg-red-500/10',
  insufficient_evidence: 'text-slate-400 border-slate-500/30 bg-slate-500/10',
};

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  not_started: 'Not Started',
  in_progress: 'In Progress',
  blocked: 'Blocked',
  waiting: 'Waiting',
  needs_verification: 'Needs Verification',
  completed: 'Completed',
  abandoned: 'Abandoned',
};

export const TASK_STATUS_COLORS: Record<TaskStatus, string> = {
  not_started: 'text-slate-400 bg-slate-500/10',
  in_progress: 'text-blue-400 bg-blue-500/10',
  blocked: 'text-red-400 bg-red-500/10',
  waiting: 'text-amber-400 bg-amber-500/10',
  needs_verification: 'text-purple-400 bg-purple-500/10',
  completed: 'text-emerald-400 bg-emerald-500/10',
  abandoned: 'text-slate-500 bg-slate-500/10',
};

export function getConfidenceColor(score: number): string {
  if (score >= 0.75) return 'text-emerald-400';
  if (score >= 0.55) return 'text-amber-400';
  if (score >= 0.35) return 'text-orange-400';
  return 'text-red-400';
}

export function truncate(str: string, len: number): string {
  if (str.length <= len) return str;
  return str.slice(0, len) + '…';
}

export function parseJsonSafe<T>(str?: string | null, fallback: T = [] as unknown as T): T {
  if (!str) return fallback;
  try {
    return JSON.parse(str) as T;
  } catch {
    return fallback;
  }
}
