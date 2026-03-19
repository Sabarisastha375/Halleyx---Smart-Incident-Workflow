import React from 'react';

/**
 * Pagination — previous/next controls with page info text.
 *
 * @param {{ total: number, page: number, limit: number, totalPages: number }} pagination
 * @param {function(number): void} onPageChange
 */
export function Pagination({ pagination, onPageChange }) {
  if (!pagination || pagination.totalPages <= 1) return null;

  const { page, limit, total, totalPages } = pagination;
  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  return (
    <div className="flex items-center justify-between px-5 py-4 border-t border-surface-border">
      <p className="text-xs text-slate-500">
        Showing <span className="text-slate-300">{from}–{to}</span> of{' '}
        <span className="text-slate-300">{total}</span>
      </p>
      <div className="flex items-center gap-2">
        {/* Page pills */}
        {Array.from({ length: totalPages }, (_, i) => i + 1)
          .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
          .reduce((acc, p, idx, arr) => {
            if (idx > 0 && p - arr[idx - 1] > 1) acc.push('...');
            acc.push(p);
            return acc;
          }, [])
          .map((item, idx) =>
            item === '...' ? (
              <span key={`e-${idx}`} className="text-xs text-slate-600 px-1">…</span>
            ) : (
              <button
                key={item}
                onClick={() => onPageChange(item)}
                className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${
                  item === page
                    ? 'bg-primary-600 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-surface-hover'
                }`}
              >
                {item}
              </button>
            )
          )}
      </div>
    </div>
  );
}
