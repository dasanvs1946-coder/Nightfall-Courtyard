import React from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    return {
      hasError: true,
      message:
        error instanceof Error ? error.message : 'An unexpected error occurred.',
    };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#070a10] p-6 text-center">
          <div className="max-w-md rounded-2xl border border-rose-700/60 bg-slate-900 p-6 shadow-2xl">
            <h1 className="font-display text-2xl font-bold text-white uppercase">
              Something Went Wrong
            </h1>
            <p className="mt-2 break-words text-xs text-slate-300">
              {this.state.message}
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-4 min-h-[42px] cursor-pointer rounded-xl bg-amber-500 px-5 py-2 text-xs font-bold tracking-wider text-slate-950 uppercase hover:bg-amber-400"
            >
              Reload Courtyard
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
