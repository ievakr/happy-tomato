import React from 'react';

/**
 * Standardized icon component. Uses Material Icons (Outlined) by default.
 * Material Icons are loaded from Google Fonts - see public/index.html.
 *
 * For plant/garden icons, use Flaticon via the plantIcon prop (fi fi-rr-*).
 *
 * @param {string} props.name - Material Icon name (e.g. 'warning', 'refresh', 'delete')
 * @param {string} [props.className] - Additional CSS classes
 * @param {Object} [props.style] - Inline styles
 * @param {string} [props.plantIcon] - Flaticon icon key for plant icons (e.g. 'tomato')
 */
export default function Icon({ name, plantIcon, className = '', style }) {
  if (plantIcon) {
    return (
      <i
        className={`fi fi-rr-${plantIcon} ${className}`.trim()}
        style={style}
        aria-hidden
      />
    );
  }
  return (
    <span
      className={`material-icons-outlined ${className}`.trim()}
      style={style}
      aria-hidden
    >
      {name}
    </span>
  );
}
