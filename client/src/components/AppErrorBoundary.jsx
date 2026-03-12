import React from "react";
import { FaBug } from "react-icons/fa";
import { Button } from "@/components/ui";

class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  componentDidUpdate(prevProps) {
    if (this.state.hasError && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ hasError: false });
    }
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    // Keep console output for developer debugging.
    console.error("Unhandled UI error:", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full rounded-lg border border-red-200 bg-white p-6 shadow-sm">
            <p className="text-red-700 font-semibold flex items-center gap-2">
              <FaBug />
              Something failed on this page
            </p>
            <p className="mt-2 text-sm text-gray-600">
              Please refresh. If issue continues, contact administrator from profile support section.
            </p>
            <Button
              className="mt-4 btn-primary"
              onClick={() => this.setState({ hasError: false })}
            >
              Try Again
            </Button>
            <Button
              className="mt-4 ml-3 btn-secondary"
              onClick={() => window.location.reload()}
            >
              Reload
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default AppErrorBoundary;
