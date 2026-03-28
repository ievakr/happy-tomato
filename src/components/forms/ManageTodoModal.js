import React, { useState } from 'react';
import { useEventContext } from '../../context/EventContext';
import { useSavedTodos } from '../../hooks';
import { Modal } from '../common';

export default function ManageTodoModal() {
    const { setShowManageTodoModal } = useEventContext();
    const { savedItems, addItem, removeItem } = useSavedTodos();
    const [draft, setDraft] = useState('');

    function handleAdd(e) {
        e.preventDefault();
        addItem(draft);
        setDraft('');
    }

    return (
        <Modal
            title="Manage to-do"
            icon="edit_note"
            size="sm"
            onClose={() => setShowManageTodoModal(false)}
            footer={
                <button type="button" className="btn btn-danger w-100" onClick={() => setShowManageTodoModal(false)}>
                    Close
                </button>
            }
        >
            <form onSubmit={handleAdd} className="d-flex gap-2 align-items-stretch mb-2">
                <input
                    type="text"
                    className="form-control form-control-sm"
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder="New to-do"
                    autoComplete="off"
                    aria-label="New to-do"
                />
                <button
                    type="submit"
                    className="btn btn-sm btn-primary flex-shrink-0 px-3"
                    disabled={!draft.trim()}
                >
                    Add
                </button>
            </form>
            <ul className="list-group list-group-flush small border rounded">
                {savedItems.length === 0 ? (
                    <li className="list-group-item text-muted py-2">No saved to-dos yet.</li>
                ) : (
                    savedItems.map((item) => (
                        <li
                            key={item}
                            className="list-group-item d-flex justify-content-between align-items-center gap-2 py-2"
                        >
                            <span className="text-break flex-grow-1">{item}</span>
                            <button
                                type="button"
                                className="btn btn-sm btn-outline-danger flex-shrink-0"
                                onClick={() => removeItem(item)}
                            >
                                Delete
                            </button>
                        </li>
                    ))
                )}
            </ul>
        </Modal>
    );
}
