import React from 'react';
import { Modal } from './Modal';
import { Button } from './Button';

/**
 * ConfirmDialog — modal confirmation prompt before destructive actions.
 *
 * @param {boolean} isOpen
 * @param {function} onClose - called when dismissed
 * @param {function} onConfirm - called when user clicks confirm
 * @param {string} title
 * @param {string} description
 * @param {string} confirmLabel - button label (default: 'Confirm')
 * @param {'danger'|'primary'} confirmVariant
 * @param {boolean} loading
 */
export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  description = 'This action cannot be undone.',
  confirmLabel = 'Confirm',
  confirmVariant = 'danger',
  loading = false,
}) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant={confirmVariant} onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p className="text-sm text-slate-400">{description}</p>
    </Modal>
  );
}
