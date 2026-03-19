import React from 'react';
import { Spinner } from './Spinner';

/**
 * Button — versatile action button.
 *
 * @param {'primary'|'secondary'|'danger'|'success'|'ghost'} variant
 * @param {'sm'|'md'|'lg'} size
 * @param {boolean} loading - shows spinner and disables button
 * @param {React.ReactNode} icon - optional leading icon element
 * @param {React.ReactNode} children
 * @param {string} className
 * @param {object} props - all other button props (onClick, type, disabled, …)
 */
export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  children,
  className = '',
  ...props
}) {
  const variants = {
    primary:   'btn-primary',
    secondary: 'btn-secondary',
    danger:    'btn-danger',
    success:   'btn-success',
    ghost:     'btn text-slate-400 hover:text-white hover:bg-surface-hover',
  };

  const sizes = {
    sm: 'text-xs py-1.5 px-3',
    md: 'text-sm py-2 px-4',
    lg: 'text-base py-3 px-6',
  };

  return (
    <button
      className={`${variants[variant]} ${sizes[size]} ${className}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? (
        <Spinner size="sm" />
      ) : (
        icon && <span className="w-4 h-4 flex-shrink-0">{icon}</span>
      )}
      {children}
    </button>
  );
}

/**
 * IconButton — square icon-only button.
 */
export function IconButton({ icon, variant = 'ghost', size = 'sm', title, ...props }) {
  return (
    <Button variant={variant} size={size} title={title} {...props}>
      {icon}
    </Button>
  );
}
