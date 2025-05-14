import React, { useState, useRef, useEffect } from "react";

export default function CustomDropdown({ title, options, selectedOptions = [], onSelect }) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    
    const handleOptionClick = (option) => {
        let newSelection;
        if (selectedOptions.includes(option)) {
            newSelection = selectedOptions.filter(item => item !== option);
        } else {
            newSelection = [...selectedOptions, option];
        }
        onSelect(newSelection);
    };

    return (
        <div className="custom-dropdown" ref={dropdownRef}>
            <div className="custom-dropdown__title" onClick={() => setIsOpen(!isOpen)}>
                {selectedOptions.length ? selectedOptions.join(", ") : title}
                <span className="custom-dropdown__arrow">{isOpen ? "▲" : "▼"}</span>
            </div>
            {isOpen && (
                <ul className="custom-dropdown__list" style={{ maxHeight: "200px", overflowY: "auto" }}>
                    {options.map((option, index) => (
                        <li 
                            key={index} 
                            onClick={() => handleOptionClick(option)}
                            className={selectedOptions.includes(option) ? "selected" : ""}
                        >
                            {option} {selectedOptions.includes(option) && "✔"}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}