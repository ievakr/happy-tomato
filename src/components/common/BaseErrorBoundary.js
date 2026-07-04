import React from 'react';
import Icon from './Icon';
import LanguageContext from '../../i18n/LanguageContext';

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
  static contextType = LanguageContext;

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

  // May render outside a LanguageProvider (e.g. the root boundary wrapping the
  // provider itself), so fall back to the given English string when there is no
  // translation context available.
  tr = (key, fallback, params) => {
    const t = this.context?.t;
    return t ? t(key, params) : fallback;
  };

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
      return this.tr(
        'common.errorFirebaseSync',
        'Unable to sync with cloud storage. Please check your internet connection.',
      );
    }
    if (errorType === 'network') {
      return this.tr(
        'common.errorNetwork',
        'Network connection error. Please check your internet connection and try again.',
      );
    }

    return (
      error?.message ||
      this.tr('common.unexpectedError', 'An unexpected error occurred. Please try again.')
    );
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    const { error, errorInfo } = this.state;
    const {
      fallback,
      title: titleProp,
      icon = 'warning',
      alertVariant = 'danger',
      componentName,
      showRetry = true,
      showReload = true,
      retryLabel: retryLabelProp,
      reloadLabel: reloadLabelProp,
      retryVariant = 'danger',
      extraActions = [],
      compact = false,
      showDetails = true,
    } = this.props;

    const title = titleProp ?? this.tr('common.somethingWentWrong', 'Something went wrong');
    const retryLabel = retryLabelProp ?? this.tr('common.tryAgain', 'Try Again');
    const reloadLabel = reloadLabelProp ?? this.tr('common.reloadPage', 'Reload Page');

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
                  {this.tr('common.componentUnavailable', `${componentName || 'Component'} temporarily unavailable`, {
                    name: componentName || this.tr('common.component', 'Component'),
                  })}
                </small>
              </div>
              {showRetry && (
                <button
                  className="btn btn-sm btn-outline-secondary ms-2"
                  onClick={this.handleRetry}
                  title={this.tr('common.tryAgain', 'Try Again')}
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
              <summary className="mb-2">{this.tr('common.errorDetailsDev', 'Error Details (Development Only)')}</summary>
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
