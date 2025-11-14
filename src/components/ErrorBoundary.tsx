import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
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

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="telegram-card p-6 max-w-2xl w-full text-center animate-fade-in">
            <h1 className="text-xl font-bold mb-2 text-red-500">حدث خطأ غير متوقع</h1>
            <p className="text-sm text-muted-foreground mb-4">
              نأسف للإزعاج. قم بتحديث الصفحة أو حاول مرة أخرى لاحقًا.
            </p>
            
            {/* Error Message */}
            {this.state.error && (
              <div className="mb-4">
                <h2 className="text-sm font-semibold mb-2 text-left">رسالة الخطأ:</h2>
                <pre className="text-xs text-red-400 bg-red-950/30 border border-red-500/30 rounded-md p-3 overflow-auto text-left max-h-32">
                  {this.state.error.message}
                </pre>
              </div>
            )}
            
            {/* Stack Trace */}
            {this.state.error?.stack && (
              <div className="mb-4">
                <h2 className="text-sm font-semibold mb-2 text-left">Stack Trace:</h2>
                <pre className="text-xs text-muted-foreground bg-secondary/50 rounded-md p-3 overflow-auto text-left max-h-48">
                  {this.state.error.stack}
                </pre>
              </div>
            )}
            
            {/* Component Stack */}
            {this.state.errorInfo?.componentStack && (
              <div className="mb-4">
                <h2 className="text-sm font-semibold mb-2 text-left">Component Stack:</h2>
                <pre className="text-xs text-muted-foreground bg-secondary/50 rounded-md p-3 overflow-auto text-left max-h-48">
                  {this.state.errorInfo.componentStack}
                </pre>
              </div>
            )}
            
            <button
              onClick={this.handleReload}
              className="telegram-button px-6 py-3 rounded-md font-semibold"
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
