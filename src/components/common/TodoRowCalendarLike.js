import React from 'react';
import Icon from './Icon';
import { plantLabelDisplayText } from '../calendar/EventItem';
import { formatTodoLabel } from '../../utils/weekAheadTodos';

/**
 * One row: calendar-style [plant icon + name …] [action / todo text]
 * (No leading todo “radio” icon — it reads as a large empty circle on mobile.)
 */
export default function TodoRowCalendarLike({ event, plantsById = {} }) {
  const labels = event.labels || [];

  return (
    <div className="d-flex align-items-center w-100" style={{ gap: '10px' }}>
      <div
        className="d-flex flex-wrap align-items-center flex-shrink-0"
        style={{ maxWidth: '42%', gap: '4px' }}
      >
        {labels.length === 0 ? (
          <span className="text-muted small">—</span>
        ) : (
          labels.map((label, labelIdx) => {
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
                className="d-inline-flex align-items-center"
                title={plantTitle}
                style={{ fontSize: '12px', lineHeight: '1.2' }}
              >
                <Icon
                  plantIcon={iconClass}
                  className="event-icons"
                  style={{ minWidth: '14px', marginRight: '4px' }}
                />
                {displayText ? <span className="small">{displayText}</span> : null}
              </span>
            );
          })
        )}
      </div>
      <div
        className="flex-grow-1 small fw-semibold text-break"
        style={{ minWidth: 0, wordBreak: 'break-word' }}
      >
        {formatTodoLabel(event)}
      </div>
    </div>
  );
}
