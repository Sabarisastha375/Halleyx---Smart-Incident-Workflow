import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { workflowApi, stepApi, ruleApi } from '../services/api';

// ─── Sortable Rule Card ──────────────────────────────────────────────────────
function SortableRule({ rule, steps, onUpdate, onDelete }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: rule._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`p-4 rounded-lg border transition-all sortable-list-item ${
        isDragging
          ? 'border-primary-500 bg-primary-600/10 dragging-item'
          : 'border-surface-border bg-surface hover:border-slate-500'
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Drag handle */}
        <button
          {...attributes}
          {...listeners}
          className="mt-1 text-slate-500 hover:text-primary-400 cursor-grab active:cursor-grabbing p-1 rounded hover:bg-surface-hover transition-colors"
          title="Drag to reorder"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
          </svg>
        </button>

        {/* Rule content */}
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-2">
            <span className="badge-blue">Priority {rule.priority}</span>
            {rule.isDefault && <span className="badge-gray">DEFAULT</span>}
          </div>

          <div>
            <label className="label">Condition</label>
            <input
              className="input font-mono text-xs"
              value={rule.condition}
              onChange={(e) => onUpdate(rule._id, { condition: e.target.value })}
              placeholder='e.g. severity == "High" && system == "Payment"'
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Next Step</label>
              <select
                className="select"
                value={rule.nextStepId?._id || rule.nextStepId || ''}
                onChange={(e) =>
                  onUpdate(rule._id, { nextStepId: e.target.value || null })
                }
              >
                <option value="">— Terminal (END) —</option>
                {steps.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Is Default?</label>
              <button
                onClick={() => onUpdate(rule._id, { isDefault: !rule.isDefault })}
                className={`mt-1 relative inline-flex h-6 w-11 rounded-full transition-colors ${
                  rule.isDefault ? 'bg-primary-600' : 'bg-slate-700'
                }`}
              >
                <span
                  className={`inline-block w-4 h-4 rounded-full bg-white shadow transform transition-transform mt-1 ${
                    rule.isDefault ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Delete */}
        <button onClick={() => onDelete(rule._id)} className="btn-danger text-xs py-1 px-2 mt-1">
          ✕
        </button>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function RuleEditor() {
  const { id: workflowId } = useParams();
  const navigate = useNavigate();

  const [workflow, setWorkflow] = useState(null);
  const [steps, setSteps] = useState([]);
  const [selectedStep, setSelectedStep] = useState(null);
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingRuleId, setSavingRuleId] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const fetchWorkflow = useCallback(async () => {
    try {
      const res = await workflowApi.getById(workflowId);
      setWorkflow(res.data);
      setSteps(res.data.steps || []);
      if (res.data.steps?.length > 0 && !selectedStep) {
        setSelectedStep(res.data.steps[0]);
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [workflowId]);

  const fetchRules = useCallback(async (stepId) => {
    try {
      const res = await ruleApi.getByStep(stepId);
      setRules(res.data);
    } catch (err) {
      toast.error(err.message);
    }
  }, []);

  useEffect(() => { fetchWorkflow(); }, [fetchWorkflow]);
  useEffect(() => { if (selectedStep) fetchRules(selectedStep._id); }, [selectedStep, fetchRules]);

  const handleAddRule = async () => {
    if (!selectedStep) return toast.error('Select a step first');
    const maxPriority = rules.reduce((m, r) => Math.max(m, r.priority), 0);
    try {
      const res = await ruleApi.create(selectedStep._id, {
        condition: 'DEFAULT',
        nextStepId: null,
        priority: maxPriority + 1,
        isDefault: maxPriority === 0,
      });
      setRules((prev) => [...prev, res.data]);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleUpdateRule = async (ruleId, changes) => {
    try {
      setSavingRuleId(ruleId);
      const res = await ruleApi.update(ruleId, changes);
      setRules((prev) => prev.map((r) => (r._id === ruleId ? res.data : r)));
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSavingRuleId(null);
    }
  };

  const handleDeleteRule = async (ruleId) => {
    if (!window.confirm('Delete this rule?')) return;
    try {
      await ruleApi.delete(ruleId);
      setRules((prev) => prev.filter((r) => r._id !== ruleId));
      toast.success('Rule deleted');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = rules.findIndex((r) => r._id === active.id);
    const newIndex = rules.findIndex((r) => r._id === over.id);
    const reordered = arrayMove(rules, oldIndex, newIndex);

    // Update priorities based on new order
    const updated = reordered.map((r, i) => ({ ...r, priority: i + 1 }));
    setRules(updated);

    try {
      // Persist priority changes in bulk
      await ruleApi.reorder(updated.map((r) => ({ id: r._id, priority: r.priority })));
      toast.success('Rule order saved');
    } catch (err) {
      toast.error('Failed to save order: ' + err.message);
      // Rollback on error if necessary, but for now we just show error
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32 text-slate-500">
        <svg className="animate-spin w-6 h-6 mr-2" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
        Loading rules...
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Rule Editor</h1>
          <p className="text-sm text-slate-400 mt-1">
            {workflow?.name} — Configure transition rules for each step
          </p>
        </div>
        <button onClick={() => navigate(`/workflows/${workflowId}/edit`)} className="btn-secondary">
          ← Back to Workflow
        </button>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Step selector */}
        <div className="col-span-1 card space-y-2">
          <h2 className="text-sm font-semibold text-white mb-3">Steps</h2>
          {steps.length === 0 ? (
            <p className="text-sm text-slate-500">No steps found. Add steps in the workflow editor.</p>
          ) : (
            steps.map((step) => (
              <button
                key={step._id}
                onClick={() => setSelectedStep(step)}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all ${
                  selectedStep?._id === step._id
                    ? 'bg-primary-600/20 text-primary-300 border border-primary-600/40'
                    : 'text-slate-400 hover:text-white hover:bg-surface-hover'
                }`}
              >
                <p className="font-medium">{step.name}</p>
                <p className="text-xs capitalize opacity-60">{step.stepType}</p>
              </button>
            ))
          )}
        </div>

        {/* Rules for selected step */}
        <div className="col-span-2 space-y-4">
          {selectedStep ? (
            <>
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-white">
                  Rules for: <span className="text-primary-400">{selectedStep.name}</span>
                </h2>
                <button onClick={handleAddRule} className="btn-primary text-xs">
                  + Add Rule
                </button>
              </div>

              {/* Hint */}
              <div className="rounded-lg bg-surface-hover border border-surface-border p-3 text-xs text-slate-400">
                💡 Drag rules to reorder priority. The first matching rule wins. Use
                {' '}<code className="text-primary-400">DEFAULT</code> as a fallback condition.
              </div>

              {rules.length === 0 ? (
                <div className="card text-center py-10 text-slate-500">
                  No rules yet. Click <strong className="text-slate-300">+ Add Rule</strong> to add the first rule.
                </div>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={rules.map((r) => r._id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-3">
                      {rules.map((rule) => (
                        <SortableRule
                          key={rule._id}
                          rule={rule}
                          steps={steps}
                          onUpdate={handleUpdateRule}
                          onDelete={handleDeleteRule}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
            </>
          ) : (
            <div className="card text-center py-16 text-slate-500">
              ← Select a step to view and manage its rules
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
