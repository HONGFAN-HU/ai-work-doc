import { Component, type ReactNode } from 'react';

interface ErrorBoundaryState {
  error: Error | null;
}

export class ErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="error-state">
          <div style={{ textAlign: 'center', maxWidth: 600 }}>
            <h2>Rendering Error</h2>
            <pre style={{
              background: '#f8f9fa',
              padding: 16,
              borderRadius: 6,
              overflow: 'auto',
              maxHeight: 400,
              textAlign: 'left',
              fontSize: 13,
              color: '#dc3545',
            }}>
              {this.state.error.message}
              {'\n\n'}
              {this.state.error.stack}
            </pre>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
