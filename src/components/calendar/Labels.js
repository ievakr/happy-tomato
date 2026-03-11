import React, { useMemo } from "react";
import { useEventContext } from "../../context/EventContext";
import { EventListSkeleton, CustomDropdown } from "../common";

export default function Labels() {
    const { labels, setLabels, isInitialLoading } = useEventContext();
    
    // Get display names for dropdown options
    const labelOptions = useMemo(() => {
        return labels.map(lbl => lbl.displayName || lbl.label);
    }, [labels]);
    
    // Get currently selected (checked) display names
    const selectedLabels = useMemo(() => {
        return labels.filter(lbl => lbl.checked).map(lbl => lbl.displayName || lbl.label);
    }, [labels]);
    
    // Handle label selection from dropdown (selectedDisplayNames)
    const handleLabelSelect = (selectedDisplayNames) => {
        const updatedLabels = labels.map(lbl => ({
            ...lbl,
            checked: selectedDisplayNames.includes(lbl.displayName || lbl.label)
        }));
        setLabels(updatedLabels);
    };
    
    // Create a custom title that doesn't show all selected items
    const dropdownTitle = useMemo(() => {
        if (selectedLabels.length === 0) {
            return "Select categories to filter";
        } else if (selectedLabels.length === labelOptions.length) {
            return "All categories selected";
        } else {
            return `${selectedLabels.length} categor${selectedLabels.length > 1 ? 'ies' : 'y'} selected`;
        }
    }, [selectedLabels.length, labelOptions.length]);
    
    return (
        <React.Fragment>
            <div className="d-flex align-items-center text-secondary fw-bold mt-4 mb-2">
                <span className="material-icons-outlined me-2" style={{ fontSize: '1.25rem' }}>filter_list</span>
                Filter by Category
            </div>
            {isInitialLoading ? (
                <EventListSkeleton count={1} />
            ) : (
                <div className="mb-3">
                    <CustomDropdown
                        title="Select categories to filter"
                        options={labelOptions}
                        selectedOptions={selectedLabels}
                        onSelect={handleLabelSelect}
                        displayTitle={dropdownTitle}
                    />
                </div>
            )}
        </React.Fragment>
    );
}
