import React from 'react';

/**
 * Base Error Boundary Component
 * Catches JavaScript errors anywhere in the child component tree
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details
    console.error('Error Boundary caught an error:', error);
    console.error('Error Info:', errorInfo);
    
    // Store error details in state
    this.setState({
      error: error,
      errorInfo: errorInfo
    });

    // Log to external error reporting service if available
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({ 
      hasError: false, 
      error: null,
      errorInfo: null 
    });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.handleRetry);
      }

      // Default fallback UI
      return (
        <div className="error-boundary-container p-4 text-center">
          <div className="alert alert-danger" role="alert">
            <h4 className="alert-heading">
              <i className="fas fa-exclamation-triangle me-2"></i>
              {this.props.title || 'Something went wrong'}
            </h4>
            <p className="mb-3">
              {this.props.message || 'An unexpected error occurred. Please try again.'}
            </p>
            
            {this.props.showRetry !== false && (
              <button 
                className="btn btn-primary me-2"
                onClick={this.handleRetry}
              >
                <i className="fas fa-redo me-1"></i>
                Try Again
              </button>
            )}
            
            {this.props.showReload !== false && (
              <button 
                className="btn btn-secondary"
                onClick={() => window.location.reload()}
              >
                <i className="fas fa-sync me-1"></i>
                Reload Page
              </button>
            )}

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-3 text-start">
                <summary className="mb-2">Error Details (Development Only)</summary>
                <pre className="bg-light p-2 rounded small text-wrap">
                  {this.state.error.toString()}
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 