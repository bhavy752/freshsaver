import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Leaf, RefreshCw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // In production, send to error tracking service (e.g. Sentry)
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-cream-50 flex flex-col items-center justify-center px-6">
          <div className="w-16 h-16 rounded-3xl bg-coral-100 flex items-center justify-center mb-5">
            <Leaf className="w-8 h-8 text-coral-500" strokeWidth={2.5} />
          </div>
          <h1 className="text-2xl font-extrabold text-slateink-800 tracking-tight">
            Something went wrong
          </h1>
          <p className="text-sm text-slateink-500 font-medium mt-2 text-center max-w-sm">
            We hit an unexpected error. You can refresh the page or try again.
          </p>
          <div className="flex items-center gap-3 mt-6">
            <button
              onClick={() => window.location.reload()}
              className="flex items-center gap-2 rounded-2xl bg-sage-500 text-white font-bold text-sm px-5 py-3 hover:bg-sage-600 active:scale-95 transition-all shadow-sm"
            >
              <RefreshCw className="w-4 h-4" strokeWidth={2.5} />
              Refresh page
            </button>
            <button
              onClick={this.handleReset}
              className="rounded-2xl border border-slateink-200 bg-white text-slateink-700 font-bold text-sm px-5 py-3 hover:bg-slateink-50 active:scale-95 transition-all"
            >
              Try again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
