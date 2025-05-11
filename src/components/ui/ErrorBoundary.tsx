import React, { Component, ErrorInfo, ReactNode } from 'react';
import Card from './Card';
import Button from './Button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary component to catch and display JavaScript errors
 * Prevents the entire app from crashing when errors occur in a component tree
 */
class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error);
    console.error("Component stack:", errorInfo.componentStack);
    
    // You could log to an error reporting service here
    // Examples: Sentry, LogRocket, etc.
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return this.props.fallback || (
        <Card variant="error" className="my-4">
          <div className="p-4">
            <h2 className="text-lg font-semibold mb-2">Something went wrong</h2>
            <p className="mb-4">An error occurred in this component.</p>
            {this.state.error && (
              <pre className="bg-error-50 p-3 rounded text-sm overflow-auto mb-4">
                {this.state.error.toString()}
              </pre>
            )}
            <Button 
              variant="primary" 
              onClick={() => this.setState({ hasError: false, error: null })}
            >
              Try again
            </Button>
          </div>
        </Card>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;