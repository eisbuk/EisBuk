import { captureException } from "@sentry/react";
import React, { ReactNode, ReactElement } from "react";

/**
 * Type interface for ErrorBoundary props.
 */
interface ErrorBoundaryProps {
  fallback: ReactElement;
  children: () => ReactNode;
  resetKeys: any[];
}

/**
 * Type interface for ErrorBoundary state.
 */
interface ErrorBoundaryState {
  hasError: boolean;
}

/**
 * ErrorBoundary component definition.
 */
class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  /**
   * ErrorBoundary constructor.
   * @param {ErrorBoundaryProps} props - Component props.
   */
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  /**
   * Lifecyle method to catch errors and set state.
   */
  static getDerivedStateFromError() {
    return { hasError: true };
  }

  /**
   * Lifecycle method to catch errors and log them.
   * @param {Error} error - Error object caught by ErrorBoundary.
   */
  componentDidCatch(error: Error) {
    captureException(error);
  }

  /**
   * Lifecycle method that updates on prop changes.
   * @param {ErrorBoundaryProps} prevProps - Previous props of the component.
   */
  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    if (
      JSON.stringify(this.props.resetKeys) !==
      JSON.stringify(prevProps.resetKeys)
    ) {
      this.setState({ hasError: false });
    }
  }

  /**
   * Render method of ErrorBoundary.
   */
  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }

    return this.props.children();
  }
}

export default ErrorBoundary;
