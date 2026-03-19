import React from 'react';

/**
 * PageHeader — consistent page title + subtitle + optional action slot.
 *
 * @param {string} title
 * @param {string} subtitle
 * @param {React.ReactNode} action - right-side CTA slot
 */
export function PageHeader({ title, subtitle, action }) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold text-white">{title}</h1>
        {subtitle && <p className="text-sm text-slate-400 mt-1">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

/**
 * SectionHeader — smaller section title inside a card.
 *
 * @param {string} title
 * @param {string} description
 * @param {React.ReactNode} action
 */
export function SectionHeader({ title, description, action }) {
  return (
    <div className="flex items-start justify-between mb-4">
      <div>
        <h2 className="text-base font-semibold text-white">{title}</h2>
        {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

/**
 * InfoRow — key-value pair display used inside summary cards.
 *
 * @param {string} label
 * @param {React.ReactNode} value
 */
export function InfoRow({ label, value }) {
  return (
    <div>
      <p className="label">{label}</p>
      <div className="text-sm text-slate-300">{value ?? '—'}</div>
    </div>
  );
}

/**
 * AlertBox — in-page alert for errors, warnings, and info.
 *
 * @param {'error'|'warning'|'info'|'success'} variant
 * @param {string} title
 * @param {React.ReactNode} children
 */
export function AlertBox({ variant = 'error', title, children }) {
  const styles = {
    error:   'bg-red-900/20 border-red-700/50 text-red-300',
    warning: 'bg-amber-900/20 border-amber-700/50 text-amber-300',
    info:    'bg-blue-900/20 border-blue-700/50 text-blue-300',
    success: 'bg-emerald-900/20 border-emerald-700/50 text-emerald-300',
  };
  const icons = {
    error: '✕',
    warning: '⚠',
    info: 'ℹ',
    success: '✓',
  };
  return (
    <div className={`rounded-lg border p-3 text-sm ${styles[variant]}`}>
      {title && <strong>{icons[variant]} {title}: </strong>}
      {children}
    </div>
  );
}
