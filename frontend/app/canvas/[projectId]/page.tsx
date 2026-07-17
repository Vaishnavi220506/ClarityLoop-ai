'use client';

import { useState, useEffect, useCallback } from 'react';
import { use } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import Link from 'next/link';
import ReactFlow, {
  Background, Controls, MiniMap,
  Node, Edge, useNodesState, useEdgesState,
  NodeTypes, addEdge, Connection,
  BackgroundVariant,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { listNodes, listEdges, updateNode, createEdge, resetLayout } from '@/lib/api';
import type { WorkflowNode, WorkflowEdge } from '@/types';

// ── Custom Node Components ────────────────────────────────────────────────────

const NODE_STYLES: Record<string, { bg: string; border: string; icon: string }> = {
  conversation: { bg: 'bg-indigo-500/10', border: 'border-indigo-500/30', icon: '💬' },
  task:         { bg: 'bg-blue-500/10',   border: 'border-blue-500/30',   icon: '✅' },
  evidence:     { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', icon: '🔍' },
  warning:      { bg: 'bg-amber-500/10',  border: 'border-amber-500/30',  icon: '⚠️' },
  blocker:      { bg: 'bg-red-500/10',    border: 'border-red-500/30',    icon: '🚫' },
  decision:     { bg: 'bg-purple-500/10', border: 'border-purple-500/30', icon: '⚖️' },
  completed:    { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', icon: '✅' },
};

function CustomNode({ data }: { data: { label: string; node_type: string; ref_id?: string; ref_type?: string } }) {
  const style = NODE_STYLES[data.node_type] || NODE_STYLES.task;
  return (
    <div className={`px-3 py-2 rounded-xl border text-xs text-zinc-200 min-w-32 max-w-48 ${style.bg} ${style.border} shadow-lg backdrop-blur-sm`}>
      <div className="flex items-center gap-1.5">
        <span>{style.icon}</span>
        <span className="font-medium truncate">{data.label}</span>
      </div>
      {data.ref_type && (
        <div className="text-zinc-500 mt-0.5 capitalize text-xs">{data.ref_type}</div>
      )}
    </div>
  );
}

const nodeTypes: NodeTypes = {
  custom: CustomNode,
};

function toRFNode(n: WorkflowNode): Node {
  return {
    id: n.id,
    type: 'custom',
    position: { x: n.pos_x, y: n.pos_y },
    data: { label: n.label, node_type: n.node_type, ref_id: n.ref_id, ref_type: n.ref_type },
  };
}

function toRFEdge(e: WorkflowEdge): Edge {
  return {
    id: e.id,
    source: e.source_node_id,
    target: e.target_node_id,
    label: e.label || undefined,
    type: 'smoothstep',
    style: { stroke: '#52525b', strokeWidth: 2 },
    labelStyle: { fill: '#a1a1aa', fontSize: 10 },
  };
}

export default function CanvasPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = use(params);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([listNodes(projectId), listEdges(projectId)])
      .then(([rawNodes, rawEdges]) => {
        setNodes(rawNodes.map(toRFNode));
        setEdges(rawEdges.map(toRFEdge));
      })
      .catch(() => toast.error('Failed to load canvas'))
      .finally(() => setLoading(false));
  }, [projectId]);

  const onConnect = useCallback(async (connection: Connection) => {
    if (!connection.source || !connection.target) return;
    try {
      const edge = await createEdge(projectId, {
        source_node_id: connection.source,
        target_node_id: connection.target,
        edge_type: 'default',
      });
      setEdges((eds) => addEdge(toRFEdge(edge), eds));
    } catch {
      toast.error('Failed to create connection');
    }
  }, [projectId]);

  const onNodeDragStop = useCallback(async (_: React.MouseEvent, node: Node) => {
    try {
      await updateNode(node.id, { pos_x: node.position.x, pos_y: node.position.y });
    } catch {
      // Non-fatal
    }
  }, []);

  const handleResetLayout = async () => {
    await resetLayout(projectId);
    const rawNodes = await listNodes(projectId);
    setNodes(rawNodes.map(toRFNode));
    toast.success('Layout reset');
  };

  return (
    <div className="flex flex-col h-screen bg-zinc-950">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-zinc-950/90 backdrop-blur-sm z-10">
        <div className="flex items-center gap-3">
          <Link href={`/projects/${projectId}`} className="text-zinc-400 hover:text-white text-sm transition-colors">
            ← Project
          </Link>
          <span className="text-zinc-700">|</span>
          <h1 className="text-sm font-semibold text-zinc-100">Workflow Canvas</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleResetLayout}
            className="text-xs px-3 py-1.5 rounded-lg border border-zinc-700 text-zinc-400 hover:border-zinc-600 hover:text-zinc-300 transition-colors"
          >
            Reset Layout
          </button>
          <Link
            href={`/projects/${projectId}`}
            className="text-xs px-3 py-1.5 rounded-lg bg-indigo-500 text-white hover:bg-indigo-600 transition-colors"
          >
            Back to Chat
          </Link>
        </div>
      </header>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full"
          />
        </div>
      ) : (
        <div className="flex-1">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeDragStop={onNodeDragStop}
            nodeTypes={nodeTypes}
            fitView
            style={{ background: '#09090b' }}
          >
            <Background color="#27272a" variant={BackgroundVariant.Dots} gap={24} size={1} />
            <Controls style={{ background: '#18181b', border: '1px solid #3f3f46', color: '#a1a1aa' }} />
            <MiniMap
              style={{ background: '#18181b', border: '1px solid #3f3f46' }}
              nodeColor="#3f3f46"
              maskColor="rgba(0,0,0,0.6)"
            />
          </ReactFlow>
        </div>
      )}

      {nodes.length === 0 && !loading && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <div className="text-4xl mb-3">🗺️</div>
            <h2 className="text-zinc-400 font-medium">Canvas is empty</h2>
            <p className="text-zinc-600 text-sm mt-1">
              Nodes appear automatically as you create tasks and branches in the project workspace.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
