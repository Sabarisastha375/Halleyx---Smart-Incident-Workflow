import { useState } from 'react';
import { workflowAPI } from '../services/api';
import { X, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

const FIELD_TYPES = ['string', 'number', 'boolean'];

export default function WorkflowFormModal({ workflow, onClose, onSaved }) {
  const [name, setName] = useState(workflow?.name || '');
  const [description, setDescription] = useState(workflow?.description || '');
  const [tags, setTags] = useState((workflow?.tags || []).join(', '));
  const [isActive, setIsActive] = useState(workflow?.is_active ?? true);
  const [fields, setFields] = useState(() => {
    if (workflow?.input_schema) {
      return Object.entries(workflow.input_schema).map(([key, val]) => ({
        key, type: val.type || 'string', required: val.required || false,
        allowed_values: (val.allowed_values || []).join(',')
      }));
    }
    return [{ key: 'severity', type: 'string', required: true, allowed_values: 'P1,P2,P3,P4' }];
  });
  const [saving, setSaving] = useState(false);

  const addField = () => setFields(f => [...f, { key: '', type: 'string', required: false, allowed_values: '' }]);
  const removeField = (i) => setFields(f => f.filter((_, idx) => idx !== i));
  const updateField = (i, key, val) => setFields(f => f.map((field, idx) => idx === i ? { ...field, [key]: val } : field));

  const save = async () => {
    if (!name.trim()) return toast.error('Name is required');
    setSaving(true);
    try {
      const input_schema = {};
      for (const f of fields) {
        if (!f.key.trim()) continue;
        input_schema[f.key.trim()] = {
          type: f.type, required: f.required,
          ...(f.allowed_values ? { allowed_values: f.allowed_values.split(',').map(v => v.trim()).filter(Boolean) } : {})
        };
      }
      const payload = { name: name.trim(), description, is_active: isActive, input_schema, tags: tags.split(',').map(t => t.trim()).filter(Boolean) };
      if (workflow?._id) await workflowAPI.update(workflow._id, payload);
      else await workflowAPI.create(payload);
      toast.success(workflow ? 'Workflow updated!' : 'Workflow created!');
      onSaved();
    } catch (err) {
      toast.error(err.error || 'Failed to save');
    } finally { setSaving(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-lg">
        <div className="modal-header">
          <h2 className="modal-title">{workflow ? 'Edit Workflow' : 'Create Workflow'}</h2>
          <button className="btn btn-ghost btn-sm" onClick={onClose}><X size={15} /></button>
        </div>
        <div className="modal-body">
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Workflow Name *</label>
              <input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="P1 Incident Response" />
            </div>
            <div className="form-group">
              <label className="form-label">Tags</label>
              <input className="input" value={tags} onChange={e => setTags(e.target.value)} placeholder="incident, p1, critical" />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="textarea" value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe this workflow..." rows={2} />
          </div>
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} />
              Active
            </label>
          </div>

          <div className="divider" />
          <div className="flex items-center justify-between mb-4">
            <div style={{ fontWeight: 700, fontSize: 13 }}>Input Schema Fields</div>
            <button className="btn btn-ghost btn-sm" onClick={addField}><Plus size={13} /> Add Field</button>
          </div>

          {fields.map((f, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 80px 1.5fr 32px', gap: 8, marginBottom: 8, alignItems: 'end' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                {i === 0 && <label className="form-label">Field Name</label>}
                <input className="input input-mono" value={f.key} onChange={e => updateField(i, 'key', e.target.value)} placeholder="field_name" />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                {i === 0 && <label className="form-label">Type</label>}
                <select className="select" value={f.type} onChange={e => updateField(i, 'type', e.target.value)}>
                  {FIELD_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 0, textAlign: 'center' }}>
                {i === 0 && <label className="form-label">Req.</label>}
                <input type="checkbox" checked={f.required} onChange={e => updateField(i, 'required', e.target.checked)} style={{ marginTop: 10 }} />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                {i === 0 && <label className="form-label">Allowed Values (comma-sep)</label>}
                <input className="input input-mono" value={f.allowed_values} onChange={e => updateField(i, 'allowed_values', e.target.value)} placeholder="P1,P2,P3" />
              </div>
              <button className="btn btn-ghost btn-sm" style={{ marginTop: i === 0 ? 22 : 0 }} onClick={() => removeField(i)}>
                <Trash2 size={13} color="var(--accent-red)" />
              </button>
            </div>
          ))}
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={save} disabled={saving}>
            {saving ? 'Saving...' : (workflow ? 'Update Workflow' : 'Create Workflow')}
          </button>
        </div>
      </div>
    </div>
  );
}
