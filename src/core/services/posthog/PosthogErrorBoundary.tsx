// src/components/ErrorBoundary.tsx
import React, { Component, ReactNode } from 'react';
import posthog from 'posthog-js';

interface Props {
	children: ReactNode;
	fallback?: ReactNode;
}

interface State {
	hasError: boolean;
	errorId: string | null;
}

class PosthogErrorBoundary extends Component<Props, State> {
	state: State = {
		hasError: false,
		errorId: null,
	};

	componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
		const errorId = `err_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

		this.setState({ hasError: true, errorId });

		const performanceData = window.performance?.timing;
		const memoryData = (window.performance as any)?.memory;

		const errorPayload = {
			event_type: '$exception',
			message: error.message,
			name: error.name,
			stack: error.stack,
			componentStack: errorInfo.componentStack,
			url: window.location.href,
			userAgent: navigator.userAgent,
			timestamp: new Date().toISOString(),
			errorId,
			network: {
				online: navigator.onLine,
				connection: (navigator as any)?.connection?.effectiveType || 'unknown',
			},
			performance: {
				loadTime: performanceData ? performanceData.loadEventEnd - performanceData.navigationStart : undefined,
			},
			memory: memoryData
				? {
						jsHeapUsedSize: memoryData.usedJSHeapSize,
						jsHeapTotalSize: memoryData.totalJSHeapSize,
					}
				: undefined,
			framework: 'React',
			reactVersion: (React as any).version,
			env: import.meta.env.VITE_APP_ENVIRONMENT || 'unknown',
		};

		posthog.capture('$exception', errorPayload);
	}

	render() {
		if (this.state.hasError) {
			return (
				this.props.fallback || (
					<div>
						<h1>Something went wrong.</h1>
						<p>Please refresh or try again later.</p>
						{this.state.errorId && (
							<p style={{ fontSize: '0.8em', color: '#888' }}>
								Error ID: <code>{this.state.errorId}</code>
							</p>
						)}
					</div>
				)
			);
		}

		return this.props.children;
	}
}

export default PosthogErrorBoundary;
