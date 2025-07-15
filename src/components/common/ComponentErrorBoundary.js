import React from 'react';

/**
 * Component Error Boundary
 * Lightweight error boundary for individual components
 */
class ComponentErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error(`Component Error in ${this.props.componentName || 'Unknown'}:`, error);
    console.error('Error Info:', errorInfo);
    
    this.setState({
      error: error
    });

    // Log to external service
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({ 
      hasError: false, 
      error: null
    });
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.handleRetry);
      }

      // Default minimal fallback
      return (
        <div className="component-error-boundary p-3">
          <div className="alert alert-light border" role="alert">
            <div className="d-flex align-items-center">
              <i className="fas fa-exclamation-circle text-warning me-2"></i>
              <div className="flex-grow-1">
                <small className="text-muted">
                  {this.props.componentName || 'Component'} temporarily unavailable
                </small>
              </div>
              <button 
                className="btn btn-sm btn-outline-secondary ms-2"
                onClick={this.handleRetry}
                title="Retry"
              >
                <i className="fas fa-redo"></i>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ComponentErrorBoundary; 