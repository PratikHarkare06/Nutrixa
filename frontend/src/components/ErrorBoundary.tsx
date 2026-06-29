import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error in component tree:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#F5F6F1] flex items-center justify-center p-6 text-center">
          <div className="bg-white rounded-[32px] border border-[#E2E4DC] p-8 max-w-md w-full shadow-xl">
            <div className="text-4xl mb-4">⚠️</div>
            <h1 className="text-xl font-black text-[#2C3E2B] mb-2">Something went wrong</h1>
            <p className="text-xs text-[#888888] leading-relaxed mb-6">
              An unexpected error occurred. Please try reloading the application. If the problem persists, contact support.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => window.location.reload()}
                className="flex-1 py-3 bg-[#9DB89F] hover:bg-[#7A9E7E] text-white text-xs font-bold rounded-xl transition-all shadow-sm"
              >
                Reload App
              </button>
              <button
                onClick={() => this.setState({ hasError: false, error: null })}
                className="flex-1 py-3 bg-white hover:bg-[#EBF2EB] border border-[#9DB89F]/40 text-[#7A9E7E] text-xs font-bold rounded-xl transition-all"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
