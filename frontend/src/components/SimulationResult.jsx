import React from 'react';
import { CheckCircle2, AlertCircle, PlayCircle, Info } from 'lucide-react';

export default function SimulationResult({ simulation, loading }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8 text-slate-500 animate-pulse">
        <Info className="w-5 h-5 mr-2" />
        Simulating execution path...
      </div>
    );
  }

  if (!simulation || simulation.length === 0) return null;

  return (
    <div className="card bg-slate-900/50 border-slate-700 mt-4 animate-slide-up">
      <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
        <PlayCircle className="w-4 h-4 text-primary-400" />
        Simulated Execution Path
      </h3>
      <div className="relative">
        <div className="absolute left-[15px] top-2 bottom-2 w-0.5 bg-slate-700" />
        <div className="space-y-4 relative">
          {simulation.map((step, idx) => (
            <div key={idx} className="flex items-start gap-4">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 z-10 ${
                step.message ? 'bg-slate-800' : 'bg-primary-600/20'
              }`}>
                {step.message ? (
                  <Info className="w-4 h-4 text-slate-400" />
                ) : (
                  <span className="text-xs font-bold text-primary-400">{idx + 1}</span>
                )}
              </div>
              <div className="flex-1 pt-1 text-sm">
                {step.step_name ? (
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-slate-200">{step.step_name}</span>
                    <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                      step.step_type === 'approval' ? 'bg-yellow-500/10 text-yellow-500' :
                      step.step_type === 'notification' ? 'bg-purple-500/10 text-purple-500' :
                      'bg-blue-500/10 text-blue-500'
                    }`}>
                      {step.step_type}
                    </span>
                  </div>
                ) : (
                  <span className={`italic ${step.message.includes('Error') ? 'text-red-400' : 'text-slate-400'}`}>
                    {step.message}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
