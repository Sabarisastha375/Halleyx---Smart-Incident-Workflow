import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { executionAPI, aiAPI } from '../services/api';
import { Eye, Sparkles, Loader, X, ChevronLeft, ChevronRight, FileText } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export default function AuditLog() {
  const [executions, setExecutions] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [rcaModal, setRcaModal] = useState(null);
  const [rcaLoading, setRcaLoading] = useState(null);
  const navigate = useNavigate();
  const limit = 20;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await executionAPI.list({ page, limit, status });
      setExecutions(res.data || []);
      setTotal(res.total || 0);
    } catch { toast.error('Failed to load audit log'); }
    finally { setLoading(false); }
  }, [page, status]);

  useEffect(() => { load(); }, [load]);

  const generateRCA = async (execId, execName) => {
    setRcaLoading(execId);
    try {
      const result = await aiAPI.generateRCA(execId);
      setRcaModal({ rca: result.rca, name: execName });
    } catch { toast.error('Failed to generate RCA'); }
    finally { setRcaLoading(null); }
  };

  const totalPages = Math.ceil(total / limit);

  const durationStr = (exec) => {
    if (!exec.started_at || !exec.ended_at) return '-';
    const secs = Math.round((new Date(exec.ended_at) - new Date(exec.started_at)) / 1000);
    if (secs < 60) return `${secs}s`;
    const mins = Math.floor(secs / 60);
    return `${mins}m ${secs % 60}s`;
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Audit Log</h1>
          <p className="page-subtitle">Complete execution history for compliance and review</p>
        </div>
      </div>

      <div className="page-body">
        <div className="flex gap-3 mb-4">
          <select className="select" style={{ width: 200 }} value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}>
            <option value="">All Status</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
            <option value="canceled">Canceled</option>
            <option value="in_progress">In Progress</option>
            <option value="waiting_approval">Waiting Approval</option>
          </select>
        </div>

        {loading ? (
          <div className="flex-center" style={{ height: 300 }}><div className="spinner" style={{ width: 28, height: 28 }} /></div>
        ) : (
          <>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Execution ID</th>
                    <th>Workflow</th>
                    <th>Version</th>
                    <th>Severity</th>
                    <th>Status</th>
                    <th>Started By</th>
                    <th>Start Time</th>
                    <th>End Time</th>
                    <th>Duration</th>
                    <th>Steps</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {executions.map(e => (
                    <tr key={e._id}>
                      <td>
                        <span className="text-mono" style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                          {e._id?.toString().slice(-8)}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600, maxWidth: 180 }}>{e.workflow_name}</td>
                      <td><span className="text-mono">v{e.workflow_version}</span></td>
                      <td>
                        {e.data?.severity ? <span className={`badge badge-${e.data.severity.toLowerCase()}`}>{e.data.severity}</span> : '-'}
                      </td>
                      <td><span className={`badge badge-${e.status}`}>{e.status.replace('_', ' ')}</span></td>
                      <td style={{ fontSize: 12 }}>{e.triggered_by || '-'}</td>
                      <td style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        {e.started_at ? format(new Date(e.started_at), 'MMM d HH:mm:ss') : '-'}
                      </td>
                      <td style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        {e.ended_at ? format(new Date(e.ended_at), 'MMM d HH:mm:ss') : '-'}
                      </td>
                      <td style={{ fontSize: 12, fontFamily: 'var(--font-mono)' }}>{durationStr(e)}</td>
                      <td style={{ fontSize: 12 }}>{(e.logs || []).length}</td>
                      <td>
                        <div className="flex gap-1">
                          <button className="btn btn-ghost btn-xs" onClick={() => navigate(`/executions/${e._id}`)} title="View Logs">
                            <Eye size={12} /> Logs
                          </button>
                          {['completed', 'failed'].includes(e.status) && (
                            <button className="btn btn-purple btn-xs" onClick={() => generateRCA(e._id, e.workflow_name)} disabled={rcaLoading === e._id} title="Generate RCA">
                              {rcaLoading === e._id ? <Loader size={11} /> : <><Sparkles size={11} /> RCA</>}
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

      {/* RCA Modal */}
      {rcaModal && (
        <div className="modal-overlay" onClick={() => setRcaModal(null)}>
          <div className="modal modal-xl" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="flex items-center gap-2">
                <FileText size={16} color="var(--accent-purple)" />
                <div>
                  <h2 className="modal-title">Root Cause Analysis</h2>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{rcaModal.name}</div>
                </div>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => setRcaModal(null)}><X size={15} /></button>
            </div>
            <div className="modal-body">
              <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7, maxHeight: '60vh', overflowY: 'auto' }}>
                {rcaModal.rca}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
