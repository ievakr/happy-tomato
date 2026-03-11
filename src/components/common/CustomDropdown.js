import React, { useState, useRef, useEffect, useId } from "react";
import { createPortal } from "react-dom";

export default function CustomDropdown({ title, options, selectedOptions = [], onSelect, displayTitle, singleSelect = false }) {
    const listboxId = useId();
    const [isOpen, setIsOpen] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
    const dropdownRef = useRef(null);
    const dropdownListRef = useRef(null);

    useEffect(() => {
        function handleClickOutside(event) {
            // Check if click is outside both the trigger and the dropdown list
            const isOutsideTrigger = dropdownRef.current && !dropdownRef.current.contains(event.target);
            const isOutsideList = dropdownListRef.current && !dropdownListRef.current.contains(event.target);
            
            if (isOutsideTrigger && isOutsideList) {
                setIsOpen(false);
                setHighlightedIndex(-1);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
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
            const dropdownHeight = Math.min(200, options.length * 40); // Approximate height
            
            let top = rect.bottom;
            
            // If dropdown would go below viewport, position it above the trigger
            if (top + dropdownHeight > viewportHeight) {
                top = rect.top - dropdownHeight;
            }
            
            setDropdownPosition({
                top: top,
                left: rect.left,
                width: rect.width
            });
        }
    }, [isOpen, options.length]);

    const handleOptionClick = (option) => {
        let newSelection;
        if (singleSelect) {
            newSelection = selectedOptions.includes(option) ? [] : [option];
        } else if (selectedOptions.includes(option)) {
            newSelection = selectedOptions.filter(item => item !== option);
        } else {
            newSelection = [...selectedOptions, option];
        }
        onSelect(newSelection);
        if (singleSelect) {
            setIsOpen(false);
            setHighlightedIndex(-1);
        }
    };

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
            setIsOpen(prev => !prev);
            if (!isOpen) setHighlightedIndex(-1);
        } else if (e.key === 'ArrowDown' && !isOpen) {
            e.preventDefault();
            openDropdown();
        } else if (e.key === 'Escape') {
            closeDropdown();
        }
    };

    const handleListKeyDown = (e) => {
        if (e.key === 'Escape') {
            e.preventDefault();
            closeDropdown();
            dropdownRef.current?.focus();
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            setHighlightedIndex(i => Math.min(i + 1, options.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setHighlightedIndex(i => Math.max(i - 1, 0));
        } else if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            if (highlightedIndex >= 0 && highlightedIndex < options.length) {
                handleOptionClick(options[highlightedIndex]);
            }
        }
    };

    // Determine what to display in the dropdown title
    const getDisplayText = () => {
        // If displayTitle is provided, use it (allows custom formatting)
        if (displayTitle !== undefined) {
            return displayTitle;
        }
        // Otherwise, use default behavior (show selected items or placeholder)
        return selectedOptions.length ? selectedOptions.join(", ") : title;
    };

    const dropdownList = isOpen && (
        <ul
            ref={dropdownListRef}
            id={listboxId}
            role="listbox"
            tabIndex={-1}
            aria-multiselectable={!singleSelect}
            className="custom-dropdown__list custom-dropdown__list--overflow list-group"
            onKeyDown={handleListKeyDown}
            style={{
                position: 'fixed',
                top: dropdownPosition.top,
                left: dropdownPosition.left,
                width: Math.max(dropdownPosition.width, 200),
                maxHeight: "200px",
                overflowY: "auto",
                zIndex: 10000
            }}
        >
            {options.map((option, index) => (
                <li
                    key={typeof option === 'object' && option?.id != null ? option.id : (option ?? index)}
                    role="option"
                    aria-selected={selectedOptions.includes(option)}
                    tabIndex={-1}
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleOptionClick(option);
                    }}
                    className={`list-group-item list-group-item-action ${selectedOptions.includes(option) ? "active" : ""} ${highlightedIndex === index ? "focus" : ""}`}
                    style={highlightedIndex === index ? { backgroundColor: 'var(--bs-secondary-bg)' } : undefined}
                >
                    {option} {selectedOptions.includes(option) && "✔"}
                </li>
            ))}
        </ul>
    );

    return (
        <>
            <div className="custom-dropdown" ref={dropdownRef}>
                <button
                    type="button"
                    className="custom-dropdown__title form-select"
                    onClick={(e) => {
                        e.preventDefault();
                        setIsOpen(prev => !prev);
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
            {dropdownList && createPortal(dropdownList, document.body)}
        </>
    );
}