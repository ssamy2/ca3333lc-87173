import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, info);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="telegram-card p-6 max-w-md w-full text-center animate-fade-in">
            <h1 className="text-xl font-bold mb-2">حدث خطأ غير متوقع</h1>
            <p className="text-sm text-muted-foreground mb-4">
              نأسف للإزعاج. قم بتحديث الصفحة أو حاول مرة أخرى لاحقًا.
            </p>
            {this.state.error && (
              <pre className="text-xs text-muted-foreground bg-secondary/50 rounded-md p-3 overflow-auto text-left mb-4">
                {this.state.error.message}
              </pre>
            )}
            <button
              onClick={this.handleReload}
              className="telegram-button px-4 py-2 rounded-md"
            >
              إعادة التحميل
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
