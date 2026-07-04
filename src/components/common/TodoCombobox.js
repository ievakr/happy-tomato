import React, { useState, useRef, useEffect, useId } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from '../../i18n/LanguageContext';

/**
 * To-do picker: same look/behavior as plant CustomDropdown (form-select + portaled list).
 */
export default function TodoCombobox({
  value,
  onChange,
  savedItems = [],
  emptyLabel,
}) {
  const { t } = useTranslation();
  const resolvedEmptyLabel = emptyLabel ?? t('common.selectTodo');
  const listboxId = useId();
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const dropdownRef = useRef(null);
  const dropdownListRef = useRef(null);

  const hasValue = Boolean(value?.trim());

  const rowCount =
    (hasValue ? 1 : 0) + (savedItems.length === 0 ? 1 : savedItems.length);

  useEffect(() => {
    function handleClickOutside(event) {
      const isOutsideTrigger = dropdownRef.current && !dropdownRef.current.contains(event.target);
      const isOutsideList = dropdownListRef.current && !dropdownListRef.current.contains(event.target);
      if (isOutsideTrigger && isOutsideList) {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && dropdownListRef.current) {
      dropdownListRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && highlightedIndex >= 0 && dropdownListRef.current) {
      const option = dropdownListRef.current.querySelector(`[role="option"]:nth-child(${highlightedIndex + 1})`);
      option?.scrollIntoView({ block: 'nearest' });
    }
  }, [isOpen, highlightedIndex]);

  useEffect(() => {
    if (isOpen && dropdownRef.current) {
      const rect = dropdownRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const dropdownHeight = Math.min(200, rowCount * 40);

      let top = rect.bottom;
      if (top + dropdownHeight > viewportHeight) {
        top = rect.top - dropdownHeight;
      }

      setDropdownPosition({
        top,
        left: rect.left,
        width: rect.width,
      });
    }
  }, [isOpen, rowCount]);

  const handleSelect = (item) => {
    onChange(item);
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  const handleClear = () => {
    onChange('');
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  const getDisplayText = () => (hasValue ? value.trim() : resolvedEmptyLabel);

  const openDropdown = () => {
    setIsOpen(true);
    setHighlightedIndex(-1);
  };

  const closeDropdown = () => {
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  const handleTriggerKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setIsOpen((prev) => !prev);
      if (!isOpen) setHighlightedIndex(-1);
    } else if (e.key === 'ArrowDown' && !isOpen) {
      e.preventDefault();
      openDropdown();
    } else if (e.key === 'Escape') {
      closeDropdown();
    }
  };

  const activateHighlighted = () => {
    if (highlightedIndex < 0) return;
    if (hasValue && highlightedIndex === 0) {
      handleClear();
      return;
    }
    const itemIndex = hasValue ? highlightedIndex - 1 : highlightedIndex;
    if (savedItems.length === 0) return;
    if (itemIndex >= 0 && itemIndex < savedItems.length) {
      handleSelect(savedItems[itemIndex]);
    }
  };

  const handleListKeyDown = (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      closeDropdown();
      dropdownRef.current?.querySelector('button')?.focus();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((i) => Math.min(i + 1, rowCount - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      activateHighlighted();
    }
  };

  const offset = hasValue ? 1 : 0;

  const dropdownList =
    isOpen &&
    createPortal(
      <ul
        ref={dropdownListRef}
        id={listboxId}
        role="listbox"
        tabIndex={-1}
        className="custom-dropdown__list custom-dropdown__list--overflow list-group"
        onKeyDown={handleListKeyDown}
        style={{
          position: 'fixed',
          top: dropdownPosition.top,
          left: dropdownPosition.left,
          width: Math.max(dropdownPosition.width, 200),
          maxHeight: '200px',
          overflowY: 'auto',
          zIndex: 10000,
        }}
      >
        {hasValue && (
          <li
            role="option"
            aria-selected={false}
            tabIndex={-1}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleClear();
            }}
            className={`list-group-item list-group-item-action text-muted small ${highlightedIndex === 0 ? 'focus' : ''}`}
            style={highlightedIndex === 0 ? { backgroundColor: 'var(--bs-secondary-bg)' } : undefined}
          >
            {t('common.clearTodo')}
          </li>
        )}
        {savedItems.length === 0 ? (
          <li className="list-group-item text-muted small py-2">{t('common.noSavedTodos')}</li>
        ) : (
          savedItems.map((item, index) => {
            const rowIdx = offset + index;
            return (
              <li
                key={item}
                role="option"
                aria-selected={value === item}
                tabIndex={-1}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleSelect(item);
                }}
                className={`list-group-item list-group-item-action ${value === item ? 'active' : ''} ${highlightedIndex === rowIdx ? 'focus' : ''}`}
                style={highlightedIndex === rowIdx ? { backgroundColor: 'var(--bs-secondary-bg)' } : undefined}
              >
                {item}
                {value === item ? ' ✔' : ''}
              </li>
            );
          })
        )}
      </ul>,
      document.body
    );

  return (
    <>
      <div className="custom-dropdown" ref={dropdownRef}>
        <button
          type="button"
          className={`custom-dropdown__title form-select ${!hasValue ? 'text-muted' : ''}`}
          onClick={(e) => {
            e.preventDefault();
            setIsOpen((prev) => !prev);
            if (!isOpen) setHighlightedIndex(-1);
          }}
          onKeyDown={handleTriggerKeyDown}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-controls={isOpen ? listboxId : undefined}
        >
          {getDisplayText()}
        </button>
      </div>
      {dropdownList}
    </>
  );
}
