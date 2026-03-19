import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { workflowApi } from '../services/api';
import {
  PageHeader,
  Table,
  ActiveBadge,
  VersionBadge,
  Button,
  ConfirmDialog,
} from '../components';

export default function WorkflowList() {
  const navigate = useNavigate();
  const [workflows, setWorkflows] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [confirm, setConfirm] = useState({ open: false, id: null, name: '' });
  const [deleting, setDeleting] = useState(false);

  const fetchWorkflows = async () => {
    try {
      setLoading(true);
      const res = await workflowApi.getAll({ page, limit: 10, search });
      setWorkflows(res.workflows);
      setPagination(res.pagination);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delay = setTimeout(fetchWorkflows, 300);
    return () => clearTimeout(delay);
  }, [search, page]);

  const handleDeleteConfirmed = async () => {
    try {
      setDeleting(true);
      await workflowApi.delete(confirm.id);
      toast.success('Workflow deleted');
      setConfirm({ open: false, id: null, name: '' });
      fetchWorkflows();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeleting(false);
    }
  };

  const COLUMNS = ['Name', 'Version', 'Steps', 'Status', { label: 'Actions', className: 'text-right' }];

  return (
    <div className="space-y-6 animate-slide-up">
      <PageHeader
        title="Workflows"
        subtitle="Create and manage incident response workflows"
        action={
          <Link to="/workflows/new">
            <Button
              variant="primary"
              icon={
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              }
            >
              New Workflow
            </Button>
          </Link>
        }
      />

      {/* Search */}
      <div className="card">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.804 7.5 7.5 0 0016.803 15.803z" />
          </svg>
          <input
            type="text"
            className="input pl-10"
            placeholder="Search workflows..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
      </div>

      {/* Table */}
      <Table
        columns={COLUMNS}
        data={workflows}
        loading={loading}
        pagination={pagination}
        onPageChange={setPage}
        emptyTitle="No workflows found"
        emptyDescription="Get started by creating your first workflow."
        emptyAction={
          <Link to="/workflows/new">
            <Button variant="primary">Create your first workflow</Button>
          </Link>
        }
        renderRow={(wf) => (
          <tr key={wf._id}>
            <td>
              <div>
                <p className="font-semibold text-white">{wf.name}</p>
                {wf.description && (
                  <p className="text-xs text-slate-500 mt-0.5 truncate max-w-xs">{wf.description}</p>
                )}
              </div>
            </td>
            <td><VersionBadge version={wf.version} /></td>
            <td><span className="font-mono text-slate-300">{wf.stepCount ?? '—'}</span></td>
            <td><ActiveBadge isActive={wf.isActive} /></td>
            <td>
              <div className="flex items-center justify-end gap-2">
                <Link to={`/workflows/${wf._id}/edit`}>
                  <Button variant="secondary" size="sm">Edit</Button>
                </Link>
                <Link to={`/workflows/${wf._id}/rules`}>
                  <Button variant="secondary" size="sm">Rules</Button>
                </Link>
                <Link to={`/workflows/${wf._id}/execute`}>
                  <Button variant="primary" size="sm">Execute</Button>
                </Link>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => setConfirm({ open: true, id: wf._id, name: wf.name })}
                >
                  Delete
                </Button>
              </div>
            </td>
          </tr>
        )}
      />

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={confirm.open}
        onClose={() => setConfirm({ open: false, id: null, name: '' })}
        onConfirm={handleDeleteConfirmed}
        title="Delete Workflow"
        description={`Are you sure you want to delete "${confirm.name}"? This will also remove all of its steps. This cannot be undone.`}
        confirmLabel="Delete"
        confirmVariant="danger"
        loading={deleting}
      />
    </div>
  );
}
