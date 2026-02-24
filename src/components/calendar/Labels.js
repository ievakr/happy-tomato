import React, { useContext, useMemo } from "react";
import EventContext from "../../context/EventContext";
import { EventListSkeleton, CustomDropdown } from "../common";

export default function Labels() {
    const { labels, setLabels, isInitialLoading } = useContext(EventContext);
    
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
            return "Select labels to filter";
        } else if (selectedLabels.length === labelOptions.length) {
            return "All plants selected";
        } else {
            return `${selectedLabels.length} label${selectedLabels.length > 1 ? 's' : ''} selected`;
        }
    }, [selectedLabels.length, labelOptions.length]);
    
    return (
        <React.Fragment>
            <p className="text-secondary fw-bold mt-4">Filter by Plants</p>
            {isInitialLoading ? (
                <EventListSkeleton count={1} />
            ) : (
                <div className="mb-3">
                    <CustomDropdown
                        title="Select labels to filter"
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
