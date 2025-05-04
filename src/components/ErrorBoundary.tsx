import React from 'react';
import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <h1>Something went wrong.</h1>
          <p>Please refresh the page or contact support.</p>
          {this.state.error && (
            <details>
              <summary>Error Details</summary>
              <pre>{this.state.error.toString()}</pre>
            </details>
          )}
        </div>
      );
    }

    return React.createElement(React.Fragment, null, this.props.children);
  }
}

export default ErrorBoundary;
