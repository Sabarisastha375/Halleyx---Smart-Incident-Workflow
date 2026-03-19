import { useState } from 'react';
import { aiAPI, workflowAPI, stepAPI, ruleAPI } from '../services/api';
import { X, Sparkles, Loader, Check } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AIWorkflowModal({ onClose, onCreated }) {
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [saving, setSaving] = useState(false);

  const generate = async () => {
    if (!description.trim()) return toast.error('Please describe the workflow');
    setLoading(true);
    try {
      const result = await aiAPI.suggestWorkflow(description);
      setPreview(result);
    } catch { toast.error('AI generation failed'); }
    finally { setLoading(false); }
  };

  const saveWorkflow = async () => {
    if (!preview) return;
    setSaving(true);
    try {
      const wf = await workflowAPI.create({
        name: preview.name,
        description: preview.description,
        input_schema: preview.input_schema || {},
        tags: ['ai-generated']
      });

      const stepIdMap = {};
      const stepsWithSuggestedRules = [];

      for (const s of (preview.steps || [])) {
        const step = await stepAPI.create(wf._id, {
          name: s.name,
          step_type: s.step_type,
          order: s.order,
          metadata: s.metadata || {}
        });
        stepIdMap[s.name] = step._id;
        stepsWithSuggestedRules.push({ step, suggested: s.suggested_rules || [] });
      }

      // Set start step
      const firstStep = Object.values(stepIdMap)[0];
      if (firstStep) await workflowAPI.update(wf._id, { start_step_id: firstStep });

      // Create rules
      for (const { step, suggested } of stepsWithSuggestedRules) {
        for (let i = 0; i < suggested.length; i++) {
          const r = suggested[i];
          const nextId = r.next_step ? stepIdMap[r.next_step] : null;
          await ruleAPI.create(step._id, {
            condition: r.condition,
            next_step_id: nextId || null,
            priority: r.priority || (i + 1),
            description: r.description || ''
          });
        }
      }

      toast.success('AI workflow created!');
      onCreated();
    } catch (err) {
      toast.error('Failed to save workflow');
    } finally { setSaving(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-xl">
        <div className="modal-header">
          <div className="flex items-center gap-2">
            <Sparkles size={18} color="var(--accent-purple)" />
            <h2 className="modal-title">AI Workflow Generator</h2>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}><X size={15} /></button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Describe your workflow in plain English</label>
            <textarea className="textarea" value={description} onChange={e => setDescription(e.target.value)}
              placeholder="e.g. I need a workflow for security breaches that pages the security team, escalates to CISO for P1 incidents, isolates affected systems, and files a compliance ticket..."
              rows={4} />
          </div>
          <button className="btn btn-purple" onClick={generate} disabled={loading || !description.trim()}>
            {loading ? <><Loader size={14} /> Generating...</> : <><Sparkles size={14} /> Generate Workflow</>}
          </button>

          {preview && (
            <div style={{ marginTop: 20 }}>
              <div className="divider" />
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{preview.name}</div>
                <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{preview.description}</div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>
                    Input Schema ({Object.keys(preview.input_schema || {}).length} fields)
                  </div>
                  <div style={{ background: 'var(--bg-secondary)', borderRadius: 8, padding: 12, border: '1px solid var(--border)' }}>
                    {Object.entries(preview.input_schema || {}).map(([k, v]) => (
                      <div key={k} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 12 }}>
                        <span className="text-mono">{k}</span>
                        <span style={{ color: 'var(--text-muted)' }}>{v.type}{v.required ? ' · required' : ''}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>
                    Steps ({(preview.steps || []).length})
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {(preview.steps || []).map((s, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px' }}>
                        <span style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{i + 1}</span>
                        <span style={{ flex: 1, fontSize: 13 }}>{s.name}</span>
                        <span className={`badge badge-${s.step_type}`}>{s.step_type}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          {preview && (
            <button className="btn btn-primary" onClick={saveWorkflow} disabled={saving}>
              {saving ? <><Loader size={14} /> Saving...</> : <><Check size={14} /> Save Workflow</>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
