import React from 'react';

/**
 * EmptyState — shown when a list or table has no items.
 *
 * @param {string} title
 * @param {string} description
 * @param {React.ReactNode} action - optional CTA element (e.g. a <Button> or <Link>)
 * @param {string} icon - optional emoji or SVG string
 */
export function EmptyState({ title, description, action, icon = '📭' }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
      <div className="text-5xl mb-4">{icon}</div>
      <h3 className="text-base font-semibold text-white mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-slate-500 max-w-xs mb-5">{description}</p>
      )}
      {action && <div>{action}</div>}
    </div>
  );
}
