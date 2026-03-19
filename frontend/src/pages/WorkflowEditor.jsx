import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { workflowApi, stepApi } from '../services/api';

const STEP_TYPES = ['task', 'approval', 'notification'];

const stepTypeColors = {
  task: 'badge-blue',
  approval: 'badge-yellow',
  notification: 'badge-purple',
};

const DEFAULT_SCHEMA = {
  incident_type: { type: 'string', required: true },
  severity: { type: 'string', required: true, allowed_values: ['High', 'Medium', 'Low'] },
  system: { type: 'string', required: true },
  location: { type: 'string', required: false },
  reported_by: { type: 'string', required: true },
};

export default function WorkflowEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [workflow, setWorkflow] = useState({
    name: '',
    description: '',
    isActive: true,
    inputSchema: DEFAULT_SCHEMA,
  });
  const [steps, setSteps] = useState([]);
  const [schemaJson, setSchemaJson] = useState(JSON.stringify(DEFAULT_SCHEMA, null, 2));
  const [schemaError, setSchemaError] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEdit);

  // New step form
  const [newStep, setNewStep] = useState({ name: '', stepType: 'task', order: 1 });

  useEffect(() => {
    if (!isEdit) return;
    (async () => {
      try {
        const res = await workflowApi.getById(id);
        const wf = res.data;
        setWorkflow({
          name: wf.name,
          description: wf.description || '',
          isActive: wf.isActive,
          inputSchema: wf.inputSchema,
        });
        setSchemaJson(JSON.stringify(wf.inputSchema, null, 2));
        setSteps(wf.steps || []);
        setNewStep((s) => ({ ...s, order: (wf.steps?.length || 0) + 1 }));
      } catch (err) {
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const validateSchema = (json) => {
    try {
      const parsed = JSON.parse(json);
      setSchemaError('');
      return parsed;
    } catch {
      setSchemaError('Invalid JSON format');
      return null;
    }
  };

  const handleSaveWorkflow = async () => {
    if (!workflow.name.trim()) return toast.error('Workflow name is required');
    const schema = validateSchema(schemaJson);
    if (!schema) return;

    try {
      setSaving(true);
      const payload = { ...workflow, inputSchema: schema };
      if (isEdit) {
        await workflowApi.update(id, payload);
        toast.success('Workflow updated');
      } else {
        const res = await workflowApi.create(payload);
        toast.success('Workflow created');
        navigate(`/workflows/${res.data._id}/edit`);
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAddStep = async () => {
    if (!newStep.name.trim()) return toast.error('Step name is required');
    if (!isEdit) return toast.error('Save the workflow first before adding steps');
    try {
      const res = await stepApi.create(id, newStep);
      setSteps((prev) => [...prev, res.data]);
      setNewStep({ name: '', stepType: 'task', order: steps.length + 2 });
      toast.success('Step added');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDeleteStep = async (stepId) => {
    if (!window.confirm('Delete this step?')) return;
    try {
      await stepApi.delete(stepId);
      setSteps((prev) => prev.filter((s) => s._id !== stepId));
      toast.success('Step deleted');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleSetStartStep = async (stepId) => {
    try {
      await stepApi.setStart(id, stepId);
      toast.success('Start step updated');
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32 text-slate-500">
        <svg className="animate-spin w-6 h-6 mr-2" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
        Loading workflow...
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-slide-up max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">
            {isEdit ? 'Edit Workflow' : 'New Workflow'}
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Define the workflow name, schema, and steps
          </p>
        </div>
        <button onClick={() => navigate('/workflows')} className="btn-secondary">
          ← Back
        </button>
      </div>

      {/* Workflow Details */}
      <div className="card space-y-4">
        <h2 className="text-base font-semibold text-white">Workflow Details</h2>
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="label">Workflow Name *</label>
            <input
              className="input"
              placeholder="e.g. Smart Incident Response"
              value={workflow.name}
              onChange={(e) => setWorkflow((w) => ({ ...w, name: e.target.value }))}
            />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea
              className="input resize-none"
              rows={2}
              placeholder="Brief description of this workflow..."
              value={workflow.description}
              onChange={(e) => setWorkflow((w) => ({ ...w, description: e.target.value }))}
            />
          </div>
          <div className="flex items-center gap-3">
            <label className="label mb-0">Active</label>
            <button
              onClick={() => setWorkflow((w) => ({ ...w, isActive: !w.isActive }))}
              className={`relative inline-flex h-6 w-11 rounded-full transition-colors duration-200 ${
                workflow.isActive ? 'bg-primary-600' : 'bg-slate-700'
              }`}
            >
              <span
                className={`inline-block w-4 h-4 rounded-full bg-white shadow transform transition-transform duration-200 mt-1 ${
                  workflow.isActive ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Input Schema */}
      <div className="card space-y-3">
        <div>
          <h2 className="text-base font-semibold text-white">Input Schema</h2>
          <p className="text-xs text-slate-500 mt-1">
            Define the fields required when executing this workflow (JSON format)
          </p>
        </div>
        <textarea
          className={`input font-mono text-xs resize-none ${schemaError ? 'border-red-500 focus:ring-red-500' : ''}`}
          rows={12}
          value={schemaJson}
          onChange={(e) => { setSchemaJson(e.target.value); validateSchema(e.target.value); }}
          spellCheck={false}
        />
        {schemaError && <p className="text-xs text-red-400">{schemaError}</p>}
      </div>

      <button onClick={handleSaveWorkflow} disabled={saving} className="btn-primary">
        {saving ? 'Saving...' : isEdit ? 'Update Workflow' : 'Create Workflow'}
      </button>

      {/* Steps (only in edit mode) */}
      {isEdit && (
        <div className="card space-y-5">
          <div>
            <h2 className="text-base font-semibold text-white">Workflow Steps</h2>
            <p className="text-xs text-slate-500 mt-1">
              Steps execute in order. Set a start step and add rules to control transitions.
            </p>
          </div>

          {/* Step list */}
          <div className="space-y-2">
            {steps.length === 0 ? (
              <p className="text-sm text-slate-500 py-4 text-center border border-dashed border-surface-border rounded-lg">
                No steps yet. Add your first step below.
              </p>
            ) : (
              steps.map((step, idx) => (
                <div
                  key={step._id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-surface border border-surface-border hover:border-slate-500 transition-colors"
                >
                  <span className="w-7 h-7 flex-shrink-0 rounded-full bg-primary-600/20 text-primary-400 text-xs font-bold flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">{step.name}</p>
                    <span className={stepTypeColors[step.stepType]}>{step.stepType}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleSetStartStep(step._id)}
                      className="btn-secondary text-xs py-1 px-2"
                      title="Set as start step"
                    >
                      ▶ Start
                    </button>
                    <button
                      onClick={() => handleDeleteStep(step._id)}
                      className="btn-danger text-xs py-1 px-2"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Add step form */}
          <div className="border-t border-surface-border pt-4">
            <h3 className="text-sm font-semibold text-slate-300 mb-3">Add New Step</h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-1">
                <label className="label">Step Name *</label>
                <input
                  className="input"
                  placeholder="e.g. Severity Analysis"
                  value={newStep.name}
                  onChange={(e) => setNewStep((s) => ({ ...s, name: e.target.value }))}
                />
              </div>
              <div>
                <label className="label">Type</label>
                <select
                  className="select"
                  value={newStep.stepType}
                  onChange={(e) => setNewStep((s) => ({ ...s, stepType: e.target.value }))}
                >
                  {STEP_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Order</label>
                <input
                  type="number"
                  className="input"
                  min={1}
                  value={newStep.order}
                  onChange={(e) => setNewStep((s) => ({ ...s, order: Number(e.target.value) }))}
                />
              </div>
            </div>
            <button onClick={handleAddStep} className="btn-primary mt-3">
              + Add Step
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
