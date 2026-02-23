import React, { useState, useRef, useEffect } from 'react';
import './TodoCombobox.css';

export default function TodoCombobox({
  value,
  onChange,
  placeholder = "+ Add to-do",
  savedItems = [],
  onManageItems,
  showManageLink = true,
  removeItem,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [showManagePanel, setShowManagePanel] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const containerRef = useRef(null);
  const listRef = useRef(null);

  const displayItems = savedItems;
  const showDropdown = isOpen;

  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    setHighlightIndex(-1);
  }, [value, displayItems]);

  useEffect(() => {
    if (showDropdown && highlightIndex >= 0 && highlightIndex < displayItems.length && listRef.current) {
      const item = listRef.current.children[highlightIndex];
      item?.scrollIntoView({ block: "nearest" });
    }
  }, [highlightIndex, displayItems.length, showDropdown]);

  function handleInputChange(e) {
    onChange(e.target.value);
    setIsOpen(true);
  }

  function handleInputFocus() {
    setIsOpen(true);
  }

  function handleSelect(item) {
    onChange(item);
    setIsOpen(false);
  }

  function handleKeyDown(e) {
    if (!showDropdown) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIndex((i) => (i < displayItems.length - 1 ? i + 1 : i));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIndex((i) => (i > 0 ? i - 1 : -1));
    } else if (e.key === "Enter" && highlightIndex >= 0 && displayItems[highlightIndex]) {
      e.preventDefault();
      handleSelect(displayItems[highlightIndex]);
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  }

  return (
    <div ref={containerRef} className="todo-combobox position-relative">
      <input
        type="text"
        className="todo-combobox__input"
        placeholder={placeholder}
        value={value}
        onChange={handleInputChange}
        onFocus={handleInputFocus}
        onKeyDown={handleKeyDown}
        autoComplete="off"
        aria-autocomplete="list"
      />
      {showDropdown && (
        <div className="todo-combobox__dropdown">
          <ul ref={listRef} style={{ margin: 0, padding: 0, listStyle: "none" }}>
            {displayItems.length > 0 &&
              displayItems.map((item, index) => (
                <li
                  key={`${item}-${index}`}
                  className={`todo-combobox__item ${highlightIndex === index ? "todo-combobox__item--highlighted" : ""}`}
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setHighlightIndex(index)}
                >
                  {item}
                </li>
              ))}
          </ul>
          {showManageLink && (removeItem || onManageItems) && (
            <div className="todo-combobox__footer">
              <button
                type="button"
                className="todo-combobox__manage-link"
                onClick={(e) => {
                  e.preventDefault();
                  setShowManagePanel((p) => !p);
                  setIsOpen(false);
                  if (onManageItems) onManageItems();
                }}
              >
                Manage saved items
              </button>
            </div>
          )}
        </div>
      )}
      {showManagePanel && removeItem && (
        <div className="todo-combobox__manage-panel">
          <div className="todo-combobox__manage-header">
            Saved to-dos
            <button
              type="button"
              className="todo-combobox__manage-link"
              onClick={() => setShowManagePanel(false)}
              style={{ fontSize: "0.8rem" }}
            >
              Close
            </button>
          </div>
          {savedItems.length > 0 ? (
            savedItems.map((item, index) => (
              <div key={`${item}-${index}`} className="todo-combobox__manage-item">
                <span>{item}</span>
                <button
                  type="button"
                  className="todo-combobox__manage-delete"
                  onClick={() => removeItem(item)}
                  aria-label={`Remove ${item}`}
                >
                  Remove
                </button>
              </div>
            ))
          ) : (
            <div className="todo-combobox__manage-empty">
              No saved items yet. Create events with to-dos to add them here.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
