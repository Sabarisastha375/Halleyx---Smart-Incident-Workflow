import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { dashboardApi } from '../services/api';
import { FullPageSpinner } from '../components';

// ─── Stat Card ───────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, color = 'blue', icon }) {
  const colors = {
    blue:   'from-blue-600/20 to-blue-800/10 border-blue-700/40 text-blue-300',
    green:  'from-emerald-600/20 to-emerald-800/10 border-emerald-700/40 text-emerald-300',
    red:    'from-red-600/20 to-red-800/10 border-red-700/40 text-red-300',
    yellow: 'from-amber-600/20 to-amber-800/10 border-amber-700/40 text-amber-300',
    purple: 'from-purple-600/20 to-purple-800/10 border-purple-700/40 text-purple-300',
  };
  return (
    <div className={`rounded-xl border bg-gradient-to-br p-5 ${colors[color]}`}>
      <div className="flex items-start justify-between mb-3">
        <span className="text-2xl">{icon}</span>
        {sub !== undefined && (
          <span className="text-xs font-medium opacity-70">{sub}</span>
        )}
      </div>
      <p className="text-3xl font-bold text-white mb-1">{value}</p>
      <p className="text-xs font-medium opacity-80">{label}</p>
    </div>
  );
}

// ─── Status mini-badge ───────────────────────────────────────────────────────
const STATUS_DOT = {
  completed:   'bg-emerald-400',
  failed:      'bg-red-400',
  in_progress: 'bg-blue-400 animate-pulse',
  pending:     'bg-slate-400',
  canceled:    'bg-amber-400',
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await dashboardApi.getStats();
        setStats(res.data);
      } catch (err) {
        toast.error('Failed to load dashboard stats');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <FullPageSpinner message="Loading dashboard..." />;

  const { totalWorkflows, activeWorkflows, totalExecutions, successRate, byStatus, recentExecutions } = stats || {};

  return (
    <div className="space-y-8 animate-slide-up">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-sm text-slate-400 mt-1">Live overview of your incident workflow system</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard icon="⚙️" label="Total Workflows" value={totalWorkflows ?? 0} sub={`${activeWorkflows ?? 0} active`} color="blue" />
        <StatCard icon="⚡" label="Total Executions" value={totalExecutions ?? 0} color="purple" />
        <StatCard icon="✅" label="Success Rate" value={`${successRate ?? 0}%`} sub={`${byStatus?.completed ?? 0} completed`} color="green" />
        <StatCard icon="🔴" label="Failed" value={byStatus?.failed ?? 0} sub={`${byStatus?.in_progress ?? 0} in progress`} color="red" />
      </div>

      {/* Status breakdown */}
      <div className="card">
        <h2 className="text-sm font-semibold text-white mb-4">Execution Status Breakdown</h2>
        <div className="grid grid-cols-5 gap-3">
          {Object.entries(byStatus || {}).map(([status, count]) => (
            <div key={status} className="text-center rounded-lg bg-surface border border-surface-border p-3">
              <div className="flex justify-center mb-2">
                <span className={`w-2.5 h-2.5 rounded-full ${STATUS_DOT[status] || 'bg-slate-400'}`} />
              </div>
              <p className="text-xl font-bold text-white">{count}</p>
              <p className="text-xs text-slate-500 capitalize mt-0.5">{status.replace('_', ' ')}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-3 gap-4">
        <Link to="/ai-generator"
          className="card hover:border-primary-500/60 hover:bg-primary-600/5 transition-all duration-200 cursor-pointer group"
        >
          <div className="text-3xl mb-3">🤖</div>
          <h3 className="text-sm font-semibold text-white group-hover:text-primary-300 transition-colors">AI Workflow Generator</h3>
          <p className="text-xs text-slate-500 mt-1">Describe an incident — AI builds the workflow</p>
        </Link>
        <Link to="/templates"
          className="card hover:border-emerald-500/60 hover:bg-emerald-600/5 transition-all duration-200 cursor-pointer group"
        >
          <div className="text-3xl mb-3">📋</div>
          <h3 className="text-sm font-semibold text-white group-hover:text-emerald-300 transition-colors">Workflow Templates</h3>
          <p className="text-xs text-slate-500 mt-1">Use pre-built incident response templates</p>
        </Link>
        <Link to="/workflows"
          className="card hover:border-purple-500/60 hover:bg-purple-600/5 transition-all duration-200 cursor-pointer group"
        >
          <div className="text-3xl mb-3">⚙️</div>
          <h3 className="text-sm font-semibold text-white group-hover:text-purple-300 transition-colors">Manage Workflows</h3>
          <p className="text-xs text-slate-500 mt-1">View, edit, and execute all workflows</p>
        </Link>
      </div>

      {/* Recent executions */}
      <div className="card p-0">
        <div className="px-5 py-4 border-b border-surface-border flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">Recent Executions</h2>
          <Link to="/executions" className="text-xs text-primary-400 hover:text-primary-300 transition-colors">
            View all →
          </Link>
        </div>
        {!recentExecutions?.length ? (
          <div className="py-10 text-center text-slate-500 text-sm">
            No executions yet. <Link to="/workflows" className="text-primary-400 hover:underline">Execute a workflow</Link>
          </div>
        ) : (
          <div className="divide-y divide-surface-border">
            {recentExecutions.map((ex) => (
              <Link
                key={ex._id}
                to={`/executions/${ex._id}`}
                className="flex items-center gap-4 px-5 py-3.5 hover:bg-surface-hover/50 transition-colors"
              >
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${STATUS_DOT[ex.status] || 'bg-slate-400'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{ex.workflowId?.name || 'Unknown'}</p>
                  <p className="text-xs text-slate-500">{ex.triggeredBy} · {ex.startedAt ? new Date(ex.startedAt).toLocaleString() : '—'}</p>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full capitalize font-medium ${
                  ex.status === 'completed' ? 'bg-emerald-900/50 text-emerald-300'
                  : ex.status === 'failed' ? 'bg-red-900/50 text-red-300'
                  : 'bg-slate-700/50 text-slate-300'
                }`}>
                  {ex.status.replace('_', ' ')}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
