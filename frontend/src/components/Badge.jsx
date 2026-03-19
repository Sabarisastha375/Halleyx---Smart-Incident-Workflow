import React from 'react';

/**
 * Badge — coloured pill label.
 *
 * @param {'blue'|'green'|'yellow'|'red'|'gray'|'purple'} variant
 * @param {React.ReactNode} children
 * @param {string} className
 */
export function Badge({ variant = 'gray', children, className = '' }) {
  const variants = {
    blue:   'badge-blue',
    green:  'badge-green',
    yellow: 'badge-yellow',
    red:    'badge-red',
    gray:   'badge-gray',
    purple: 'badge-purple',
  };
  return (
    <span className={`${variants[variant] || 'badge-gray'} ${className}`}>
      {children}
    </span>
  );
}

/**
 * StatusBadge — maps execution status → coloured badge automatically.
 * @param {string} status - pending | in_progress | completed | failed | canceled
 */
export function StatusBadge({ status }) {
  const map = {
    pending:     { variant: 'gray',   label: 'Pending' },
    in_progress: { variant: 'blue',   label: 'In Progress' },
    completed:   { variant: 'green',  label: 'Completed' },
    failed:      { variant: 'red',    label: 'Failed' },
    canceled:    { variant: 'yellow', label: 'Canceled' },
    started:     { variant: 'blue',   label: 'Started' },
    skipped:     { variant: 'gray',   label: 'Skipped' },
  };
  const { variant, label } = map[status] || { variant: 'gray', label: status };

  const dots = {
    green:  'bg-emerald-400',
    blue:   'bg-blue-400',
    red:    'bg-red-400',
    yellow: 'bg-amber-400',
    gray:   'bg-slate-400',
    purple: 'bg-purple-400',
  };

  return (
    <Badge variant={variant}>
      <span className={`w-1.5 h-1.5 rounded-full inline-block ${dots[variant]}`} />
      {label}
    </Badge>
  );
}

/**
 * StepTypeTag — colour-coded chip for step type (task / approval / notification).
 * @param {'task'|'approval'|'notification'} type
 */
export function StepTypeTag({ type }) {
  const icons = { task: '⚙️', approval: '✅', notification: '🔔' };
  const variants = { task: 'blue', approval: 'yellow', notification: 'purple' };
  return (
    <Badge variant={variants[type] || 'gray'}>
      {icons[type]} {type}
    </Badge>
  );
}

/**
 * VersionBadge — displays "vN" in a blue chip.
 * @param {number} version
 */
export function VersionBadge({ version }) {
  return <Badge variant="blue">v{version}</Badge>;
}

/**
 * ActiveBadge — green Active / gray Inactive.
 * @param {boolean} isActive
 */
export function ActiveBadge({ isActive }) {
  return isActive ? (
    <Badge variant="green">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
      Active
    </Badge>
  ) : (
    <Badge variant="gray">
      <span className="w-1.5 h-1.5 rounded-full bg-slate-400 inline-block" />
      Inactive
    </Badge>
  );
}
