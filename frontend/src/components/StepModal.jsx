import { useState } from 'react';
import { stepAPI } from '../services/api';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';

export default function StepModal({ step, workflowId, onClose, onSaved }) {
  const [name, setName] = useState(step?.name || '');
  const [type, setType] = useState(step?.step_type || 'task');
  const [channel, setChannel] = useState(step?.metadata?.channel || 'slack');
  const [template, setTemplate] = useState(step?.metadata?.template || '');
  const [assigneeEmail, setAssigneeEmail] = useState(step?.metadata?.assignee_email || '');
  const [instructions, setInstructions] = useState(step?.metadata?.instructions || '');
  const [slaMinutes, setSlaMinutes] = useState(step?.metadata?.sla_minutes || 30);
  const [loopEnabled, setLoopEnabled] = useState(step?.loop_config?.enabled || false);
  const [maxIter, setMaxIter] = useState(step?.loop_config?.max_iterations || 3);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!name.trim()) return toast.error('Step name is required');
    setSaving(true);
    try {
      const payload = {
        name: name.trim(), step_type: type,
        metadata: { channel, template, assignee_email: assigneeEmail, instructions, sla_minutes: Number(slaMinutes) },
        loop_config: { enabled: loopEnabled, max_iterations: Number(maxIter) }
      };
      if (step?._id) await stepAPI.update(step._id, payload);
      else await stepAPI.create(workflowId, payload);
      toast.success(step ? 'Step updated!' : 'Step added!');
      onSaved();
    } catch (err) {
      toast.error(err.error || 'Failed to save step');
    } finally { setSaving(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">{step ? 'Edit Step' : 'Add Step'}</h2>
          <button className="btn btn-ghost btn-sm" onClick={onClose}><X size={15} /></button>
        </div>
        <div className="modal-body">
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Step Name *</label>
              <input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="Manager Approval" />
            </div>
            <div className="form-group">
              <label className="form-label">Step Type *</label>
              <select className="select" value={type} onChange={e => setType(e.target.value)}>
                <option value="task">Task</option>
                <option value="approval">Approval</option>
                <option value="notification">Notification</option>
              </select>
            </div>
          </div>

          {type === 'notification' && (
            <>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Channel</label>
                  <select className="select" value={channel} onChange={e => setChannel(e.target.value)}>
                    <option value="slack">Slack</option>
                    <option value="email">Email</option>
                    <option value="ui">UI</option>
                    <option value="pagerduty">PagerDuty</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Recipient Email</label>
                  <input className="input" value={assigneeEmail} onChange={e => setAssigneeEmail(e.target.value)} placeholder="oncall@company.com" />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Message Template</label>
                <textarea className="textarea" value={template} onChange={e => setTemplate(e.target.value)} placeholder="🚨 {{severity}} Incident: {{incident_title}}" rows={3} />
                <span className="form-hint">Use {'{{field_name}}'} for dynamic values</span>
              </div>
            </>
          )}

          {type === 'approval' && (
            <>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Approver Email</label>
                  <input className="input" value={assigneeEmail} onChange={e => setAssigneeEmail(e.target.value)} placeholder="manager@company.com" />
                </div>
                <div className="form-group">
                  <label className="form-label">SLA (minutes)</label>
                  <input className="input" type="number" value={slaMinutes} onChange={e => setSlaMinutes(e.target.value)} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Instructions</label>
                <textarea className="textarea" value={instructions} onChange={e => setInstructions(e.target.value)} placeholder="Review the incident details and approve escalation path" rows={2} />
              </div>
            </>
          )}

          {type === 'task' && (
            <div className="form-group">
              <label className="form-label">Instructions</label>
              <textarea className="textarea" value={instructions} onChange={e => setInstructions(e.target.value)} placeholder="Describe what this task should do..." rows={3} />
            </div>
          )}

          <div className="divider" />
          <div className="flex items-center gap-3 mb-3">
            <input type="checkbox" id="loopEnabled" checked={loopEnabled} onChange={e => setLoopEnabled(e.target.checked)} />
            <label htmlFor="loopEnabled" style={{ fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Enable Loop (retry this step)</label>
          </div>
          {loopEnabled && (
            <div className="form-group">
              <label className="form-label">Max Iterations</label>
              <input className="input" type="number" min={1} max={20} value={maxIter} onChange={e => setMaxIter(e.target.value)} style={{ width: 120 }} />
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={save} disabled={saving}>
            {saving ? 'Saving...' : (step ? 'Update Step' : 'Add Step')}
          </button>
        </div>
      </div>
    </div>
  );
}
