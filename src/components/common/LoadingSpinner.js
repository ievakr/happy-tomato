import React from 'react';

/**
 * Reusable loading spinner component
 */
const LoadingSpinner = ({ 
  size = 'md', 
  text = 'Loading...', 
  className = '', 
  showText = true,
  variant = 'primary'
}) => {
  const sizeClass = {
    sm: 'spinner-border-sm',
    md: '',
    lg: 'spinner-border-lg'
  }[size];

  const spinnerClass = `spinner-border text-${variant} ${sizeClass}`;

  return (
    <div 
      className={`d-flex align-items-center justify-content-center ${className}`}
      role="status"
      aria-live="polite"
      aria-label={text}
    >
      <div className={spinnerClass} role="status" aria-hidden="true">
        <span className="visually-hidden">{text}</span>
      </div>
      {showText && (
        <span className="ms-2 text-muted" aria-hidden="true">{text}</span>
      )}
    </div>
  );
};

/**
 * Full page loading overlay
 */
export const LoadingOverlay = ({ 
  text = 'Loading...', 
  backdrop = true,
  className = ''
}) => {
  return (
    <div 
      className={`position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center ${className}`}
      style={{ 
        zIndex: 1050,
        backgroundColor: backdrop ? 'rgba(255, 255, 255, 0.8)' : 'transparent'
      }}
      role="dialog"
      aria-modal="true"
      aria-label={text}
      aria-live="assertive"
    >
      <div className="text-center">
        <LoadingSpinner size="lg" text={text} showText={true} />
      </div>
    </div>
  );
};

/**
 * Loading skeleton for calendar days
 */
export const CalendarDaySkeleton = () => {
  return (
    <div 
      className="calendar-day-skeleton p-2" 
      style={{ minHeight: '80px' }}
      role="status"
      aria-label="Loading calendar day..."
      aria-live="polite"
    >
      <div className="placeholder-glow" aria-hidden="true">
        <div className="placeholder bg-secondary rounded mb-1" style={{ width: '20px', height: '20px' }}></div>
        <div className="placeholder bg-light rounded mb-1" style={{ width: '100%', height: '12px' }}></div>
        <div className="placeholder bg-light rounded" style={{ width: '80%', height: '12px' }}></div>
      </div>
      <span className="visually-hidden">Loading calendar day...</span>
    </div>
  );
};

/**
 * Loading state for event list
 */
export const EventListSkeleton = ({ count = 3 }) => {
  return (
    <div 
      className="event-list-skeleton"
      role="status"
      aria-label={`Loading ${count} items...`}
      aria-live="polite"
    >
      <span className="visually-hidden">Loading list items...</span>
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="placeholder-glow mb-2" aria-hidden="true">
          <div className="placeholder bg-secondary rounded mb-1" style={{ width: '60%', height: '16px' }}></div>
          <div className="placeholder bg-light rounded" style={{ width: '40%', height: '12px' }}></div>
        </div>
      ))}
    </div>
  );
};

export default LoadingSpinner; 