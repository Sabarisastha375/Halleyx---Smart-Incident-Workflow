import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { executionAPI } from '../services/api';
import { Search, Eye, RefreshCw, X, ChevronLeft, ChevronRight, Loader } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

export default function ExecutionList() {
  const [executions, setExecutions] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState(null);
  const navigate = useNavigate();
  const limit = 15;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await executionAPI.list({ page, limit, status });
      setExecutions(res.data || []);
      setTotal(res.total || 0);
    } catch { toast.error('Failed to load executions'); }
    finally { setLoading(false); }
  }, [page, status]);

  useEffect(() => { load(); }, [load]);

  // Auto-refresh if there are active executions
  useEffect(() => {
    const hasActive = executions.some(e => ['in_progress', 'pending', 'waiting_approval'].includes(e.status));
    if (hasActive) {
      const t = setInterval(load, 5000);
      return () => clearInterval(t);
    }
  }, [executions, load]);

  const handleRetry = async (id, e) => {
    e.stopPropagation();
    setActionId(id);
    try {
      await executionAPI.retry(id);
      toast.success('Retrying...');
      load();
    } catch (err) { toast.error(err.error || 'Failed'); }
    finally { setActionId(null); }
  };

  const handleCancel = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Cancel this execution?')) return;
    setActionId(id);
    try {
      await executionAPI.cancel(id);
      toast.success('Canceled');
      load();
    } catch (err) { toast.error(err.error || 'Failed'); }
    finally { setActionId(null); }
  };

  const duration = (exec) => {
    if (!exec.started_at) return '-';
    const end = exec.ended_at ? new Date(exec.ended_at) : new Date();
    const secs = Math.round((end - new Date(exec.started_at)) / 1000);
    if (secs < 60) return `${secs}s`;
    return `${Math.round(secs / 60)}m`;
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Executions</h1>
          <p className="page-subtitle">{total} total execution{total !== 1 ? 's' : ''}</p>
        </div>
        <button className="btn btn-ghost" onClick={load}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      <div className="page-body">
        <div className="flex gap-3 mb-4">
          <select className="select" style={{ width: 200 }} value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}>
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="waiting_approval">Waiting Approval</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
            <option value="canceled">Canceled</option>
          </select>
        </div>

        {loading ? (
          <div className="flex-center" style={{ height: 300 }}><div className="spinner" style={{ width: 28, height: 28 }} /></div>
        ) : executions.length === 0 ? (
          <div className="empty-state">
            <h3>No executions found</h3>
            <p>Run a workflow to see executions here</p>
          </div>
        ) : (
          <>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Workflow</th>
                    <th>Severity</th>
                    <th>Status</th>
                    <th>Current Step</th>
                    <th>Triggered By</th>
                    <th>Started</th>
                    <th>Duration</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {executions.map(e => (
                    <tr key={e._id} onClick={() => navigate(`/executions/${e._id}`)} style={{ cursor: 'pointer' }}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{e.workflow_name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>v{e.workflow_version}</div>
                      </td>
                      <td>
                        {e.data?.severity ? (
                          <span className={`badge badge-${e.data.severity.toLowerCase()}`}>{e.data.severity}</span>
                        ) : '-'}
                      </td>
                      <td><span className={`badge badge-${e.status}`}>{e.status.replace('_', ' ')}</span></td>
                      <td style={{ fontSize: 12, color: 'var(--text-secondary)', maxWidth: 160 }}>
                        {e.current_step_name || (e.status === 'completed' ? '✓ Done' : '-')}
                      </td>
                      <td style={{ fontSize: 12 }}>{e.triggered_by || '-'}</td>
                      <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        {e.started_at ? formatDistanceToNow(new Date(e.started_at), { addSuffix: true }) : '-'}
                      </td>
                      <td style={{ fontSize: 12, fontFamily: 'var(--font-mono)' }}>{duration(e)}</td>
                      <td onClick={ev => ev.stopPropagation()}>
                        <div className="flex gap-1">
                          <button className="btn btn-ghost btn-xs" onClick={() => navigate(`/executions/${e._id}`)} title="View">
                            <Eye size={12} />
                          </button>
                          {e.status === 'failed' && (
                            <button className="btn btn-ghost btn-xs" onClick={(ev) => handleRetry(e._id, ev)} disabled={actionId === e._id} title="Retry">
                              {actionId === e._id ? <Loader size={12} /> : <RefreshCw size={12} />}
                            </button>
                          )}
                          {['in_progress', 'waiting_approval', 'pending'].includes(e.status) && (
                            <button className="btn btn-danger btn-xs" onClick={(ev) => handleCancel(e._id, ev)} disabled={actionId === e._id} title="Cancel">
                              {actionId === e._id ? <Loader size={12} /> : <X size={12} />}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="pagination">
                <button className="page-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}><ChevronLeft size={14} /></button>
                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => (
                  <button key={i + 1} className={`page-btn ${page === i + 1 ? 'active' : ''}`} onClick={() => setPage(i + 1)}>{i + 1}</button>
                ))}
                <button className="page-btn" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}><ChevronRight size={14} /></button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
