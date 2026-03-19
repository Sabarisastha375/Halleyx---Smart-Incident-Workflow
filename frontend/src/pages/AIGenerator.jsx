import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { aiAPI } from '../services/api';
import { Button, StepTypeTag, AlertBox } from '../components';

const EXAMPLE_PROMPTS = [
  'Payment gateway failure at peak hours causing transaction drops',
  'Production database is unreachable and user logins are failing',
  'Unauthorized access attempt detected on the admin panel',
  'CDN and network latency spike affecting global users',
  'Memory leak in microservice causing server to crash overnight',
];

const STEP_TYPE_ICONS = { task: '⚙️', approval: '✅', notification: '🔔' };

export default function AIGenerator() {
  const navigate = useNavigate();
  const [description, setDescription] = useState('');
  const [generating, setGenerating] = useState(false);
  const [creating, setCreating] = useState(false);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    if (!description.trim() || description.trim().length < 10) {
      return toast.error('Please enter a more detailed incident description (min 10 chars)');
    }
    try {
      setGenerating(true);
      setError('');
      setPreview(null);
      const res = await aiAPI.generate(description);
      setPreview(res.data);
      toast.success(`Workflow preview generated${res.data._source === 'gemini' ? ' via Gemini AI' : ' via smart templates'}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleCreate = async () => {
    try {
      setCreating(true);
      const res = await aiAPI.create(description);
      toast.success(`Workflow "${res.data.name}" created with ${res.data.stepCount} steps!`);
      navigate(`/workflows/${res.data.workflowId}/edit`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6 animate-slide-up max-w-4xl">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-xl shadow-glow">
            🤖
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">AI Workflow Generator</h1>
            <p className="text-xs text-slate-500">Powered by Google Gemini AI · Smart template fallback</p>
          </div>
        </div>
        <p className="text-sm text-slate-400">
          Describe your incident scenario in plain English and the AI will design a complete
          workflow with steps, rules, and input schema — ready to execute in seconds.
        </p>
      </div>

      {/* Input */}
      <div className="card space-y-4">
        <label className="label">Describe the Incident Scenario *</label>
        <textarea
          className="input resize-none text-sm"
          rows={4}
          placeholder="e.g. Payment gateway is failing during peak hours causing checkout errors for all users in the US region..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={500}
        />
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-600">{description.length}/500 characters</p>
          <Button
            variant="primary"
            onClick={handleGenerate}
            loading={generating}
            icon={<span>✨</span>}
          >
            {generating ? 'Generating...' : 'Generate Workflow'}
          </Button>
        </div>

        {/* Example prompts */}
        <div>
          <p className="text-xs text-slate-500 mb-2">💡 Try an example:</p>
          <div className="flex flex-wrap gap-2">
            {EXAMPLE_PROMPTS.map((p) => (
              <button
                key={p}
                onClick={() => setDescription(p)}
                className="text-xs px-3 py-1.5 rounded-full bg-surface border border-surface-border text-slate-400 hover:text-white hover:border-slate-500 transition-colors"
              >
                {p.length > 45 ? p.slice(0, 45) + '…' : p}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Error */}
      {error && <AlertBox variant="error" title="Generation Failed">{error}</AlertBox>}

      {/* Preview */}
      {preview && (
        <div className="space-y-4 animate-slide-up">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-white">
              Generated Workflow Preview
              {preview._source === 'gemini' ? (
                <span className="ml-2 badge-purple text-xs">🤖 Gemini AI</span>
              ) : (
                <span className="ml-2 badge-blue text-xs">📋 Smart Template</span>
              )}
            </h2>
            <Button variant="primary" onClick={handleCreate} loading={creating}>
              {creating ? 'Creating...' : '✅ Create This Workflow'}
            </Button>
          </div>

          {/* Workflow info */}
          <div className="card space-y-3">
            <div>
              <p className="label">Workflow Name</p>
              <p className="text-lg font-bold text-white">{preview.name}</p>
            </div>
            {preview.description && (
              <div>
                <p className="label">Description</p>
                <p className="text-sm text-slate-300">{preview.description}</p>
              </div>
            )}
          </div>

          {/* Steps */}
          <div className="card space-y-3">
            <h3 className="text-sm font-semibold text-white">
              Steps <span className="text-slate-500 font-normal">({preview.steps?.length})</span>
            </h3>
            <div className="space-y-2">
              {preview.steps?.map((step, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  {idx < preview.steps.length - 1 && (
                    <div className="absolute mt-7 ml-3 w-0.5 h-6 bg-surface-border" style={{ position: 'relative', left: '14px', top: '12px', zIndex: 0, display: 'none' }} />
                  )}
                  <div className={`w-8 h-8 flex-shrink-0 rounded-full flex items-center justify-center text-sm ${
                    step.stepType === 'task' ? 'bg-blue-900/60 text-blue-300'
                    : step.stepType === 'approval' ? 'bg-amber-900/60 text-amber-300'
                    : 'bg-purple-900/60 text-purple-300'
                  }`}>
                    {STEP_TYPE_ICONS[step.stepType]}
                  </div>
                  <div className="flex-1 bg-surface border border-surface-border rounded-lg px-3 py-2.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-white">
                        {idx + 1}. {step.name}
                      </span>
                      <StepTypeTag type={step.stepType} />
                    </div>
                    {step.metadata?.action && (
                      <p className="text-xs text-slate-500 mt-0.5">{step.metadata.action}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Input schema */}
          {preview.inputSchema && (
            <div className="card">
              <h3 className="text-sm font-semibold text-white mb-3">Input Fields</h3>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(preview.inputSchema).map(([key, rules]) => (
                  <div key={key} className="flex items-center gap-2 text-xs p-2 rounded-lg bg-surface border border-surface-border">
                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${rules.required ? 'bg-red-400' : 'bg-slate-500'}`} />
                    <span className="font-mono text-slate-300">{key}</span>
                    <span className="text-slate-600">({rules.type})</span>
                    {rules.allowed_values && (
                      <span className="text-slate-600 truncate">[{rules.allowed_values.join('/')}]</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
