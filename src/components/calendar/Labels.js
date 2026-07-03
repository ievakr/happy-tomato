import React, { useMemo } from "react";
import { useEventContext } from "../../context/EventContext";
import { EventListSkeleton, CustomDropdown } from "../common";

export default function Labels({ headerClassName = 'mt-4 mb-2', contentClassName = 'mb-3' }) {
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

    /** Check every category filter option. */
    const handleSelectAllFilters = () => {
        setLabels((prev) => prev.map((lbl) => ({ ...lbl, checked: true })));
    };

    const noCategoriesSelected = selectedLabels.length === 0;
    const allCategoriesSelected =
        labelOptions.length > 0 && selectedLabels.length === labelOptions.length;
    
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

    const bulkBtnClass =
        'btn btn-sm border-0 bg-transparent px-0 py-0 fw-normal text-decoration-none shadow-none labels-filter-category-bulk-btn';

    return (
        <React.Fragment>
            <div className={headerClassName}>
                <div className="d-flex align-items-center min-w-0 text-secondary fw-bold">
                    <span className="material-icons-outlined me-2 flex-shrink-0" style={{ fontSize: '1.25rem' }}>
                        filter_list
                    </span>
                    <span className="text-truncate">Filter by Category</span>
                </div>
                {labelOptions.length > 0 && (
                    <div className="d-flex align-items-center gap-2 mt-2">
                        <button
                            type="button"
                            className={bulkBtnClass}
                            onClick={handleSelectAllFilters}
                            disabled={allCategoriesSelected}
                            title="Check all categories"
                            aria-label="Select all filter categories"
                        >
                            Select all
                        </button>
                        <span className="fw-normal" style={{ color: '#495057' }} aria-hidden>
                            ·
                        </span>
                        <button
                            type="button"
                            className={bulkBtnClass}
                            onClick={handleClearAllFilters}
                            disabled={noCategoriesSelected}
                            title="Uncheck all categories"
                            aria-label="Uncheck all filter categories"
                        >
                            Clear all
                        </button>
                    </div>
                )}
            </div>
            {isInitialLoading ? (
                <EventListSkeleton count={1} />
            ) : (
                <div className={contentClassName || undefined}>
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
