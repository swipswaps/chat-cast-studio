// File: components/ErrorBoundary.tsx
// PRF-COMPLIANT ERROR BOUNDARY
// Captures React render errors and surfaces them to console & optional debug log.

import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error) {
    // Update state so the next render shows fallback UI
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log to console (and optionally to your debug log component)
    console.error("[ErrorBoundary] Caught error:", error);
    console.error("[ErrorBoundary] Stack trace:", errorInfo.componentStack);

    // Update state with error info
    this.setState({ error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 bg-red-100 text-red-900 rounded-lg m-4 border border-red-500">
          <h2 className="text-xl font-bold mb-2">Something went wrong.</h2>
          {this.state.error && <p><strong>Error:</strong> {this.state.error.message}</p>}
          {this.state.errorInfo && (
            <pre className="overflow-x-auto text-sm mt-2">{this.state.errorInfo.componentStack}</pre>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
