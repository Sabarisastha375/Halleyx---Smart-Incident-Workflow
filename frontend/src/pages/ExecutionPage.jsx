import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { workflowApi } from '../services/api';
import SimulationResult from '../components/SimulationResult';
import { Beaker, ShieldAlert, Loader } from 'lucide-react';

const STATUS_COLORS = {
  pending: 'badge-gray',
  in_progress: 'badge-blue',
  completed: 'badge-green',
  failed: 'badge-red',
  canceled: 'badge-yellow',
};

export default function ExecutionPage() {
  const { id: workflowId } = useParams();
  const navigate = useNavigate();

  const [workflow, setWorkflow] = useState(null);
  const [inputData, setInputData] = useState({});
  const [formFields, setFormFields] = useState([]);
  const [executing, setExecuting] = useState(false);
  const [result, setResult] = useState(null);
  const [triggeredBy, setTriggeredBy] = useState('api-user');
  const [simulation, setSimulation] = useState(null);
  const [simulating, setSimulating] = useState(false);
  const [prediction, setPrediction] = useState(null);
  const [predicting, setPredicting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await workflowApi.getById(workflowId);
        const wf = res.data;
        setWorkflow(wf);

        // Build form fields from inputSchema
        const schema = wf.inputSchema || {};
        const fields = Object.entries(schema).map(([key, rules]) => ({
          key,
          ...rules,
        }));
        setFormFields(fields);

        // Pre-fill defaults
        const defaults = {};
        fields.forEach((f) => { defaults[f.key] = ''; });
        setInputData(defaults);
      } catch (err) {
        toast.error(err.message);
      }
    })();
  }, [workflowId]);

  const handleExecute = async () => {
    // Basic client-side required check
    for (const field of formFields) {
      if (field.required && !inputData[field.key]) {
        toast.error(`Field "${field.key}" is required`);
        return;
      }
    }

    try {
      setExecuting(true);
      setResult(null);
      const res = await workflowApi.execute(workflowId, {
        data: inputData,
        triggeredBy,
      });
      setResult(res.data);
      toast.success('Workflow executed successfully!');
    } catch (err) {
      toast.error(err.message);
      setResult({ status: 'failed', errorMessage: err.message });
    } finally {
      setExecuting(false);
    }
  };

  const handleSimulate = async () => {
    setSimulating(true);
    try {
      const res = await workflowApi.simulate(workflowId, { data: inputData });
      setSimulation(res.simulation);
      toast.success('Simulation generated');
    } catch (err) {
      toast.error('Simulation failed');
    } finally {
      setSimulating(false);
    }
  };

  const handlePredict = async () => {
    setPredicting(true);
    try {
      const res = await workflowApi.predict(workflowId, { data: inputData });
      setPrediction(res);
    } catch (err) {
      toast.error('Prediction failed');
    } finally {
      setPredicting(false);
    }
  };

  useEffect(() => {
    if (workflow && Object.keys(inputData).length > 0) {
      const timer = setTimeout(handlePredict, 1000);
      return () => clearTimeout(timer);
    }
  }, [inputData, workflow]);

  const handleInputChange = (key, val) => {
    setInputData(d => ({ ...d, [key]: val }));
  };

  if (!workflow) {
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
    <div className="space-y-6 animate-slide-up max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Execute Workflow</h1>
          <p className="text-sm text-slate-400 mt-1">
            {workflow.name} — v{workflow.version}
          </p>
        </div>
        <button onClick={() => navigate('/workflows')} className="btn-secondary">← Back</button>
      </div>

      {/* Input Form Card */}
      <div className="card space-y-4">
        <h2 className="text-base font-semibold text-white">Incident Data</h2>
        <p className="text-xs text-slate-500">
          Fill in the incident details. These values will be used to evaluate workflow rules.
        </p>

        <div className="grid grid-cols-2 gap-4">
          {formFields.map((field) => (
            <div key={field.key}>
              <label className="label">
                {field.key.replace(/_/g, ' ')}
                {field.required && <span className="text-red-400 ml-1">*</span>}
              </label>
              {field.allowed_values ? (
                <select
                  className="select"
                  value={inputData[field.key] || ''}
                  onChange={(e) => handleInputChange(field.key, e.target.value)}
                >
                  <option value="">Select...</option>
                  {field.allowed_values.map((v) => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              ) : (
                <input
                  className="input"
                  type={field.type === 'number' ? 'number' : 'text'}
                  placeholder={`Enter ${field.key.replace(/_/g, ' ')}...`}
                  value={inputData[field.key] || ''}
                  onChange={(e) => handleInputChange(field.key, e.target.value)}
                />
              )}
            </div>
          ))}

          <div>
            <label className="label">Triggered By</label>
            <input
              className="input"
              placeholder="e.g. john.doe"
              value={triggeredBy}
              onChange={(e) => setTriggeredBy(e.target.value)}
            />
          </div>
        </div>

        {/* Risk Prediction Display */}
        {prediction && (
          <div className={`mt-4 p-4 rounded-lg border-l-4 animate-slide-up ${
            prediction.risk.includes('High') ? 'border-l-red-500 bg-red-500/5' : 'border-l-emerald-500 bg-emerald-500/5'
          }`}>
            <div className="flex items-start gap-3">
              <ShieldAlert className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                prediction.risk.includes('High') ? 'text-red-500' : 'text-emerald-500'
              }`} />
              <div>
                <h3 className={`text-sm font-bold ${
                  prediction.risk.includes('High') ? 'text-red-400' : 'text-emerald-400'
                }`}>
                  {prediction.risk}
                </h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  {prediction.reason}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={handleSimulate}
            disabled={simulating || executing}
            className="btn-secondary flex-1 justify-center py-3"
          >
            {simulating ? (
              <><Loader className="animate-spin w-4 h-4 mr-2" /> Simulating...</>
            ) : (
              <><Beaker className="w-4 h-4 mr-2" /> Simulate Path</>
            )}
          </button>
          
          <button
            onClick={handleExecute}
            disabled={executing || simulating}
            className="btn-primary flex-1 justify-center py-3"
          >
            {executing ? (
              <>
                <svg className="animate-spin w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Executing...
              </>
            ) : (
              <>
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                </svg>
                Start Execution
              </>
            )}
          </button>
        </div>
      </div>

      <SimulationResult simulation={simulation} loading={simulating} />

      {/* Execution Result */}
      {result && (
        <div className={`card space-y-4 border ${
          result.status === 'completed'
            ? 'border-emerald-700/50'
            : result.status === 'failed'
            ? 'border-red-700/50'
            : 'border-surface-border'
        }`}>
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-white">Execution Result</h2>
            <span className={STATUS_COLORS[result.status] || 'badge-gray'}>
              {result.status}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="label">Execution ID</p>
              <p className="font-mono text-xs text-slate-300 break-all">{result._id}</p>
            </div>
            <div>
              <p className="label">Triggered By</p>
              <p className="text-slate-300">{result.triggeredBy}</p>
            </div>
            <div>
              <p className="label">Started</p>
              <p className="text-slate-300">
                {result.startedAt ? new Date(result.startedAt).toLocaleString() : '—'}
              </p>
            </div>
            <div>
              <p className="label">Ended</p>
              <p className="text-slate-300">
                {result.endedAt ? new Date(result.endedAt).toLocaleString() : '—'}
              </p>
            </div>
          </div>

          {result.aiSuggestion && (
            <div className="rounded-lg bg-indigo-900/20 border border-indigo-700/50 p-3 text-sm text-indigo-300">
              <strong>AI Suggestion:</strong> {result.aiSuggestion}
            </div>
          )}

          {result.errorMessage && (
            <div className="rounded-lg bg-red-900/20 border border-red-700/50 p-3 text-sm text-red-300">
              <strong>Error:</strong> {result.errorMessage}
            </div>
          )}

          {result._id && result.status !== 'failed' && (
            <Link to={`/executions/${result._id}`} className="btn-secondary w-fit">
              View Execution Logs →
            </Link>
          )}
        </div>
      )}

      {/* Steps preview */}
      {workflow.steps?.length > 0 && (
        <div className="card space-y-3">
          <h2 className="text-sm font-semibold text-white">Workflow Steps</h2>
          <div className="relative">
            {workflow.steps.map((step, idx) => (
              <div key={step._id} className="flex items-start gap-3 pb-4 relative">
                {idx < workflow.steps.length - 1 && (
                  <div className="absolute left-3.5 top-7 w-0.5 h-full bg-surface-border"></div>
                )}
                <div className={`z-10 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                  step.stepType === 'task' ? 'bg-blue-900/60 text-blue-300'
                  : step.stepType === 'approval' ? 'bg-amber-900/60 text-amber-300'
                  : 'bg-purple-900/60 text-purple-300'
                }`}>
                  {idx + 1}
                </div>
                <div className="pt-0.5">
                  <p className="text-sm font-medium text-white">{step.name}</p>
                  <p className="text-xs capitalize text-slate-500">{step.stepType}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
