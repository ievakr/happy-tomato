import React, { useState, useRef, useEffect } from "react";

/**
 * Single-select dropdown component for when you only need one selection
 */
export default function SingleSelectDropdown({ title, options, selectedValue = "", onSelect }) {
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
            const dropdownHeight = Math.min(200, options.length * 40);
            
            let top = rect.bottom;
            
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

    const handleOptionClick = (option, event) => {
        event.preventDefault();
        event.stopPropagation();
        
        // If clicking on already selected option, deselect it
        if (selectedValue === option) {
            onSelect("");
        } else {
            onSelect(option);
        }
        
        setIsOpen(false); // Close after selection for single-select
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
                    {selectedValue || title}
                </button>
            </div>
            {isOpen && (
                <ul 
                    ref={dropdownListRef}
                    className="custom-dropdown__list custom-dropdown__list--overflow" 
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
                            onClick={(e) => handleOptionClick(option, e)}
                            className={selectedValue === option ? "selected" : ""}
                            title={selectedValue === option ? "Click to deselect" : ""}
                        >
                            {option} {selectedValue === option && "✔"}
                        </li>
                    ))}
                </ul>
            )}
        </>
    );
} 