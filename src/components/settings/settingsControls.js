import React from 'react';
import Icon from '../common/Icon';

export function SettingsTimeField({ id, value, onChange }) {
  return (
    <div className="settings-time-field">
      <input
        id={id}
        type="time"
        className="form-control"
        value={value}
        onChange={onChange}
      />
      <Icon name="schedule" className="settings-time-icon" aria-hidden />
    </div>
  );
}

export function SettingsSwitch({ id, label, checked, onChange, strong = false }) {
  return (
    <div className={`settings-switch-row${strong ? ' settings-switch-row--strong' : ''}`}>
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        type="checkbox"
        role="switch"
        checked={checked}
        onChange={onChange}
      />
    </div>
  );
}

export function SettingsCollapseRow({
  id,
  label,
  value,
  open,
  onToggle,
  children,
  danger = false,
  disabled = false,
}) {
  const panelId = `settings-panel-${id}`;
  const className = `settings-row${danger ? ' settings-row--danger' : ''}`;
  const chevron = (
    <Icon
      name="expand_more"
      className={`settings-row-chevron settings-row-chevron--expand${
        open ? ' settings-row-chevron--open' : ''
      }`}
    />
  );

  if (disabled) {
    return (
      <div className={className}>
        <span className="settings-row-label">{label}</span>
        {value != null && value !== '' && (
          <span className="settings-row-value">{value}</span>
        )}
      </div>
    );
  }

  if (open) {
    return (
      <div className="settings-editor">
        <button
          type="button"
          className="settings-editor-toggle"
          onClick={onToggle}
          aria-expanded="true"
          aria-controls={panelId}
        >
          <span className="settings-row-label" id={`${panelId}-label`}>
            {label}
          </span>
          {chevron}
        </button>
        <div
          id={panelId}
          className="settings-editor-body"
          role="region"
          aria-labelledby={`${panelId}-label`}
        >
          {children}
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      className={className}
      onClick={onToggle}
      aria-expanded="false"
      aria-controls={panelId}
    >
      <span className="settings-row-label">{label}</span>
      {value != null && value !== '' && (
        <span className="settings-row-value">{value}</span>
      )}
      {chevron}
    </button>
  );
}
