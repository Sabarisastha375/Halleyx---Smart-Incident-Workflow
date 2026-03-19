import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { executionAPI } from '../services/api';
import {
  PageHeader,
  Table,
  StatusBadge,
  VersionBadge,
  Button,
  FormField,
} from '../components';

const STATUS_OPTIONS = ['', 'pending', 'in_progress', 'completed', 'failed', 'canceled'];

export default function ExecutionsList() {
  const [executions, setExecutions] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  const fetchExecutions = async () => {
    try {
      setLoading(true);
      const res = await executionAPI.list({ page, limit: 15, status: statusFilter || undefined });
      setExecutions(res.executions);
      setPagination(res.pagination);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchExecutions(); }, [page, statusFilter]);

  const handleCancel = async (id) => {
    try {
      await executionAPI.cancel(id);
      toast.success('Execution canceled');
      fetchExecutions();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleRetry = async (id) => {
    try {
      await executionAPI.retry(id);
      toast.success('Execution retried');
      fetchExecutions();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const COLUMNS = [
    'Workflow', 'Status', 'Triggered By', 'Version', 'Retries', 'Started',
    { label: 'Actions', className: 'text-right' },
  ];

  return (
    <div className="space-y-6 animate-slide-up">
      <PageHeader
        title="Executions"
        subtitle="View and manage all workflow executions"
        action={
          <Link to="/workflows">
            <Button variant="primary">← Workflows</Button>
          </Link>
        }
      />

      {/* Filter bar */}
      <div className="card flex items-end gap-4">
        <FormField label="Filter by Status" className="flex-none w-52">
          <select
            className="select"
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s || 'All Statuses'}</option>
            ))}
          </select>
        </FormField>
        <Button variant="secondary" size="sm" onClick={fetchExecutions}>
          Refresh
        </Button>
      </div>

      {/* Table */}
      <Table
        columns={COLUMNS}
        data={executions}
        loading={loading}
        pagination={pagination}
        onPageChange={setPage}
        emptyTitle="No executions found"
        emptyDescription={`Go to a workflow and click Execute to start one${statusFilter ? ` with status "${statusFilter}"` : ''}.`}
        renderRow={(ex) => (
          <tr key={ex._id}>
            <td>
              <p className="font-semibold text-white">{ex.workflowId?.name || '—'}</p>
              <p className="text-xs font-mono text-slate-600 truncate max-w-xs">{ex._id}</p>
            </td>
            <td><StatusBadge status={ex.status} /></td>
            <td className="text-slate-300">{ex.triggeredBy || '—'}</td>
            <td><VersionBadge version={ex.workflowVersion} /></td>
            <td className="text-slate-300">{ex.retries}</td>
            <td className="text-slate-400 text-xs">
              {ex.startedAt ? new Date(ex.startedAt).toLocaleString() : '—'}
            </td>
            <td>
              <div className="flex items-center justify-end gap-2">
                <Link to={`/executions/${ex._id}`}>
                  <Button variant="secondary" size="sm">View Logs</Button>
                </Link>
                {ex.status === 'failed' && (
                  <Button variant="success" size="sm" onClick={() => handleRetry(ex._id)}>
                    Retry
                  </Button>
                )}
                {['pending', 'in_progress'].includes(ex.status) && (
                  <Button variant="danger" size="sm" onClick={() => handleCancel(ex._id)}>
                    Cancel
                  </Button>
                )}
              </div>
            </td>
          </tr>
        )}
      />
    </div>
  );
}
