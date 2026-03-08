import React from 'react';
import Icon from './Icon';

/**
 * Configurable base error boundary. All specialized error boundaries extend this.
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children
 * @param {function} [props.onError] - (error, errorInfo) => void
 * @param {function} [props.fallback] - (error, retry) => ReactNode - custom fallback UI
 * @param {string} [props.title] - Fallback heading
 * @param {string|React.ReactNode|function} [props.message] - Message, React node, or (error, state) => string|ReactNode for dynamic
 * @param {string} [props.icon] - Material Icon name (e.g. 'warning', 'wifi')
 * @param {string} [props.alertVariant] - Bootstrap alert variant: 'danger' | 'warning' | 'light'
 * @param {string} [props.componentName] - For component variant, shown in message
 * @param {boolean} [props.showRetry=true] - Show retry button
 * @param {boolean} [props.showReload=true] - Show reload button
 * @param {string} [props.retryLabel='Try Again'] - Retry button text
 * @param {string} [props.reloadLabel='Reload Page'] - Reload button text
 * @param {string} [props.retryVariant='danger'] - Retry button Bootstrap variant
 * @param {Array} [props.extraActions] - [{ label, onClick, variant, icon }] - icon is Material Icon name
 * @param {boolean} [props.compact=false] - Use compact/minimal layout
 * @param {boolean} [props.showDetails=true] - Show error details in development
 */
class BaseErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorType: null,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    let errorType = null;
    if (error?.code) {
      errorType = error.code.includes('firestore') ? 'firebase' : 'network';
    } else if (error?.message?.includes('fetch')) {
      errorType = 'network';
    }

    this.setState({
      error,
      errorInfo,
      errorType,
    });

    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorType: null,
    });
  };

  getMessage = () => {
    const { error, errorType } = this.state;
    const { message } = this.props;

    if (typeof message === 'function') {
      return message(error, this.state);
    }
    if (message !== undefined && message !== null) {
      return message;
    }

    // Async variant: dynamic message by error type
    if (errorType === 'firebase') {
      return 'Unable to sync with cloud storage. Please check your internet connection.';
    }
    if (errorType === 'network') {
      return 'Network connection error. Please check your internet connection and try again.';
    }

    return error?.message || 'An unexpected error occurred. Please try again.';
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    const { error, errorInfo } = this.state;
    const {
      fallback,
      title = 'Something went wrong',
      icon = 'warning',
      alertVariant = 'danger',
      componentName,
      showRetry = true,
      showReload = true,
      retryLabel = 'Try Again',
      reloadLabel = 'Reload Page',
      retryVariant = 'danger',
      extraActions = [],
      compact = false,
      showDetails = true,
    } = this.props;

    if (fallback) {
      return fallback(error, this.handleRetry);
    }

    if (compact) {
      return (
        <div className="component-error-boundary p-3">
          <div className={`alert alert-${alertVariant} border`} role="alert">
            <div className="d-flex align-items-center">
              <Icon name={icon} className="text-warning me-2" />
              <div className="flex-grow-1">
                <small className="text-muted">
                  {componentName || 'Component'} temporarily unavailable
                </small>
              </div>
              {showRetry && (
                <button
                  className="btn btn-sm btn-outline-secondary ms-2"
                  onClick={this.handleRetry}
                  title="Retry"
                >
                  <Icon name="refresh" />
                </button>
              )}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="error-boundary-container p-4 text-center">
        <div className={`alert alert-${alertVariant}`} role="alert">
          <h4 className="alert-heading">
            <Icon name={icon} className="me-2" />
            {title}
          </h4>
          <div className="mb-3">
            {(() => {
              const msg = this.getMessage();
              return typeof msg === 'string' ? <p className="mb-0">{msg}</p> : msg;
            })()}
          </div>

          <div className="d-flex flex-wrap gap-2 justify-content-center">
            {showRetry && (
              <button
                className={`btn btn-${retryVariant} me-2`}
                onClick={this.handleRetry}
              >
                <Icon name="refresh" className="me-1" />
                {retryLabel}
              </button>
            )}
            {showReload && (
              <button
                className="btn btn-secondary"
                onClick={() => window.location.reload()}
              >
                <Icon name="refresh" className="me-1" />
                {reloadLabel}
              </button>
            )}
            {extraActions.map((action, i) => (
              <button
                key={i}
                className={`btn btn-${action.variant || 'outline-secondary'}`}
                onClick={action.onClick}
              >
                {action.icon && <Icon name={action.icon} className="me-1" />}
                {action.label}
              </button>
            ))}
          </div>

          {showDetails && process.env.NODE_ENV === 'development' && error && (
            <details className="mt-3 text-start">
              <summary className="mb-2">Error Details (Development Only)</summary>
              <pre className="bg-light p-2 rounded small text-wrap">
                {error.toString()}
                {errorInfo?.componentStack}
              </pre>
            </details>
          )}
        </div>
      </div>
    );
  }
}

export default BaseErrorBoundary;
