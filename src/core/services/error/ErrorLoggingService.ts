import { NodeEnv } from '@/types';
import * as Sentry from '@sentry/react';
import posthog from 'posthog-js';

/**
 * ErrorLoggingService provides centralized error logging functionality
 * for the application, supporting multiple logging destinations.
 */
export class ErrorLoggingService {
	private static instance: ErrorLoggingService;
	private isProd = import.meta.env.VITE_APP_ENVIRONMENT === NodeEnv.PROD;

	private constructor() {
		// Private constructor for singleton pattern
	}

	/**
	 * Get the singleton instance of ErrorLoggingService
	 */
	public static getInstance(): ErrorLoggingService {
		if (!ErrorLoggingService.instance) {
			ErrorLoggingService.instance = new ErrorLoggingService();
		}
		return ErrorLoggingService.instance;
	}

	/**
	 * Log an error with contextual information to all configured services
	 */
	public logError(error: Error, errorInfo?: React.ErrorInfo, additionalData?: Record<string, any>): string {
		// Generate a unique error ID for tracking
		const errorId = `err_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

		// Collect browser and performance information
		const performanceData = window.performance?.timing;
		const memoryData = (window.performance as any)?.memory;

		const errorPayload = {
			message: error.message,
			name: error.name,
			stack: error.stack,
			componentStack: errorInfo?.componentStack,
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
			...additionalData,
		};

		// Log to console in development
		if (!this.isProd) {
			console.error('[ErrorLoggingService]', errorPayload);
		}

		// Log to Sentry in production
		if (this.isProd) {
			Sentry.withScope((scope) => {
				scope.setExtra('errorId', errorId);
				scope.setExtra('componentStack', errorInfo?.componentStack);

				if (additionalData) {
					Object.entries(additionalData).forEach(([key, value]) => {
						scope.setExtra(key, value);
					});
				}

				Sentry.captureException(error);
			});

			// Log to PostHog
			posthog.capture('$exception', errorPayload);
		}

		return errorId;
	}
}

// Export a singleton instance
export const errorLogger = ErrorLoggingService.getInstance();

export default errorLogger;
