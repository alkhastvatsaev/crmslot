"use client";

import React, { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  name?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    const boundaryName = this.props.name ?? "unknown";
    console.error(
      JSON.stringify({
        level: "error",
        msg: `[ErrorBoundary:${boundaryName}]`,
        error: error.message,
        stack: info.componentStack,
      })
    );
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="flex min-h-[200px] flex-col items-center justify-center gap-2 p-8 text-center text-sm text-slate-500">
            <p className="font-medium text-slate-700">Une erreur inattendue s&apos;est produite.</p>
            <button
              className="mt-2 rounded bg-slate-100 px-3 py-1 text-xs hover:bg-slate-200"
              onClick={() => this.setState({ hasError: false, error: null })}
            >
              Réessayer
            </button>
          </div>
        )
      );
    }
    return this.props.children;
  }
}
