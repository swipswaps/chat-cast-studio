// File: src/components/ErrorBoundary.tsx
// PRF-COMPLIANT FULL VERSION
// Purpose: Capture React render errors and display a user-friendly message.
// Logs full error + stack trace to console for developer inspection.

import React from "react";

interface ErrorBoundaryState {
  hasError: boolean;
  error: any; // Using `any` for flexibility across error types
}

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  // Triggered when a child component throws an error
  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  // Additional logging (e.g., stack trace)
  componentDidCatch(error: any, info: any) {
    console.error("Caught error in ErrorBoundary:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-red-100 text-red-800 rounded">
          <h2>⚠️ An error occurred:</h2>
          <pre>{String(this.state.error)}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}
