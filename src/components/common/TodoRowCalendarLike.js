import React from 'react';
import Icon from './Icon';
import { formatTodoLabel } from '../../utils/weekAheadTodos';

/**
 * Week-ahead row: plant icon, action, and a chevron.
 */
export default function TodoRowCalendarLike({ event, plantsById = {}, onOpen }) {
  const label = event.labels?.[0];
  const plant = label ? plantsById?.[label] : null;
  const action = formatTodoLabel(event);
  const vegetables = [...new Set(
    (event.labels || [])
      .map((id) => plantsById?.[id]?.category)
      .filter(Boolean)
      .filter((name) => !action.toLowerCase().includes(String(name).toLowerCase())),
  )];
  const text = vegetables.length ? `${action} ${vegetables.join(', ')}` : action;
  const done = !!event.completed;

  return (
    <button
      type="button"
      className={`week-ahead-card${done ? ' week-ahead-card--done' : ''}`}
      onClick={() => onOpen?.(event)}
    >
      <Icon plantIcon={plant?.icon || 'leaf'} className="week-ahead-card-icon" />
      <span className="week-ahead-card-text">{text}</span>
      <Icon name="chevron_right" className="week-ahead-card-chevron" />
    </button>
  );
}
