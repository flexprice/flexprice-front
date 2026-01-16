// src/SentryProvider.tsx
import React from 'react';
import * as Sentry from '@sentry/react';
import { IS_PROD } from '@/types';

interface Props {
	children: React.ReactNode;
}

if (IS_PROD) {
	Sentry.init({
		dsn: import.meta.env.VITE_APP_PUBLIC_SENTRY_DSN,
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
