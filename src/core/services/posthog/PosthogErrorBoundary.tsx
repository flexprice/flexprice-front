// src/components/ErrorBoundary.tsx
import React, { Component, ReactNode } from 'react';
import i18n from 'i18next';
import posthog from 'posthog-js';
import { config } from '@/config/config';

/** Non-standard Chromium extensions not present in lib.dom typings. */
type PerformanceWithMemory = Performance & { memory?: { usedJSHeapSize: number; totalJSHeapSize: number } };
type NavigatorWithConnection = Navigator & { connection?: { effectiveType?: string } };

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
		const memoryData = (window.performance as PerformanceWithMemory | undefined)?.memory;

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
				connection: (navigator as NavigatorWithConnection)?.connection?.effectiveType || 'unknown',
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
			reactVersion: React.version,
			env: config.app.env,
		};

		posthog.capture('$exception', errorPayload);
	}

	render() {
		if (this.state.hasError) {
			return (
				this.props.fallback || (
					<div>
						<h1>{i18n.t('chrome.posthogErrorTitle')}</h1>
						<p>{i18n.t('chrome.posthogErrorDescription')}</p>
						{this.state.errorId && (
							<p style={{ fontSize: '0.8em', color: '#888' }}>
								{i18n.t('errorPage.errorIdLabel')}: <code>{this.state.errorId}</code>
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
