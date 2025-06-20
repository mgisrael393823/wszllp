import React, { Component, ReactNode, Suspense } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import Button from './Button';

interface LazyBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  errorMessage?: string;
}

interface LazyBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error boundary wrapper for lazy-loaded components
 * Provides error handling and loading states
 */
class LazyBoundary extends Component<LazyBoundaryProps, LazyBoundaryState> {
  constructor(props: LazyBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): LazyBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('LazyBoundary caught error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center p-8 min-h-[400px]">
          <AlertCircle className="h-12 w-12 text-error-500 mb-4" />
          <h3 className="text-lg font-medium text-neutral-900 mb-2">
            {this.props.errorMessage || 'Failed to load component'}
          </h3>
          <p className="text-sm text-neutral-600 mb-4 text-center max-w-md">
            {this.state.error?.message || 'An unexpected error occurred while loading this section.'}
          </p>
          <Button
            onClick={this.handleRetry}
            variant="outline"
            size="sm"
            icon={<RefreshCw className="h-4 w-4" />}
          >
            Retry
          </Button>
        </div>
      );
    }

    return (
      <Suspense
        fallback={
          this.props.fallback || (
            <div className="flex items-center justify-center p-8 min-h-[200px]">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mb-4"></div>
                <p className="text-sm text-neutral-600">Loading...</p>
              </div>
            </div>
          )
        }
      >
        {this.props.children}
      </Suspense>
    );
  }
}

export default LazyBoundary;