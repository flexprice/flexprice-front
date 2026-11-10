import { config } from '@/config/config';
import posthog from 'posthog-js';

/** Non-standard Chromium extensions not present in lib.dom typings. */
type PerformanceWithMemory = Performance & { memory?: { usedJSHeapSize: number; totalJSHeapSize: number } };
type NavigatorWithConnection = Navigator & { connection?: { effectiveType?: string } };

/**
 * ErrorLoggingService provides centralized error logging functionality
 * for the application, supporting multiple logging destinations.
 */
export class ErrorLoggingService {
	private static instance: ErrorLoggingService;
	private get isProd() {
		return config.app.isProd;
	}

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
	public logError(error: Error, errorInfo?: React.ErrorInfo, additionalData?: Record<string, unknown>): string {
		// Generate a unique error ID for tracking
		const errorId = `err_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

		// Collect browser and performance information
		const performanceData = window.performance?.timing;
		const memoryData = (window.performance as PerformanceWithMemory | undefined)?.memory;

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
			...additionalData,
		};

		// Log to console in development
		if (!this.isProd) {
			console.error('[ErrorLoggingService]', errorPayload);
		}

		// Log to PostHog in production
		if (this.isProd) {
			posthog.capture('$exception', errorPayload);
		}

		return errorId;
	}
}

// Export a singleton instance
export const errorLogger = ErrorLoggingService.getInstance();

export default errorLogger;
