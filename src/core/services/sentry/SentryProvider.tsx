import React from 'react';
import * as Sentry from '@sentry/react';
import { config } from '@/config';

interface Props {
	children: React.ReactNode;
}

if (config.sentry.enabled) {
	Sentry.init({
		dsn: config.sentry.dsn,
		integrations: [Sentry.browserTracingIntegration()],
		tracesSampleRate: 1.0,
		replaysSessionSampleRate: 0,
		replaysOnErrorSampleRate: 0,
	});
}

const SentryProvider = ({ children }: Props) => {
	return <Sentry.ErrorBoundary fallback={<div>Something went wrong</div>}>{children}</Sentry.ErrorBoundary>;
};

export default SentryProvider;
