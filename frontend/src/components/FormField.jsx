import React from 'react';

/**
 * FormField — label + input/select/textarea wrapper with validation message.
 *
 * @param {string} label - field label text
 * @param {boolean} required
 * @param {string} error - validation error message
 * @param {React.ReactNode} children - the actual <input>, <select>, <textarea>
 * @param {string} hint - optional hint text below the field
 * @param {string} className
 */
export function FormField({ label, required = false, error, children, hint, className = '' }) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label className="label">
          {label}
          {required && <span className="text-red-400 ml-1 normal-case font-normal">*</span>}
        </label>
      )}
      {children}
      {error && <p className="text-xs text-red-400">{error}</p>}
      {hint && !error && <p className="text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

/**
 * Toggle — labelled on/off switch.
 *
 * @param {boolean} value
 * @param {function(boolean): void} onChange
 * @param {string} label
 */
export function Toggle({ value, onChange, label }) {
  return (
    <div className="flex items-center gap-3">
      {label && <span className="label mb-0">{label}</span>}
      <button
        type="button"
        role="switch"
        aria-checked={value}
        onClick={() => onChange(!value)}
        className={`relative inline-flex h-6 w-11 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-surface ${
          value ? 'bg-primary-600' : 'bg-slate-700'
        }`}
      >
        <span
          className={`inline-block w-4 h-4 rounded-full bg-white shadow transform transition-transform duration-200 mt-1 ${
            value ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
}
