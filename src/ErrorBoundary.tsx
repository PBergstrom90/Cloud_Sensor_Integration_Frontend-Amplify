import React from "react";
class ErrorBoundary extends React.Component<React.PropsWithChildren<{}>, { hasError: boolean }> {
  constructor(props: React.PropsWithChildren<{}>) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error: Error) {
    // Update state to display fallback UI
    console.error("Error caught by ErrorBoundary:", error);
    return { hasError: true };
  }
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error details
    console.error("ErrorBoundary logged error:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      // Render fallback UI when an error is caught
      return (
        <div style={{ textAlign: "center", padding: "20px" }}>
          <h1>Something went wrong.</h1>
          <button onClick={() => window.location.reload()}>Reload</button>
        </div>
      );
    }
    // Render children if no error is caught
    return this.props.children;
  }
}
export default ErrorBoundary;