import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import Icon from '../components/common/Icon';

const ToastContext = createContext();

const SEVERITY_CLASSES = {
  success: 'bg-success text-white',
  error: 'bg-danger text-white',
  warning: 'bg-warning text-dark',
  info: 'bg-info text-white',
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
        <div
          className="position-fixed start-50 translate-middle-x p-3"
          style={{
            zIndex: 9999,
            bottom: 'max(0.75rem, env(safe-area-inset-bottom, 0px))',
          }}
        >
          <div
            className={`d-flex align-items-center rounded shadow-sm ${SEVERITY_CLASSES[toast.severity]}`}
            role="alert"
            style={{ minWidth: '300px', maxWidth: '90vw' }}
          >
            <div className="flex-grow-1 p-3">{toast.message}</div>
            <button
              type="button"
              className="btn btn-link p-2 text-reset border-0"
              onClick={handleClose}
              aria-label="Close"
              style={{ opacity: 0.9 }}
            >
              <Icon name="close" style={{ fontSize: '1.25rem' }} />
            </button>
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
}
