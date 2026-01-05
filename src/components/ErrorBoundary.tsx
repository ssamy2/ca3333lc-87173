import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onReset?: () => void;
}

/**
 * ============================================================================
 * NOVA GLOBAL ERROR BOUNDARY
 * Protocol: CODE_DIRECT_REFACTOR_IMAGE_CACHE_2026
 * ============================================================================
 * Features:
 * - Global exception handling for all tool components
 * - Fallback UI for failed widget loading
 * - Bilingual error messages (AR/EN)
 * - Reset functionality
 * - GPU-optimized animations for low-end devices
 * - CSS transitions instead of JS animations
 */
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

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
    this.props.onReset?.();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="telegram-card p-6 max-w-2xl w-full text-center animate-fade-in">
            {/* Error Icon */}
            <div className="mx-auto w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mb-4">
              <AlertTriangle className="w-8 h-8 text-destructive" />
            </div>

            <h1 className="text-xl font-bold mb-2 text-destructive">
              حدث خطأ غير متوقع / Unexpected Error
            </h1>
            <p className="text-sm text-muted-foreground mb-6">
              نأسف للإزعاج. قم بتحديث الصفحة أو حاول مرة أخرى لاحقًا.
              <br />
              We apologize for the inconvenience. Please refresh or try again later.
            </p>
            
            {/* Error Message - Collapsible */}
            {this.state.error && (
              <details className="mb-4 text-left">
                <summary className="text-sm font-semibold cursor-pointer text-muted-foreground hover:text-foreground transition-colors">
                  Error Details / تفاصيل الخطأ
                </summary>
                <pre className="text-xs text-destructive bg-destructive/10 border border-destructive/30 rounded-xl p-3 overflow-auto mt-2 max-h-32">
                  {this.state.error.message}
                </pre>
              </details>
            )}
            
            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={this.handleReset}
                className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                حاول مجدداً / Try Again
              </button>
              <button
                onClick={this.handleGoHome}
                className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
              >
                <Home className="w-4 h-4" />
                الرئيسية / Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Widget Error Boundary - Lightweight fallback for individual widgets
 * Use this to wrap individual components that might fail without crashing the whole page
 */
interface WidgetErrorBoundaryProps {
  children: React.ReactNode;
  fallbackMessage?: string;
  className?: string;
}

interface WidgetErrorBoundaryState {
  hasError: boolean;
}

export class WidgetErrorBoundary extends React.Component<WidgetErrorBoundaryProps, WidgetErrorBoundaryState> {
  constructor(props: WidgetErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): WidgetErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('WidgetErrorBoundary caught an error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className={`flex flex-col items-center justify-center p-4 rounded-xl bg-card border border-border/50 ${this.props.className || ''}`}>
          <AlertTriangle className="w-8 h-8 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground text-center mb-3">
            {this.props.fallbackMessage || 'Failed to load widget / فشل تحميل المكون'}
          </p>
          <button
            onClick={this.handleRetry}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
            Retry
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
