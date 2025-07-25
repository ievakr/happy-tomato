import React from 'react';
import { UI_CONSTANTS } from '../../constants';
import { useResponsive } from '../../hooks';

/**
 * Individual event item component for calendar display
 */
const EventItem = ({ event, onClick, labelsMapping, compact = false, showTime = false }) => {
  const { title, toDo, labels = [], description, time } = event;
  
  const displayTitle = title || toDo;
  const tooltipText = displayTitle + (description ? ` - ${description}` : '');
  
  return (
    <div
      className="event-item d-flex flex-column align-items-start position-relative" 
      style={{ 
        gap: compact ? "1px" : "2px", 
        marginBottom: compact ? "1px" : "2px",
        padding: compact ? '1px 2px' : '2px',
        cursor: 'pointer',
        borderRadius: '3px',
        backgroundColor: 'rgba(0,0,0,0.02)',
        border: '1px solid rgba(0,0,0,0.1)',
        fontSize: compact ? '0.55rem' : '0.65rem'
      }}
      onClick={onClick}
      title={tooltipText}
    >
      {/* Event content */}
      <div className="d-flex align-items-center w-100">
        {/* Show time if requested */}
        {showTime && time && (
          <div className="text-muted me-1" style={{ fontSize: '0.5rem', minWidth: 'fit-content' }}>
            {time}
          </div>
        )}
        
        <div className="d-flex flex-wrap align-items-center" style={{
          maxWidth: "100%", 
          wordWrap: 'break-word'
        }}>
          {/* To-do items (special styling) */}
          {toDo && !title && (
            <TodoItem text={toDo} compact={compact} />
          )}
          
          {/* Regular event title */}
          {title && (
            <EventTitle text={title} compact={compact} />
          )}
          
          {/* Event labels/icons */}
          <EventIcons labels={labels} labelsMapping={labelsMapping} compact={compact} />
        </div>
      </div>
      
      {/* Mobile touch indicator - hide in compact mode */}
      {!compact && (
        <div className="position-absolute top-0 end-0 d-md-none" style={{ 
          fontSize: '0.5rem',
          color: 'rgba(0,0,0,0.4)',
          padding: '2px'
        }}>
          <i className="material-icons-outlined" style={{ fontSize: '8px' }}>
            touch_app
          </i>
        </div>
      )}
    </div>
  );
};

/**
 * To-do item component with special styling
 */
const TodoItem = ({ text, compact = false }) => (
  <div className="d-flex align-items-center w-100">
    <span className="event-item flex-grow-1" style={{
      cursor: "pointer", 
      backgroundColor: "red", 
      padding: compact ? "1px 2px" : "1px 3px", 
      borderRadius: "3px", 
      color: "white", 
      fontSize: compact ? "0.5rem" : "0.6rem",
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
const EventTitle = ({ text, compact = false }) => (
  <div className="d-flex align-items-center w-100">
    <span className="event-item flex-grow-1" style={{
      cursor: "pointer", 
      fontSize: compact ? "0.55rem" : "0.65rem",
      wordWrap: 'break-word',
      whiteSpace: 'normal'
    }}>
      {text}
    </span>
  </div>
);

/**
 * Event icons component with responsive display
 */
const EventIcons = ({ labels, labelsMapping, compact = false }) => {
  const { isMobile } = useResponsive();
  
  if (!labels || labels.length === 0) return null;
  
  // Determine max icons based on mode
  let maxIcons;
  if (compact) {
    maxIcons = 2; // Very limited in compact mode
  } else if (isMobile) {
    maxIcons = UI_CONSTANTS.MAX_ICONS_PER_EVENT;
  } else {
    maxIcons = labels.length; // Show all on desktop
  }
  
  const visibleLabels = labels.slice(0, maxIcons);
  const hasMoreLabels = labels.length > maxIcons;
  
  return (
    <div className="d-flex align-items-center" style={{
      flexWrap: isMobile ? 'nowrap' : 'wrap', // Allow wrapping on desktop for better display
      marginTop: compact ? '1px' : '1px',
    }}>
      {visibleLabels.map((label, index) => {
        const iconClass = Object.keys(labelsMapping).find(
          key => labelsMapping[key] === label
        ) || label;
        
        return (
          <i 
            key={index} 
            className={`event-icons fi fi-rr-${iconClass}`} 
            style={{ 
              fontSize: compact ? "8px" : "12px", 
              cursor: "pointer", 
              minWidth: compact ? "8px" : "12px", 
              marginRight: compact ? "0.5px" : "1px", 
              lineHeight: "1"
            }}
            title={label}
          />
        );
      })}
      {hasMoreLabels && (
        <span className="text-muted" style={{ 
          fontSize: compact ? '0.45rem' : '0.5rem',
          marginLeft: '1px'
        }}>
          +{labels.length - maxIcons}
        </span>
      )}
    </div>
  );
};

export default EventItem; 