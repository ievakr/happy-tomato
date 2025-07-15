import React from 'react';

/**
 * Async Error Boundary Component
 * Specialized error boundary for handling async operations like Firebase calls
 */
class AsyncErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorType: null
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Async Error Boundary caught an error:', error);
    
    // Determine error type
    let errorType = 'unknown';
    if (error.code) {
      // Firebase or network error
      errorType = error.code.includes('firestore') ? 'firebase' : 'network';
    } else if (error.message.includes('fetch')) {
      errorType = 'network';
    }

    this.setState({
      error: error,
      errorType: errorType
    });

    // Log to external service
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  getErrorMessage = () => {
    const { error, errorType } = this.state;
    
    switch (errorType) {
      case 'firebase':
        return 'Unable to sync with cloud storage. Please check your internet connection.';
      case 'network':
        return 'Network connection error. Please check your internet connection and try again.';
      default:
        return error?.message || 'An unexpected error occurred while processing your request.';
    }
  };

  handleRetry = () => {
    this.setState({ 
      hasError: false, 
      error: null,
      errorType: null 
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="async-error-boundary p-3">
          <div className="alert alert-warning" role="alert">
            <h5 className="alert-heading">
              <i className="fas fa-wifi me-2"></i>
              Connection Issue
            </h5>
            <p className="mb-3">{this.getErrorMessage()}</p>
            
            <button 
              className="btn btn-warning me-2"
              onClick={this.handleRetry}
            >
              <i className="fas fa-redo me-1"></i>
              Retry
            </button>
            
            <button 
              className="btn btn-outline-secondary"
              onClick={() => window.location.reload()}
            >
              <i className="fas fa-sync me-1"></i>
              Refresh
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default AsyncErrorBoundary; 