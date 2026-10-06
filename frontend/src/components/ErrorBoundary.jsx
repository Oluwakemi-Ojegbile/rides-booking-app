import { Component } from "react";

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="page-panel" role="alert">
          <p className="eyebrow orange-text">Something went wrong</p>
          <h1>Unable to display this page</h1>
          <p className="muted">Refresh the page to try again.</p>
        </main>
      );
    }
    return this.props.children;
  }
}
