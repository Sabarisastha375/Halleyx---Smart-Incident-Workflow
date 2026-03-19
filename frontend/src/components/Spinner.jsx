import React from 'react';

/**
 * Spinner — animated loading indicator.
 * @param {string} size - 'sm' | 'md' | 'lg'
 * @param {string} className - extra classes
 */
export function Spinner({ size = 'md', className = '' }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-8 h-8' };
  return (
    <svg
      className={`animate-spin text-primary-400 ${sizes[size]} ${className}`}
      fill="none"
      viewBox="0 0 24 24"
      aria-label="Loading"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  );
}

/**
 * FullPageSpinner — centred spinner for page loading states.
 */
export function FullPageSpinner({ message = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-32 gap-3 text-slate-500">
      <Spinner size="lg" />
      <p className="text-sm">{message}</p>
    </div>
  );
}
