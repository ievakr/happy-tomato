import React from 'react';
import Icon from '../common/Icon';
import { UI_CONSTANTS } from '../../constants';
import { useRecurringActions, useResponsive } from '../../hooks';
import { plantLabelDisplayText, eventTodoOrTitleText } from './EventItem';

function buildEventClasses(evt, isTodoEvent, listMode, bulkEditSelected) {
  const base = listMode
    ? 'calendar-event text-xs rounded p-1 mb-2 w-100 d-flex align-items-center cursor-pointer'
    : 'calendar-event text-xs rounded p-1 m-1 d-flex align-items-center cursor-pointer';
  if (evt.completed) {
    return `${base} calendar-event--completed border border-success bg-success bg-opacity-10 text-success-emphasis`;
  }
  if (isTodoEvent(evt)) {
    return `${base} calendar-event--todo border border-danger bg-danger bg-opacity-10 text-danger-emphasis`;
  }
  if (bulkEditSelected) {
    return `${base} calendar-event--default border border-success bg-success bg-opacity-10 text-success-emphasis`;
  }
  return `${base} calendar-event--default border border-primary bg-primary bg-opacity-10 text-primary-emphasis`;
}

/** Event-type icon (material) — same logic as month/daily chips */
export function getEventIconName(evt, isTodoEvent) {
  if (evt.completed) return 'check_circle';
  if (isTodoEvent(evt)) return 'radio_button_unchecked';
  return 'event';
}

/**
 * Month-grid style event chip (icon + title/to-do + plant row).
 * Used in calendar day cells (desktop) and mobile daily view to match web styling.
 */
export default function CalendarEventChip({
  event: evt,
  plantsById = {},
  onClick,
  className = '',
  style,
  /** When true (e.g. mobile daily view), match desktop month grid: all plant icons, wrapped */
  preferFullPlantIcons = false,
  /** Full-width row in daily list instead of inset month-cell margins */
  listMode = false,
  /** Bulk-edit row selected (daily view): use success tint instead of primary */
  bulkEditSelected = false,
  /** When true (e.g. day list with external complete circle), omit leading status icon */
  hideLeadingStatusIcon = false,
}) {
  const { isTodoEvent } = useRecurringActions();
  const { isMobile } = useResponsive();
  const labels = evt.labels || [];
  const maxIcons =
    preferFullPlantIcons || !isMobile
      ? labels.length
      : UI_CONSTANTS.MAX_ICONS_PER_EVENT;
  const iconsFlexWrap = preferFullPlantIcons || !isMobile ? 'wrap' : 'nowrap';
  const primaryText = eventTodoOrTitleText(evt);
  const titleText = primaryText
    ? `${primaryText}${evt.description ? ` - ${evt.description}` : ''}`
    : '';

  return (
    <div
      onClick={onClick}
      className={`${buildEventClasses(evt, isTodoEvent, listMode, bulkEditSelected)} ${className}`.trim()}
      style={{
        gap: '2px',
        marginBottom: '2px',
        padding: '3px 4px',
        fontSize: '0.65rem',
        ...style,
      }}
      title={titleText}
    >
      <div className="d-flex align-items-center w-100">
        {!hideLeadingStatusIcon && (
          <Icon
            name={getEventIconName(evt, isTodoEvent)}
            className="me-1"
            style={{ fontSize: '12px' }}
          />
        )}
        <div
          className={`d-flex flex-wrap align-items-center flex-grow-1${evt.completed ? ' text-decoration-line-through' : ''}`}
          style={{ maxWidth: '100%', wordWrap: 'break-word' }}
        >
          {primaryText ? (
            <div className="d-flex align-items-center w-100">
              <span
                className="flex-grow-1"
                style={{
                  fontSize: '0.6rem',
                  wordWrap: 'break-word',
                  whiteSpace: 'normal',
                }}
              >
                {primaryText}
              </span>
            </div>
          ) : null}

          <div
            className="d-flex align-items-center mt-1"
            style={{
              flexWrap: iconsFlexWrap,
            }}
          >
            {(() => {
              const visibleLabels = labels.slice(0, maxIcons);
              const hasMoreLabels = labels.length > maxIcons;

              return (
                <>
                  {visibleLabels.map((label, labelIdx) => {
                    const plant = plantsById?.[label];
                    const iconClass = plant?.icon || 'leaf';
                    const displayText = plantLabelDisplayText(plant, label);
                    const plantTitle = plant
                      ? plant.variety
                        ? `${plant.category} - ${plant.variety}`
                        : plant.category
                      : label;
                    return (
                      <span
                        key={labelIdx}
                        className="d-inline-flex align-items-center me-1"
                        title={plantTitle}
                        style={{ fontSize: '12px', lineHeight: '1' }}
                      >
                        <Icon
                          plantIcon={iconClass}
                          className="event-icons"
                          style={{ minWidth: '12px', marginRight: '2px' }}
                        />
                        {displayText && (
                          <span style={{ fontSize: '0.6rem' }}>{displayText}</span>
                        )}
                      </span>
                    );
                  })}
                  {hasMoreLabels && (
                    <span className="text-muted" style={{ fontSize: '0.5rem' }}>
                      +{labels.length - maxIcons}
                    </span>
                  )}
                </>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}
