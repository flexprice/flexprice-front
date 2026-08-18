import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SupportChatProvider } from '@/models/SupportChat';

describe('deprecated intercom config shim', () => {
	beforeEach(() => {
		vi.resetModules();
		// Vite loads a local .env during tests, so pin a baseline. Individual tests stub over these.
		vi.stubEnv('VITE_APP_ENV', 'development');
		vi.stubEnv('VITE_INTERCOM_ENABLED', 'false');
		vi.stubEnv('VITE_INTERCOM_APP_ID', '');
		vi.stubEnv('VITE_APP_INTERCOM_APP_ID', '');
		vi.stubEnv('VITE_PYLON_ENABLED', 'false');
		vi.stubEnv('VITE_PYLON_APP_ID', '');
	});

	afterEach(() => {
		vi.unstubAllEnvs();
	});

	it('still reports availability for a configured Intercom', async () => {
		vi.stubEnv('VITE_INTERCOM_ENABLED', 'true');
		vi.stubEnv('VITE_INTERCOM_APP_ID', 'abc123');
		const { isIntercomMessengerAvailable } = await import('./intercom');

		expect(isIntercomMessengerAvailable()).toBe(true);
	});

	it('keeps its original meaning: Pylon being active does NOT make Intercom available', async () => {
		vi.stubEnv('VITE_PYLON_ENABLED', 'true');
		vi.stubEnv('VITE_PYLON_APP_ID', 'pylon-app-1');
		const { isIntercomMessengerAvailable } = await import('./intercom');

		expect(isIntercomMessengerAvailable()).toBe(false);
	});

	it('re-exports the Intercom flow config unchanged', async () => {
		const { INTERCOM_MESSENGER_FLOW } = await import('./intercom');
		const { SUPPORT_CHAT_FLOW } = await import('./support-chat');

		expect(INTERCOM_MESSENGER_FLOW).toBe(SUPPORT_CHAT_FLOW[SupportChatProvider.Intercom]);
		expect(INTERCOM_MESSENGER_FLOW.gtagOpenedEvent).toBe('intercom_messenger_opened');
		expect(INTERCOM_MESSENGER_FLOW.messengerSeenStorageKey).toBe('intercom_messenger_seen');
	});
});
