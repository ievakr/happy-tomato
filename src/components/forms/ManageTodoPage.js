import React, { useState } from 'react';
import { useSavedTodos } from '../../hooks';
import { useTranslation } from '../../i18n/LanguageContext';
import { Icon } from '../common';
import './ManageTodoPage.css';

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
    <div className="todo-page-scroll h-100 overflow-auto">
      <div className="todo-page">
        <form onSubmit={handleAdd} className="todo-add">
          <input
            type="text"
            className="todo-add-input"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={t('forms.newTodo')}
            autoComplete="off"
            aria-label={t('forms.newTodo')}
          />
          <button type="submit" className="todo-add-btn" disabled={!draft.trim()}>
            {t('common.add')}
          </button>
        </form>

        {savedItems.length === 0 ? (
          <p className="todo-empty">{t('forms.noSavedTodos')}</p>
        ) : (
          <ul className="todo-list">
            {savedItems.map((item) => (
              <li key={item} className="todo-card">
                <span className="todo-card-text">{item}</span>
                <button
                  type="button"
                  className="todo-card-delete"
                  onClick={() => removeItem(item)}
                  aria-label={t('common.delete')}
                >
                  <Icon name="delete" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
