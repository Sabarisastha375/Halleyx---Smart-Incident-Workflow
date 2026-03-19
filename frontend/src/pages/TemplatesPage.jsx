import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { aiAPI } from '../services/api';
import { FullPageSpinner, Button } from '../components';

const TEMPLATE_META = {
  payment:  { icon: '💳', color: 'border-emerald-700/40 hover:border-emerald-500/60', accentBg: 'bg-emerald-900/20', accentText: 'text-emerald-300' },
  server:   { icon: '🖥️', color: 'border-blue-700/40 hover:border-blue-500/60',    accentBg: 'bg-blue-900/20',    accentText: 'text-blue-300' },
  security: { icon: '🔐', color: 'border-red-700/40 hover:border-red-500/60',      accentBg: 'bg-red-900/20',     accentText: 'text-red-300' },
  network:  { icon: '🌐', color: 'border-amber-700/40 hover:border-amber-500/60',  accentBg: 'bg-amber-900/20',   accentText: 'text-amber-300' },
  database: { icon: '🗄️', color: 'border-purple-700/40 hover:border-purple-500/60', accentBg: 'bg-purple-900/20', accentText: 'text-purple-300' },
};

const TYPE_COLORS = { task: 'bg-blue-900/60 text-blue-300', approval: 'bg-amber-900/60 text-amber-300', notification: 'bg-purple-900/60 text-purple-300' };

export default function TemplatesPage() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await aiAPI.getTemplates();
        setTemplates(res.data);
      } catch (err) {
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleCreate = async (key) => {
    try {
      setCreating(key);
      const res = await aiAPI.createFromTemplate(key);
      toast.success(`"${res.data.name}" created with ${res.data.stepCount} steps!`);
      navigate(`/workflows/${res.data.workflowId}/edit`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setCreating(null);
    }
  };

  if (loading) return <FullPageSpinner message="Loading templates..." />;

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Workflow Templates</h1>
        <p className="text-sm text-slate-400 mt-1">
          Pre-built incident response workflows — click <strong className="text-white">Use Template</strong> to
          instantly scaffold a full workflow with steps and rules.
        </p>
      </div>

      {/* AI Banner */}
      <div className="rounded-xl bg-gradient-to-r from-purple-900/40 to-blue-900/40 border border-purple-700/40 p-5 flex items-center gap-4">
        <div className="text-4xl">🤖</div>
        <div className="flex-1">
          <h2 className="text-sm font-semibold text-white">Need a custom workflow?</h2>
          <p className="text-xs text-slate-400 mt-0.5">Use the AI Generator to describe your incident in plain English and get a tailored workflow.</p>
        </div>
        <Button variant="primary" onClick={() => navigate('/ai-generator')}>
          Open AI Generator →
        </Button>
      </div>

      {/* Template Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {templates.map((tpl) => {
          const meta = TEMPLATE_META[tpl.key] || TEMPLATE_META.server;
          return (
            <div
              key={tpl.key}
              className={`card border transition-all duration-200 flex flex-col ${meta.color}`}
            >
              {/* Card header */}
              <div className="flex items-start gap-3 mb-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${meta.accentBg} border border-current border-opacity-20`}>
                  {meta.icon}
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-white leading-tight">{tpl.name}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{tpl.description}</p>
                </div>
              </div>

              {/* Meta */}
              <div className="flex items-center gap-3 mb-4">
                <span className="text-xs text-slate-500">
                  📋 <span className="text-slate-300 font-medium">{tpl.stepCount}</span> steps
                </span>
                <div className="flex gap-1.5">
                  {tpl.stepTypes.map((t) => (
                    <span key={t} className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_COLORS[t]}`}>
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-auto">
                <Button
                  variant="secondary"
                  className="w-full justify-center"
                  loading={creating === tpl.key}
                  onClick={() => handleCreate(tpl.key)}
                >
                  {creating === tpl.key ? 'Creating…' : '⚡ Use Template'}
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
