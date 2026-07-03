import React from 'react';
import { ConfirmModal } from '../common';
import { eventTodoOrTitleText } from './EventItem';

export default function EventDeleteConfirmModal({
  show,
  event,
  onConfirm,
  onCancel,
  isLoading,
}) {
  if (!show || !event) return null;

  return (
    <ConfirmModal
      title="Delete Event"
      message={
        <>
          <p className="mb-2">Delete "{eventTodoOrTitleText(event)}"?</p>
          <p className="mb-0 small">This action can't be undone.</p>
        </>
      }
      confirmLabel="Delete"
      variant="danger"
      onConfirm={onConfirm}
      onCancel={onCancel}
      isLoading={isLoading}
    />
  );
}
