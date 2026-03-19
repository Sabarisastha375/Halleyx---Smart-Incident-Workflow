import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { executionAPI } from '../services/api';

const STATUS_COLORS = {
  pending: 'badge-gray',
  in_progress: 'badge-blue',
  completed: 'badge-green',
  failed: 'badge-red',
  canceled: 'badge-yellow',
  started: 'badge-blue',
  skipped: 'badge-gray',
};

const STEP_TYPE_ICONS = {
  task: '⚙️',
  approval: '✅',
  notification: '🔔',
};

function LogCard({ log, index }) {
  const [expanded, setExpanded] = useState(false);
  const duration = log.endedAt && log.startedAt
    ? ((new Date(log.endedAt) - new Date(log.startedAt)) / 1000).toFixed(2)
    : null;

  return (
    <div className="card p-0 overflow-hidden">
      <button
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-center gap-4 p-4 hover:bg-surface-hover/40 transition-colors text-left"
      >
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
          log.status === 'completed' ? 'bg-emerald-900/60 text-emerald-300'
          : log.status === 'failed' ? 'bg-red-900/60 text-red-300'
          : 'bg-blue-900/60 text-blue-300'
        }`}>
          {index + 1}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-white">{log.stepName}</span>
            <span className="text-xs">{STEP_TYPE_ICONS[log.stepType] || '📌'}</span>
            <span className={STATUS_COLORS[log.status] || 'badge-gray'}>{log.status}</span>
          </div>
          <div className="flex items-center gap-4 mt-1 text-xs text-slate-500">
            <span>{log.startedAt ? new Date(log.startedAt).toLocaleTimeString() : '—'}</span>
            {duration && <span>⏱ {duration}s</span>}
            {log.selectedNextStep && (
              <span>→ <span className="text-primary-400">{log.selectedNextStep}</span></span>
            )}
          </div>
        </div>
        <svg
          className={`w-4 h-4 text-slate-500 transition-transform ${expanded ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && (
        <div className="border-t border-surface-border p-4 space-y-3 bg-surface/50">
          {/* AI Suggestion */}
          {log.aiSuggestion && (
            <div className="rounded-lg bg-indigo-900/20 border border-indigo-700/40 p-3 text-xs text-indigo-300">
              <strong>AI Suggestion:</strong> {log.aiSuggestion}
            </div>
          )}

          {/* Loop Count */}
          {log.loopCount > 0 && (
            <div className="rounded-lg bg-orange-900/20 border border-orange-700/40 p-3 text-xs text-orange-300">
              <strong>Loop Count:</strong> {log.loopCount}
            </div>
          )}

          {/* Notification Details */}
          {log.notificationType && (
            <div className="rounded-lg bg-blue-900/20 border border-blue-700/40 p-3 text-xs text-blue-300">
              <strong>Notification ({log.notificationType.toUpperCase()}):</strong> {log.notificationMessage}
            </div>
          )}

          {/* Error */}
          {log.errorMessage && (
            <div className="rounded-lg bg-red-900/20 border border-red-700/40 p-3 text-xs text-red-300">
              <strong>Error:</strong> {log.errorMessage}
            </div>
          )}

          {/* Approver */}
          {log.approverId && (
            <p className="text-xs text-slate-400">
              Approved by: <span className="text-white">{log.approverId}</span>
            </p>
          )}

          {/* Evaluated rules */}
          {log.evaluatedRules?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Rules Evaluated
              </p>
              <div className="space-y-1.5">
                {log.evaluatedRules.map((rule, i) => (
                  <div
                    key={i}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs ${
                      rule.result
                        ? 'bg-emerald-900/20 border border-emerald-700/40'
                        : 'bg-surface border border-surface-border'
                    }`}
                  >
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                      rule.result ? 'bg-emerald-700 text-emerald-100' : 'bg-slate-700 text-slate-400'
                    }`}>
                      {rule.result ? '✓' : '✗'}
                    </span>
                    <span className="font-mono text-slate-300 flex-1 truncate">{rule.condition}</span>
                    <span className="text-slate-500 flex-shrink-0">P{rule.priority}</span>
                    {rule.isDefault && <span className="badge-gray text-xs">DEFAULT</span>}
                    {rule.result && <span className="badge-green text-xs">MATCHED</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ExecutionLogs() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [execution, setExecution] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState('');

  const fetchExecution = async () => {
    try {
      const res = await executionAPI.get(id);
      setExecution(res.data);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchExecution(); }, [id]);

  const handleCancel = async () => {
    try {
      setActionLoading('cancel');
      await executionAPI.cancel(id);
      toast.success('Execution canceled');
      fetchExecution();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setActionLoading('');
    }
  };

  const handleRetry = async () => {
    try {
      setActionLoading('retry');
      await executionAPI.retry(id);
      toast.success('Execution retried');
      fetchExecution();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setActionLoading('');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32 text-slate-500">
        <svg className="animate-spin w-6 h-6 mr-2" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
        Loading execution logs...
      </div>
    );
  }

  if (!execution) return <div className="text-slate-500">Execution not found.</div>;

  const STATUS_COLORS_EX = {
    pending: 'badge-gray',
    in_progress: 'badge-blue',
    completed: 'badge-green',
    failed: 'badge-red',
    canceled: 'badge-yellow',
  };

  const duration = execution.startedAt && execution.endedAt
    ? ((new Date(execution.endedAt) - new Date(execution.startedAt)) / 1000).toFixed(1)
    : null;

  return (
    <div className="space-y-6 animate-slide-up max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Execution Logs</h1>
          <p className="text-sm text-slate-400 mt-1 font-mono">{id}</p>
        </div>
        <div className="flex gap-2">
          {execution.status === 'failed' && (
            <button
              onClick={handleRetry}
              disabled={actionLoading === 'retry'}
              className="btn-success"
            >
              {actionLoading === 'retry' ? 'Retrying...' : '↻ Retry'}
            </button>
          )}
          {['pending', 'in_progress'].includes(execution.status) && (
            <button
              onClick={handleCancel}
              disabled={actionLoading === 'cancel'}
              className="btn-danger"
            >
              {actionLoading === 'cancel' ? 'Canceling...' : '✕ Cancel'}
            </button>
          )}
          <button onClick={() => navigate('/executions')} className="btn-secondary">
            ← Back
          </button>
        </div>
      </div>

      {/* Summary card */}
      <div className="card">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="label">Workflow</p>
            <p className="text-sm font-semibold text-white">
              {execution.workflowId?.name || '—'}
            </p>
          </div>
          <div>
            <p className="label">Status</p>
            <span className={STATUS_COLORS_EX[execution.status] || 'badge-gray'}>
              {execution.status}
            </span>
          </div>
          <div>
            <p className="label">Triggered By</p>
            <p className="text-sm text-slate-300">{execution.triggeredBy || '—'}</p>
          </div>
          <div>
            <p className="label">Duration</p>
            <p className="text-sm text-slate-300">{duration ? `${duration}s` : '—'}</p>
          </div>
          <div>
            <p className="label">Retries</p>
            <p className="text-sm text-slate-300">{execution.retries}</p>
          </div>
          <div>
            <p className="label">Version</p>
            <p className="text-sm text-slate-300">v{execution.workflowVersion}</p>
          </div>
          <div>
            <p className="label">Started</p>
            <p className="text-sm text-slate-300">
              {execution.startedAt ? new Date(execution.startedAt).toLocaleString() : '—'}
            </p>
          </div>
          <div>
            <p className="label">Ended</p>
            <p className="text-sm text-slate-300">
              {execution.endedAt ? new Date(execution.endedAt).toLocaleString() : '—'}
            </p>
          </div>
        </div>

        {execution.errorMessage && (
          <div className="mt-4 rounded-lg bg-red-900/20 border border-red-700/50 p-3 text-sm text-red-300">
            <strong>Failure Reason:</strong> {execution.errorMessage}
          </div>
        )}
      </div>

      {/* Input data */}
      <div className="card">
        <h2 className="text-sm font-semibold text-white mb-3">Execution Input Data</h2>
        <pre className="text-xs font-mono text-slate-300 bg-surface rounded-lg p-3 overflow-x-auto">
          {JSON.stringify(execution.data, null, 2)}
        </pre>
      </div>

      {/* Step logs */}
      <div className="space-y-3">
        <h2 className="text-base font-semibold text-white">
          Step Execution Log
          <span className="ml-2 text-sm text-slate-500 font-normal">
            ({execution.logs?.length || 0} entries)
          </span>
        </h2>
        {!execution.logs?.length ? (
          <div className="card text-center py-10 text-slate-500">No log entries found.</div>
        ) : (
          execution.logs.map((log, idx) => (
            <LogCard key={log._id} log={log} index={idx} />
          ))
        )}
      </div>
    </div>
  );
}
