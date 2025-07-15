import React from 'react';
import { UI_CONSTANTS } from '../../constants';

/**
 * Individual event item component for calendar display
 */
const EventItem = ({ event, onClick, labelsMapping }) => {
  const { title, toDo, labels = [], description } = event;
  
  const displayTitle = title || toDo;
  const tooltipText = displayTitle + (description ? ` - ${description}` : '');
  
  return (
    <div
      className="event-item d-flex flex-column align-items-start position-relative" 
      style={{ 
        gap: "2px", 
        marginBottom: "2px",
        padding: '2px',
        cursor: 'pointer',
        borderRadius: '3px',
        backgroundColor: 'rgba(0,0,0,0.02)',
        border: '1px solid rgba(0,0,0,0.1)'
      }}
      onClick={onClick}
      title={tooltipText}
    >
      {/* Event content */}
      <div className="d-flex align-items-center w-100">
        <div className="d-flex flex-wrap align-items-center" style={{
          maxWidth: "100%", 
          wordWrap: 'break-word'
        }}>
          {/* To-do items (special styling) */}
          {toDo && !title && (
            <TodoItem text={toDo} />
          )}
          
          {/* Regular event title */}
          {title && (
            <EventTitle text={title} />
          )}
          
          {/* Event labels/icons */}
          <EventIcons labels={labels} labelsMapping={labelsMapping} />
        </div>
      </div>
      
      {/* Mobile touch indicator */}
      <div className="position-absolute top-0 end-0 d-md-none" style={{ 
        fontSize: '0.5rem',
        color: 'rgba(0,0,0,0.4)',
        padding: '2px'
      }}>
        <i className="material-icons-outlined" style={{ fontSize: '8px' }}>
          touch_app
        </i>
      </div>
    </div>
  );
};

/**
 * To-do item component with special styling
 */
const TodoItem = ({ text }) => (
  <div className="d-flex align-items-center w-100">
    <span className="event-item flex-grow-1" style={{
      cursor: "pointer", 
      backgroundColor: "red", 
      padding: "1px 3px", 
      borderRadius: "3px", 
      color: "white", 
      fontSize: "0.6rem",
      marginBottom: "1px",
      wordWrap: 'break-word',
      whiteSpace: 'normal'
    }}>
      {text}
    </span>
  </div>
);

/**
 * Event title component
 */
const EventTitle = ({ text }) => (
  <div className="d-flex align-items-center w-100">
    <span className="event-item flex-grow-1" style={{
      cursor: "pointer", 
      fontSize: "0.65rem",
      wordWrap: 'break-word',
      whiteSpace: 'normal'
    }}>
      {text}
    </span>
  </div>
);

/**
 * Event icons component
 */
const EventIcons = ({ labels, labelsMapping }) => {
  if (!labels || labels.length === 0) return null;
  
  const visibleLabels = labels.slice(0, UI_CONSTANTS.MAX_ICONS_PER_EVENT);
  const hasMoreLabels = labels.length > UI_CONSTANTS.MAX_ICONS_PER_EVENT;
  
  return (
    <div className="d-flex align-items-center mt-1">
      {visibleLabels.map((label, index) => {
        const iconClass = Object.keys(labelsMapping).find(
          key => labelsMapping[key] === label
        ) || label;
        
        return (
          <i 
            key={index} 
            className={`event-icons fi fi-rr-${iconClass}`} 
            style={{ 
              fontSize: "12px", 
              cursor: "pointer", 
              minWidth: "12px", 
              marginRight: "1px", 
              lineHeight: "1"
            }}
            title={label}
          />
        );
      })}
      {hasMoreLabels && (
        <span className="text-muted" style={{ fontSize: '0.5rem' }}>
          +{labels.length - UI_CONSTANTS.MAX_ICONS_PER_EVENT}
        </span>
      )}
    </div>
  );
};

export default EventItem; 