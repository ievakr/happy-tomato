import React, { memo } from 'react';
import { UI_CONSTANTS } from '../../constants';
import { useResponsive } from '../../hooks';
import Icon from '../common/Icon';

/**
 * Individual event item component for calendar display
 */
const EventItem = memo(({ event, onClick, plantsById = {}, compact = false, showTime = false, showAllIcons = false }) => {
  const { title, toDo, labels = [], description, time } = event;
  
  const displayTitle = title || toDo;
  const tooltipText = displayTitle + (description ? ` - ${description}` : '');
  
  // Check if this is a completed todo item
  const isCompletedTodo = toDo && event.completed;
  
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick?.();
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      className={`event-item d-flex flex-column align-items-start position-relative ${compact ? 'event-item-compact' : ''} ${isCompletedTodo ? 'event-item-completed' : ''}`}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      title={tooltipText}
    >
      {/* Event content */}
      <div className="d-flex align-items-center w-100">
        {/* Checkmark icon for completed todos */}
        {isCompletedTodo && (
          <Icon name="check_circle" className="text-success me-1" style={{ fontSize: compact ? '14px' : '18px' }} />
        )}
        {/* Show time if requested */}
        {showTime && time && (
          <div className="event-item-time text-muted me-1">
            {time}
          </div>
        )}
        
        <div className="d-flex flex-wrap align-items-center" style={{
          maxWidth: "100%", 
          wordWrap: 'break-word'
        }}>
          {/* To-do items (special styling) */}
          {toDo && !title && (
            <TodoItem text={toDo} compact={compact} isCompleted={event.completed} />
          )}
          
          {/* Regular event title */}
          {title && (
            <EventTitle text={title} compact={compact} />
          )}
          
          {/* Event labels/icons */}
          <EventIcons labels={labels} plantsById={plantsById} compact={compact} showAllIcons={showAllIcons} />
        </div>
      </div>
      

    </div>
  );
});

/**
 * To-do item component with special styling
 */
const TodoItem = memo(({ text, compact = false, isCompleted = false }) => (
  <div className="d-flex align-items-center w-100">
    <span className={`event-item-todo flex-grow-1 ${compact ? 'event-item-todo-compact' : ''} ${isCompleted ? 'event-item-todo-completed' : 'event-item-todo-pending'}`}>
      {text}
    </span>
  </div>
));

/**
 * Event title component
 */
const EventTitle = memo(({ text, compact = false }) => (
  <div className="d-flex align-items-center w-100">
    <span className={`event-item-title flex-grow-1 ${compact ? 'event-item-title-compact' : ''}`}>
      {text}
    </span>
  </div>
));

/**
 * Event icons component with responsive display - shows icon + variety name
 */
const EventIcons = memo(({ labels, plantsById = {}, compact = false, showAllIcons = false }) => {
  const { isMobile } = useResponsive();
  
  if (!labels || labels.length === 0) return null;
  
  // Determine max icons based on mode
  let maxIcons;
  if (compact) {
    maxIcons = 2; // Very limited in compact mode
  } else if (showAllIcons) {
    maxIcons = labels.length; // Show all icons when requested
  } else if (isMobile) {
    maxIcons = UI_CONSTANTS.MAX_ICONS_PER_EVENT;
  } else {
    maxIcons = labels.length; // Show all on desktop
  }
  
  const visibleLabels = labels.slice(0, maxIcons);
  const hasMoreLabels = labels.length > maxIcons;
  
  return (
    <div className={`d-flex align-items-center event-icons-row ${compact ? 'event-icons-row-compact' : ''}`} style={{
      flexWrap: isMobile ? 'nowrap' : 'wrap'
    }}>
      {visibleLabels.map((label, index) => {
        const plant = plantsById[label];
        const iconClass = plant?.icon || 'leaf';
        const displayText = plant?.variety || (plant ? '' : label);
        const title = plant ? (plant.variety ? `${plant.category} - ${plant.variety}` : plant.category) : label;
        
        return (
          <span key={index} className="d-inline-flex align-items-center me-1" title={title}>
            <Icon 
              plantIcon={iconClass}
              className={`event-icons ${compact ? 'event-icons-compact' : ''}`}
            />
            {!compact && displayText && (
              <span className="ms-1" style={{ fontSize: '0.75em' }}>{displayText}</span>
            )}
          </span>
        );
      })}
      {hasMoreLabels && (
        <span className={`text-muted ${compact ? 'event-icons-more-compact' : 'event-icons-more'}`}>
          +{labels.length - maxIcons}
        </span>
      )}
    </div>
  );
});

export default EventItem; 