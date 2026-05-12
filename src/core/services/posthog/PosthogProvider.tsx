import React, { ReactNode } from 'react';
import { PostHogProvider } from 'posthog-js/react';
import posthog from 'posthog-js';
import PosthogErrorBoundary from './PosthogErrorBoundary';
import { config } from '@/config';

interface Props {
	children: ReactNode;
}

if (config.posthog.enabled) {
	posthog.init(config.posthog.key, {
		api_host: config.posthog.host,
		capture_pageview: true,
	});

	posthog.sessionRecording?.startIfEnabledOrStop();
}

const PosthogWrapper: React.FC<Props> = ({ children }) => {
	if (config.posthog.enabled) {
		return (
			<PostHogProvider client={posthog}>
				<PosthogErrorBoundary>{children}</PosthogErrorBoundary>
			</PostHogProvider>
		);
	}
	return <>{children}</>;
};

export default PosthogWrapper;
