import React from 'react';

/**
 * Context Error Boundary Component
 * Specialized error boundary for handling context-related errors
 */
class ContextErrorBoundary extends React.Component {
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
    console.error('Context Error Boundary caught an error:', error);
    console.error('Error Info:', errorInfo);
    
    this.setState({
      error: error
    });

    // Log to external service
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="context-error-boundary p-4 text-center">
          <div className="alert alert-danger" role="alert">
            <h4 className="alert-heading">
              <i className="fas fa-database me-2"></i>
              App Context Error
            </h4>
            <p className="mb-3">
              There was an error with the application state. This might be due to:
            </p>
            <ul className="text-start mb-3">
              <li>Data synchronization issues</li>
              <li>Invalid data format</li>
              <li>Context provider errors</li>
            </ul>
            
            <button 
                              className="btn btn-danger me-2"
              onClick={() => window.location.reload()}
            >
              <i className="fas fa-sync me-1"></i>
              Restart App
            </button>
            
            <button 
              className="btn btn-outline-secondary"
              onClick={() => {
                // Clear localStorage to reset app state
                localStorage.clear();
                window.location.reload();
              }}
            >
              <i className="fas fa-trash me-1"></i>
              Reset App Data
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ContextErrorBoundary; 