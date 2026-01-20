import React, { useState, useRef, useEffect } from "react";

export default function CustomDropdown({ title, options, selectedOptions = [], onSelect, displayTitle }) {
    const [isOpen, setIsOpen] = useState(false);
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
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

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
        if (selectedOptions.includes(option)) {
            newSelection = selectedOptions.filter(item => item !== option);
        } else {
            newSelection = [...selectedOptions, option];
        }
        onSelect(newSelection);
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

    return (
        <>
            <div className="custom-dropdown" ref={dropdownRef}>
                <button
                    type="button"
                    className="custom-dropdown__title form-select"
                    onClick={() => setIsOpen(!isOpen)}
                    aria-expanded={isOpen}
                >
                    {getDisplayText()}
                </button>
            </div>
            {isOpen && (
                <ul 
                    ref={dropdownListRef}
                    className="custom-dropdown__list custom-dropdown__list--overflow list-group" 
                    style={{ 
                        position: 'fixed',
                        top: dropdownPosition.top,
                        left: dropdownPosition.left,
                        width: dropdownPosition.width,
                        maxHeight: "200px", 
                        overflowY: "auto",
                        zIndex: 9999
                    }}
                >
                    {options.map((option, index) => (
                        <li 
                            key={index} 
                            onClick={() => handleOptionClick(option)}
                            className={`list-group-item list-group-item-action ${selectedOptions.includes(option) ? "active" : ""}`}
                        >
                            {option} {selectedOptions.includes(option) && "✔"}
                        </li>
                    ))}
                </ul>
            )}
        </>
    );
}