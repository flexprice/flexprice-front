// src/PosthogProvider.tsx
import React, { ReactNode } from 'react';
import { PostHogProvider } from 'posthog-js/react';
import posthog from 'posthog-js';
import PosthogErrorBoundary from './PosthogErrorBoundary';
import { IS_PROD } from '@/types';

interface Props {
	children: ReactNode;
}

const isProd = IS_PROD;

if (isProd) {
	posthog.init(import.meta.env.VITE_APP_PUBLIC_POSTHOG_KEY!, {
		api_host: import.meta.env.VITE_APP_PUBLIC_POSTHOG_HOST,
		capture_pageview: true,
	});

	// Safely start session recording
	posthog.sessionRecording?.startIfEnabledOrStop();
}

const PosthogWrapper: React.FC<Props> = ({ children }) => {
	if (isProd) {
		return (
			<PostHogProvider client={posthog}>
				<PosthogErrorBoundary>{children}</PosthogErrorBoundary>
			</PostHogProvider>
		);
	}
	return <>{children}</>;
};

export default PosthogWrapper;
