import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { executionAPI, aiAPI } from '../services/api';
import { ArrowLeft, CheckCircle, XCircle, Clock, AlertTriangle, ChevronDown, ChevronUp, RefreshCw, X, Sparkles, Loader, ThumbsUp, ThumbsDown } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

const STATUS_ICONS = {
  completed: <CheckCircle size={14} color="var(--accent-green)" />,
  failed: <XCircle size={14} color="var(--accent-red)" />,
  waiting_approval: <Clock size={14} color="var(--accent-yellow)" />,
  in_progress: <RefreshCw size={14} color="var(--accent-blue)" />,
  pending: <Clock size={14} color="var(--text-muted)" />,
};

export default function ExecutionTracker() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [execution, setExecution] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedLog, setExpandedLog] = useState(null);
  const [approving, setApproving] = useState(false);
  const [canceling, setCanceling] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [postMortem, setPostMortem] = useState(null);
  const [rcaText, setRcaText] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [showRCA, setShowRCA] = useState(false);

  const load = useCallback(async () => {
    try {
      const exec = await executionAPI.get(id);
      setExecution(exec);
    } catch { toast.error('Execution not found'); navigate('/executions'); }
    finally { setLoading(false); }
  }, [id, navigate]);

  useEffect(() => {
    load();
    const shouldPoll = ['in_progress', 'pending', 'waiting_approval'].includes(execution?.status);
    if (shouldPoll) {
      const t = setInterval(load, 3000);
      return () => clearInterval(t);
    }
  }, [load, execution?.status]);

  const handleApprove = async () => {
    setApproving(true);
    try {
      await executionAPI.approve(id, 'user-001');
      toast.success('Step approved!');
      load();
    } catch (err) { toast.error(err.error || 'Failed to approve'); }
    finally { setApproving(false); }
  };

  const handleReject = async () => {
    if (!window.confirm('Reject this step? The execution will fail.')) return;
    setApproving(true);
    try {
      await executionAPI.reject(id, 'user-001');
      toast.success('Step rejected');
      load();
    } catch (err) { toast.error(err.error || 'Failed to reject'); }
    finally { setApproving(false); }
  };

  const handleCancel = async () => {
    if (!window.confirm('Cancel this execution?')) return;
    setCanceling(true);
    try {
      await executionAPI.cancel(id);
      toast.success('Execution canceled');
      load();
    } catch (err) { toast.error(err.error || 'Failed to cancel'); }
    finally { setCanceling(false); }
  };

  const handleRetry = async () => {
    setRetrying(true);
    try {
      await executionAPI.retry(id);
      toast.success('Retrying...');
      load();
    } catch (err) { toast.error(err.error || 'Failed to retry'); }
    finally { setRetrying(false); }
  };

  const getPostMortem = async () => {
    setAiLoading(true);
    try {
      const result = await aiAPI.analyzeExecution(id);
      setPostMortem(result);
    } catch { toast.error('AI analysis failed'); }
    finally { setAiLoading(false); }
  };

  const getRCA = async () => {
    setAiLoading(true);
    try {
      const result = await aiAPI.generateRCA(id);
      setRcaText(result.rca);
      setShowRCA(true);
    } catch { toast.error('RCA generation failed'); }
    finally { setAiLoading(false); }
  };

  if (loading) return <div className="flex-center" style={{ height: 400 }}><div className="spinner" style={{ width: 28, height: 28 }} /></div>;
  if (!execution) return null;

  const isLive = ['in_progress', 'pending', 'waiting_approval'].includes(execution.status);
  const duration = execution.started_at && execution.ended_at
    ? Math.round((new Date(execution.ended_at) - new Date(execution.started_at)) / 1000)
    : null;

  return (
    <div>
      <div className="page-header">
        <div className="flex items-center gap-3">
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/executions')}><ArrowLeft size={14} /></button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="page-title">{execution.workflow_name}</h1>
              <span className={`badge badge-${execution.status}`}>{execution.status.replace('_', ' ')}</span>
              {isLive && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent-blue)', animation: 'pulse 1.5s infinite' }} />}
            </div>
            <p className="page-subtitle">
              v{execution.workflow_version} · Started {execution.started_at ? formatDistanceToNow(new Date(execution.started_at), { addSuffix: true }) : 'N/A'}
              {duration && ` · ${duration}s`}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {execution.status === 'failed' && (
            <button className="btn btn-ghost" onClick={handleRetry} disabled={retrying}>
              {retrying ? <Loader size={14} /> : <RefreshCw size={14} />} Retry
            </button>
          )}
          {isLive && (
            <button className="btn btn-danger" onClick={handleCancel} disabled={canceling}>
              {canceling ? <Loader size={14} /> : <X size={14} />} Cancel
            </button>
          )}
          {['completed', 'failed'].includes(execution.status) && (
            <>
              <button className="btn btn-purple btn-sm" onClick={getPostMortem} disabled={aiLoading}>
                <Sparkles size={13} /> Analysis
              </button>
              <button className="btn btn-purple btn-sm" onClick={getRCA} disabled={aiLoading}>
                <Sparkles size={13} /> Generate RCA
              </button>
            </>
          )}
        </div>
      </div>

      <div className="page-body">
        {/* Approval Banner */}
        {execution.status === 'waiting_approval' && (
          <div style={{ background: 'var(--accent-yellow-dim)', border: '1px solid rgba(245,158,11,0.4)', borderRadius: 12, padding: '16px 20px', marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontWeight: 700, color: 'var(--accent-yellow)', marginBottom: 4 }}>⏳ Awaiting Approval</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                Step "{execution.current_step_name}" requires approval to continue
              </div>
            </div>
            <div className="flex gap-2">
              <button className="btn btn-danger" onClick={handleReject} disabled={approving}>
                <ThumbsDown size={14} /> Reject
              </button>
              <button className="btn btn-success" onClick={handleApprove} disabled={approving}>
                {approving ? <Loader size={14} /> : <ThumbsUp size={14} />} Approve
              </button>
            </div>
          </div>
        )}

        <div className="grid-2" style={{ gap: 20 }}>
          {/* Input Data */}
          <div className="card">
            <div className="card-title">Input Data</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {Object.entries(execution.data || {}).map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ color: 'var(--text-muted)' }}>{k}</span>
                  <span className="text-mono" style={{ color: typeof v === 'string' && v.match(/^P[1-4]$/) ? `var(--accent-${v === 'P1' ? 'red' : v === 'P2' ? 'yellow' : 'green'})` : 'var(--accent-cyan)' }}>
                    {String(v)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Execution Info */}
          <div className="card">
            <div className="card-title">Execution Info</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {[
                ['ID', <span className="text-mono" style={{ fontSize: 10 }}>{execution._id}</span>],
                ['Status', <span className={`badge badge-${execution.status}`}>{execution.status.replace('_', ' ')}</span>],
                ['Triggered By', execution.triggered_by || '-'],
                ['Started', execution.started_at ? format(new Date(execution.started_at), 'MMM d, HH:mm:ss') : '-'],
                ['Ended', execution.ended_at ? format(new Date(execution.ended_at), 'MMM d, HH:mm:ss') : '-'],
                ['Duration', duration ? `${duration}s` : 'Ongoing'],
                ['Retries', execution.retries || 0],
                ['Current Step', execution.current_step_name || (execution.status === 'completed' ? 'Completed' : '-')],
              ].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ color: 'var(--text-muted)' }}>{k}</span>
                  <span>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Execution Logs */}
        <div style={{ marginTop: 24 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 14 }}>Execution Logs ({(execution.logs || []).length} steps)</h2>

          {(execution.logs || []).length === 0 ? (
            <div className="empty-state"><Clock size={32} /><p>No logs yet — execution may be starting...</p></div>
          ) : (
            <div className="stepper">
              {execution.logs.map((log, idx) => {
                const isExpanded = expandedLog === idx;
                const dur = log.started_at && log.ended_at
                  ? Math.round((new Date(log.ended_at) - new Date(log.started_at)) / 1000)
                  : null;

                return (
                  <div key={idx} className="step-item">
                    <div className="step-connector">
                      <div className={`step-dot ${log.status}`}>{STATUS_ICONS[log.status] || idx + 1}</div>
                      {idx < execution.logs.length - 1 && <div className="step-line" />}
                    </div>
                    <div className="step-content">
                      <div className="log-entry">
                        <div className="log-header" onClick={() => setExpandedLog(isExpanded ? null : idx)}>
                          <div className="flex items-center gap-2">
                            <span style={{ fontWeight: 700, fontSize: 13 }}>{log.step_name}</span>
                            <span className={`badge badge-${log.step_type}`}>{log.step_type}</span>
                            <span className={`badge badge-${log.status}`}>{log.status.replace('_', ' ')}</span>
                          </div>
                          <div className="flex items-center gap-8">
                            {dur !== null && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{dur}s</span>}
                            {log.selected_next_step && (
                              <span style={{ fontSize: 11, color: 'var(--accent-blue)' }}>→ {log.selected_next_step}</span>
                            )}
                            {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                          </div>
                        </div>

                        {log.error_message && (
                          <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start', marginTop: 8, padding: '8px 10px', background: 'var(--accent-red-dim)', borderRadius: 6, fontSize: 12, color: 'var(--accent-red)' }}>
                            <AlertTriangle size={12} style={{ flexShrink: 0, marginTop: 1 }} />
                            {log.error_message}
                          </div>
                        )}

                        {log.approval_action && (
                          <div style={{ marginTop: 8, fontSize: 12, color: log.approval_action === 'approved' ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                            {log.approval_action === 'approved' ? '✓' : '✗'} {log.approval_action} by {log.approverId || 'user'}
                          </div>
                        )}

                        {log.step_type === 'notification' && log.notificationMessage && (
                          <div style={{ marginTop: 8, padding: '10px 12px', background: 'var(--accent-blue-dim)', borderRadius: 6, fontSize: 13, color: 'var(--text-primary)', borderLeft: '3px solid var(--accent-blue)' }}>
                            <strong>Notification:</strong> {log.notificationMessage}
                          </div>
                        )}

                        {isExpanded && (
                          <>
                            {(log.evaluated_rules || []).length > 0 && (
                              <div className="log-rules">
                                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>Rule Evaluations</div>
                                {log.evaluated_rules.map((r, ri) => (
                                  <div key={ri} className={`rule-eval ${r.error ? 'error' : r.result ? 'match' : 'no-match'}`}>
                                    <span style={{ flexShrink: 0 }}>{r.error ? '⚠' : r.result ? '✓' : '✗'}</span>
                                    <code style={{ flex: 1, wordBreak: 'break-word' }}>{r.condition}</code>
                                  </div>
                                ))}
                              </div>
                            )}

                            {log.started_at && (
                              <div style={{ marginTop: 8, fontSize: 11, color: 'var(--text-muted)' }}>
                                {format(new Date(log.started_at), 'HH:mm:ss')}
                                {log.ended_at && ` → ${format(new Date(log.ended_at), 'HH:mm:ss')}`}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Post Mortem */}
        {postMortem && (
          <div className="card" style={{ marginTop: 24, border: '1px solid rgba(139,92,246,0.3)' }}>
            <div className="flex items-center gap-2 mb-4">
              <Sparkles size={16} color="var(--accent-purple)" />
              <div className="card-title" style={{ marginBottom: 0 }}>AI Post-Mortem Analysis</div>
            </div>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8 }}>{postMortem.summary}</div>
            </div>
            {postMortem.root_cause && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>Root Cause</div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{postMortem.root_cause}</div>
              </div>
            )}
            {postMortem.recommendations?.length > 0 && (
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>Recommendations</div>
                <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {postMortem.recommendations.map((r, i) => (
                    <li key={i} style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{r}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* RCA Modal */}
        {showRCA && rcaText && (
          <div className="modal-overlay" onClick={() => setShowRCA(false)}>
            <div className="modal modal-xl" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <div className="flex items-center gap-2">
                  <Sparkles size={16} color="var(--accent-purple)" />
                  <h2 className="modal-title">Root Cause Analysis Report</h2>
                </div>
                <button className="btn btn-ghost btn-sm" onClick={() => setShowRCA(false)}><X size={15} /></button>
              </div>
              <div className="modal-body">
                <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                  {rcaText}
                </pre>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
