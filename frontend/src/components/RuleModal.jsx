import { useState } from 'react';
import { ruleAPI, aiAPI } from '../services/api';
import { X, Sparkles, Check, AlertCircle, Loader } from 'lucide-react';
import toast from 'react-hot-toast';

export default function RuleModal({ step, rule, steps, onClose, onSaved }) {
  const [condition, setCondition] = useState(rule?.condition || '');
  const [nextStepId, setNextStepId] = useState(rule?.next_step_id || '');
  const [priority, setPriority] = useState(rule?.priority || 1);
  const [description, setDescription] = useState(rule?.description || '');
  const [validation, setValidation] = useState(null);
  const [validating, setValidating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [loadingAI, setLoadingAI] = useState(false);

  const availableSteps = steps.filter(s => s._id !== step._id);

  const validate = async () => {
    if (!condition.trim()) return;
    setValidating(true);
    try {
      const result = await ruleAPI.validate(condition);
      setValidation(result);
    } catch { setValidation({ valid: false, error: 'Validation failed' }); }
    finally { setValidating(false); }
  };

  const getAISuggestions = async () => {
    setLoadingAI(true);
    try {
      const suggestions = await aiAPI.suggestRules({
        step_name: step.name,
        step_type: step.step_type,
        schema_fields: ['severity', 'incident_type', 'affected_system', 'region', 'priority', 'affected_users'],
        available_steps: availableSteps.map(s => s.name)
      });
      setAiSuggestions(suggestions || []);
    } catch { toast.error('AI suggestion failed'); }
    finally { setLoadingAI(false); }
  };

  const applySuggestion = (s) => {
    setCondition(s.condition);
    setDescription(s.description || '');
    setPriority(s.priority || priority);
    const matchedStep = availableSteps.find(st => st.name === s.suggested_next_step);
    if (matchedStep) setNextStepId(matchedStep._id);
    setValidation(null);
  };

  const save = async () => {
    if (!condition.trim()) return toast.error('Condition is required');
    setSaving(true);
    try {
      const payload = { condition, next_step_id: nextStepId || null, priority: Number(priority), description };
      if (rule?._id) await ruleAPI.update(rule._id, payload);
      else await ruleAPI.create(step._id, payload);
      toast.success(rule ? 'Rule updated!' : 'Rule added!');
      onSaved();
    } catch (err) {
      toast.error(err.error || 'Failed to save rule');
    } finally { setSaving(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-lg">
        <div className="modal-header">
          <div>
            <h2 className="modal-title">{rule ? 'Edit Rule' : 'Add Rule'}</h2>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Step: {step.name}</div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}><X size={15} /></button>
        </div>
        <div className="modal-body">
          {/* AI Suggestions */}
          <div className="flex items-center justify-between mb-3">
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Get AI-powered rule suggestions</span>
            <button className="btn btn-purple btn-sm" onClick={getAISuggestions} disabled={loadingAI}>
              {loadingAI ? <><Loader size={12} /> Loading...</> : <><Sparkles size={12} /> AI Suggest</>}
            </button>
          </div>

          {aiSuggestions.length > 0 && (
            <div style={{ marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {aiSuggestions.map((s, i) => (
                <div key={i} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 8, padding: '9px 12px', cursor: 'pointer', transition: 'border-color 0.15s' }}
                  onClick={() => applySuggestion(s)}
                  onMouseEnter={el => el.currentTarget.style.borderColor = 'var(--accent-purple)'}
                  onMouseLeave={el => el.currentTarget.style.borderColor = 'var(--border)'}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                    <code style={{ fontSize: 11, color: 'var(--accent-cyan)' }}>{s.condition}</code>
                    <span style={{ fontSize: 11, color: 'var(--accent-purple)' }}>p{s.priority}</span>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.description}</div>
                </div>
              ))}
            </div>
          )}

          <div className="divider" />

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Priority (lower = higher priority)</label>
              <input className="input" type="number" min={1} max={999} value={priority} onChange={e => setPriority(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Next Step (empty = end workflow)</label>
              <select className="select" value={nextStepId} onChange={e => setNextStepId(e.target.value)}>
                <option value="">— End Workflow —</option>
                {availableSteps.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Condition *</label>
            <div style={{ position: 'relative' }}>
              <textarea className="textarea input-mono" value={condition} onChange={e => { setCondition(e.target.value); setValidation(null); }}
                placeholder={`severity == 'P1' && region == 'US-EAST'\nOR\nDEFAULT`} rows={3} onBlur={validate} />
            </div>
            {validating && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Validating...</div>}
            {validation && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 5, fontSize: 12, color: validation.valid ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                {validation.valid ? <Check size={12} /> : <AlertCircle size={12} />}
                {validation.valid ? 'Valid condition syntax' : validation.error}
              </div>
            )}
          </div>

          <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: 'var(--text-secondary)' }}>
            <strong style={{ color: 'var(--text-primary)' }}>Syntax:</strong>
            <div style={{ marginTop: 4, display: 'flex', flexWrap: 'wrap', gap: '4px 16px', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--accent-cyan)' }}>
              <span>severity == 'P1'</span>
              <span>amount &gt; 100</span>
              <span>region != 'US'</span>
              <span>severity == 'P1' && region == 'US'</span>
              <span>contains(system, "payment")</span>
              <span>DEFAULT</span>
            </div>
          </div>

          <div className="form-group" style={{ marginTop: 12 }}>
            <label className="form-label">Description (optional)</label>
            <input className="input" value={description} onChange={e => setDescription(e.target.value)} placeholder="P1 outages immediately escalate to CTO" />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-ghost" onClick={validate} disabled={validating || !condition.trim()}>Validate</button>
          <button className="btn btn-primary" onClick={save} disabled={saving}>
            {saving ? 'Saving...' : (rule ? 'Update Rule' : 'Add Rule')}
          </button>
        </div>
      </div>
    </div>
  );
}
