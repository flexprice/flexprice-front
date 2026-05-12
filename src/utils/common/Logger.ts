import { NODE_ENV, NodeEnv } from '@/types';

export enum LogLevel {
	INFO = 'info',
	WARN = 'warn',
	ERROR = 'error',
	DEBUG = 'debug',
}

interface LoggerConfig {
	enabledEnvironments: NodeEnv[];
	showTimestamp?: boolean;
	showLogLevel?: boolean;
}

class Logger {
	private static instance: Logger;
	private config: LoggerConfig;
	private isEnabled: boolean;

	private constructor(
		config: LoggerConfig = {
			enabledEnvironments: [NodeEnv.LOCAL, NodeEnv.DEV, NodeEnv.PROD],
			showTimestamp: true,
			showLogLevel: true,
		},
	) {
		this.config = config;
		this.isEnabled = this.checkIfEnabled();
	}

	public static getInstance(config?: LoggerConfig): Logger {
		if (!Logger.instance) {
			Logger.instance = new Logger(config);
		}
		return Logger.instance;
	}

	private checkIfEnabled(): boolean {
		return this.config.enabledEnvironments.includes(NODE_ENV);
	}

	private formatMessage(level: LogLevel, ...args: unknown[]): string {
		const parts: string[] = [];

		if (this.config.showTimestamp) {
			parts.push(`[${new Date().toISOString()}]`);
		}

		if (this.config.showLogLevel) {
			parts.push(`[${level.toUpperCase()}]`);
		}

		parts.push(...args.map((arg) => (typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg))));

		return parts.join(' ');
	}

	public info(...args: unknown[]): void {
		if (this.isEnabled) {
			console.info(this.formatMessage(LogLevel.INFO, ...args));
		}
	}

	public warn(...args: unknown[]): void {
		if (this.isEnabled) {
			console.warn(this.formatMessage(LogLevel.WARN, ...args));
		}
	}

	public error(...args: unknown[]): void {
		console.error(this.formatMessage(LogLevel.ERROR, ...args));
	}

	public debug(...args: unknown[]): void {
		if (this.isEnabled) {
			console.debug(this.formatMessage(LogLevel.DEBUG, ...args));
		}
	}

	public setConfig(newConfig: Partial<LoggerConfig>): void {
		this.config = { ...this.config, ...newConfig };
		this.isEnabled = this.checkIfEnabled();
	}
}

// Singleton export
export const logger = Logger.getInstance();

// Export class for custom use
export { Logger };
