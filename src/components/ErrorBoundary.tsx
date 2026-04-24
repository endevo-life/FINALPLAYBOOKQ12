import { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";
import "./ErrorBoundary.css";

interface Props { children: ReactNode; }
interface State { hasError: boolean; message: string; }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: "" };

  static getDerivedStateFromError(err: Error): State {
    return { hasError: true, message: err.message };
  }

  componentDidCatch(err: Error, info: ErrorInfo) {
    console.error("[ErrorBoundary]", err, info);
  }

  private handleReload = () => {
    this.setState({ hasError: false, message: "" });
    window.location.href = "/";
  };

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className="error-fallback">
        <div className="error-fallback__card">
          <h1>Something went off-plan.</h1>
          <p>We hit an unexpected error. Head back and try again.</p>
          {this.state.message && (
            <code className="error-fallback__detail">{this.state.message}</code>
          )}
          <button className="error-fallback__btn" onClick={this.handleReload}>
            Return to start
          </button>
        </div>
      </div>
    );
  }
}
