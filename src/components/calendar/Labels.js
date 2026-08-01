import React, { useMemo } from "react";
import { useEventContext } from "../../context/EventContext";
import { EventListSkeleton, CustomDropdown } from "../common";
import { useTranslation } from "../../i18n/LanguageContext";

export default function Labels({
    headerClassName = 'mt-4 mb-2',
    contentClassName = 'mb-3',
    sepClassName = '',
}) {
    const { t } = useTranslation();
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
            return t('calendar.selectCategoriesToFilter');
        } else if (selectedLabels.length === labelOptions.length) {
            return t('calendar.allCategoriesSelected');
        } else {
            return t(
                selectedLabels.length > 1
                    ? 'calendar.categoriesSelectedPlural'
                    : 'calendar.categoriesSelectedSingular',
                { count: selectedLabels.length },
            );
        }
    }, [selectedLabels.length, labelOptions.length, t]);

    const bulkBtnClass =
        'btn btn-sm border-0 bg-transparent px-0 py-0 fw-normal text-decoration-none shadow-none labels-filter-category-bulk-btn';

    return (
        <React.Fragment>
            <div className={headerClassName}>
                <div className="d-flex align-items-center min-w-0 text-secondary fw-bold">
                    <span className="material-icons-outlined me-2 flex-shrink-0" style={{ fontSize: '1.25rem' }}>
                        filter_list
                    </span>
                    <span className="text-truncate">{t('calendar.filterByCategory')}</span>
                </div>
                {labelOptions.length > 0 && (
                    <div className="d-flex align-items-center gap-2 mt-2">
                        <button
                            type="button"
                            className={bulkBtnClass}
                            onClick={handleSelectAllFilters}
                            disabled={allCategoriesSelected}
                            title={t('calendar.checkAllCategories')}
                            aria-label={t('calendar.selectAllFilterCategories')}
                        >
                            {t('calendar.selectAllCategories')}
                        </button>
                        <span
                            className={`fw-normal ${sepClassName}`.trim()}
                            style={sepClassName ? undefined : { color: '#495057' }}
                            aria-hidden
                        >
                            ·
                        </span>
                        <button
                            type="button"
                            className={bulkBtnClass}
                            onClick={handleClearAllFilters}
                            disabled={noCategoriesSelected}
                            title={t('calendar.uncheckAllCategories')}
                            aria-label={t('calendar.uncheckAllFilterCategories')}
                        >
                            {t('calendar.clearAll')}
                        </button>
                    </div>
                )}
            </div>
            {isInitialLoading ? (
                <EventListSkeleton count={1} />
            ) : (
                <div className={contentClassName || undefined}>
                    <CustomDropdown
                        title={t('calendar.selectCategoriesToFilter')}
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
