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

    /** Uncheck every category (only events with no plant labels stay visible — see useEventFiltering). */
    const handleClearAllFilters = () => {
        setLabels((prev) => prev.map((lbl) => ({ ...lbl, checked: false })));
    };

    const noCategoriesSelected = selectedLabels.length === 0;
    
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
            <div className="d-flex align-items-center justify-content-between gap-2 text-secondary fw-bold mt-4 mb-2">
                <div className="d-flex align-items-center min-w-0">
                    <span className="material-icons-outlined me-2 flex-shrink-0" style={{ fontSize: '1.25rem' }}>
                        filter_list
                    </span>
                    <span className="text-truncate">Filter by Category</span>
                </div>
                {labelOptions.length > 0 && (
                    <button
                        type="button"
                        className="btn btn-link btn-sm text-secondary text-decoration-none flex-shrink-0 p-0"
                        onClick={handleClearAllFilters}
                        disabled={noCategoriesSelected}
                        title="Uncheck all categories"
                        aria-label="Uncheck all filter categories"
                    >
                        Clear all
                    </button>
                )}
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
