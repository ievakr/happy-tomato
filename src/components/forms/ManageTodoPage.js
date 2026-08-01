import React, { useState } from 'react';
import { useSavedTodos } from '../../hooks';
import { useTranslation } from '../../i18n/LanguageContext';

export default function ManageTodoPage() {
  const { t } = useTranslation();
  const { savedItems, addItem, removeItem } = useSavedTodos();
  const [draft, setDraft] = useState('');

  function handleAdd(e) {
    e.preventDefault();
    addItem(draft);
    setDraft('');
  }

  return (
    <div className="h-100 overflow-auto">
      <div className="container-md py-4" style={{ maxWidth: '760px' }}>
        <h2 className="mb-3">{t('layout.todoManagement')}</h2>

        <form onSubmit={handleAdd} className="d-flex gap-2 align-items-stretch mb-3">
          <input
            type="text"
            className="form-control"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={t('forms.newTodo')}
            autoComplete="off"
            aria-label={t('forms.newTodo')}
          />
          <button
            type="submit"
            className="btn btn-primary flex-shrink-0 px-3"
            disabled={!draft.trim()}
          >
            {t('common.add')}
          </button>
        </form>

        <ul className="list-group list-group-flush border rounded bg-white">
          {savedItems.length === 0 ? (
            <li className="list-group-item text-muted py-3">{t('forms.noSavedTodos')}</li>
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
                  {t('common.delete')}
                </button>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
