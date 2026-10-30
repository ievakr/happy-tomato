import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import Icon from '../components/common/Icon';
import '../styles/toast.css';

const ToastContext = createContext();

const TOAST_ICONS = {
  success: 'check',
  warning: 'priority_high',
  error: 'priority_high',
  info: 'info',
};

/**
 * Custom hook to use toast notifications
 * @returns {Object} Toast context with showToast function
 */
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

/**
 * Toast Provider Component
 * Provides toast notification functionality throughout the app.
 * Uses Bootstrap styling (no MUI dependency).
 */
export function ToastProvider({ children }) {
  const [toast, setToast] = useState({
    open: false,
    message: '',
    severity: 'info',
    duration: 6000,
  });

  const showToast = useCallback((message, severity = 'info', duration = 6000) => {
    setToast({
      open: true,
      message,
      severity,
      duration,
    });
  }, []);

  const showSuccess = useCallback((message, duration) => {
    showToast(message, 'success', duration);
  }, [showToast]);

  const showError = useCallback((message, duration) => {
    showToast(message, 'error', duration);
  }, [showToast]);

  const showWarning = useCallback((message, duration) => {
    showToast(message, 'warning', duration);
  }, [showToast]);

  const showInfo = useCallback((message, duration) => {
    showToast(message, 'info', duration);
  }, [showToast]);

  const handleClose = useCallback(() => {
    setToast((prev) => ({ ...prev, open: false }));
  }, []);

  // Auto-hide after duration
  useEffect(() => {
    if (!toast.open || !toast.duration) return;
    const timer = setTimeout(handleClose, toast.duration);
    return () => clearTimeout(timer);
  }, [toast.open, toast.duration, handleClose]);

  return (
    <ToastContext.Provider value={{ showToast, showSuccess, showError, showWarning, showInfo }}>
      {children}
      {toast.open && (
        <div className={`app-toast app-toast--${toast.severity}`}>
          <div className="app-toast__card" role="alert">
            <span className="app-toast__icon" aria-hidden>
              <Icon name={TOAST_ICONS[toast.severity] || TOAST_ICONS.info} />
            </span>
            <span>{toast.message}</span>
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
}
