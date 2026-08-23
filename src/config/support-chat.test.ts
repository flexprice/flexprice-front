import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SupportChatProvider } from '@/models/SupportChat';

describe('support chat config', () => {
	beforeEach(() => {
		vi.resetModules();
		// Vite loads a local .env during tests, so pin a baseline. Individual tests stub over these.
		vi.stubEnv('VITE_APP_ENV', 'development');
		vi.stubEnv('VITE_INTERCOM_ENABLED', 'false');
		vi.stubEnv('VITE_INTERCOM_APP_ID', '');
		vi.stubEnv('VITE_APP_INTERCOM_APP_ID', '');
		vi.stubEnv('VITE_PYLON_ENABLED', 'false');
		vi.stubEnv('VITE_PYLON_APP_ID', '');
		vi.stubEnv('VITE_PYLON_IDENTITY_VERIFICATION_ENABLED', 'false');
	});

	afterEach(() => {
		vi.unstubAllEnvs();
		vi.restoreAllMocks();
	});

	it('returns no provider when neither is enabled', async () => {
		const { getActiveSupportChatProvider, isSupportChatAvailable } = await import('./support-chat');

		expect(getActiveSupportChatProvider()).toBeNull();
		expect(isSupportChatAvailable()).toBe(false);
	});

	it('returns Intercom when only Intercom is configured', async () => {
		vi.stubEnv('VITE_INTERCOM_ENABLED', 'true');
		vi.stubEnv('VITE_INTERCOM_APP_ID', 'abc123');
		const { getActiveSupportChatProvider, isSupportChatAvailable } = await import('./support-chat');

		expect(getActiveSupportChatProvider()).toBe(SupportChatProvider.Intercom);
		expect(isSupportChatAvailable()).toBe(true);
	});

	it('returns Pylon when only Pylon is configured', async () => {
		vi.stubEnv('VITE_PYLON_ENABLED', 'true');
		vi.stubEnv('VITE_PYLON_APP_ID', 'pylon-app-1');
		const { getActiveSupportChatProvider } = await import('./support-chat');

		expect(getActiveSupportChatProvider()).toBe(SupportChatProvider.Pylon);
	});

	it('defaults Pylon identity verification to off', async () => {
		const { config } = await import('./config');

		expect(config.pylon.identityVerificationEnabled).toBe(false);
	});

	it('enables Pylon identity verification only when the env flag is true', async () => {
		vi.stubEnv('VITE_PYLON_IDENTITY_VERIFICATION_ENABLED', 'true');
		const { config } = await import('./config');

		expect(config.pylon.identityVerificationEnabled).toBe(true);
	});

	it('treats a malformed Pylon app id as unconfigured, so no dead button renders', async () => {
		vi.stubEnv('VITE_PYLON_ENABLED', 'true');
		vi.stubEnv('VITE_PYLON_APP_ID', 'app-123/../evil');
		const { getActiveSupportChatProvider, isPylonProviderConfigured } = await import('./support-chat');

		expect(isPylonProviderConfigured()).toBe(false);
		expect(getActiveSupportChatProvider()).toBeNull();
	});

	it('prefers Intercom and warns when both are configured', async () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
		vi.stubEnv('VITE_INTERCOM_ENABLED', 'true');
		vi.stubEnv('VITE_INTERCOM_APP_ID', 'abc123');
		vi.stubEnv('VITE_PYLON_ENABLED', 'true');
		vi.stubEnv('VITE_PYLON_APP_ID', 'pylon-app-1');
		const { getActiveSupportChatProvider } = await import('./support-chat');

		expect(getActiveSupportChatProvider()).toBe(SupportChatProvider.Intercom);
		expect(warn).toHaveBeenCalledOnce();
		expect(warn.mock.calls[0][0]).toContain('Pylon');
	});

	it('treats an enabled provider with a blank app id as unavailable', async () => {
		vi.stubEnv('VITE_INTERCOM_ENABLED', 'true');
		vi.stubEnv('VITE_INTERCOM_APP_ID', '   ');
		const { getActiveSupportChatProvider } = await import('./support-chat');

		expect(getActiveSupportChatProvider()).toBeNull();
	});

	it('falls back to Pylon when Intercom is enabled but has a blank app id', async () => {
		vi.stubEnv('VITE_INTERCOM_ENABLED', 'true');
		vi.stubEnv('VITE_INTERCOM_APP_ID', '');
		vi.stubEnv('VITE_PYLON_ENABLED', 'true');
		vi.stubEnv('VITE_PYLON_APP_ID', 'pylon-app-1');
		const { getActiveSupportChatProvider } = await import('./support-chat');

		expect(getActiveSupportChatProvider()).toBe(SupportChatProvider.Pylon);
	});

	it('reports Intercom specifically for the backward-compatible predicate', async () => {
		vi.stubEnv('VITE_PYLON_ENABLED', 'true');
		vi.stubEnv('VITE_PYLON_APP_ID', 'pylon-app-1');
		const { isIntercomProviderConfigured, isSupportChatAvailable } = await import('./support-chat');

		expect(isSupportChatAvailable()).toBe(true);
		expect(isIntercomProviderConfigured()).toBe(false);
	});

	it('labels the command palette entry for the active provider', async () => {
		vi.stubEnv('VITE_PYLON_ENABLED', 'true');
		vi.stubEnv('VITE_PYLON_APP_ID', 'pylon-app-1');
		const { getSupportChatCommandLabel } = await import('./support-chat');

		expect(getSupportChatCommandLabel()).toBe('Open Pylon');
	});

	it('labels the command palette entry "Open Intercom" when no provider is active', async () => {
		const { getSupportChatCommandLabel } = await import('./support-chat');

		expect(getSupportChatCommandLabel()).toBe('Open Intercom');
	});

	it('keeps the Intercom flow config identical to the pre-Pylon defaults', async () => {
		const { SUPPORT_CHAT_FLOW } = await import('./support-chat');
		const flow = SUPPORT_CHAT_FLOW[SupportChatProvider.Intercom];

		expect(flow.hideDefaultLauncher).toBe(true);
		expect(flow.inactivityOpenDelayMs).toBe(1000 * 60 * 15);
		expect(flow.statePollIntervalMs).toBe(1000);
		expect(flow.activityEvents).toEqual(['mousemove', 'keydown', 'scroll', 'touchstart']);
		expect(flow.autoOpenOnInactivity).toBe(true);
		expect(flow.markCompletedOnClose).toBe(true);
		expect(flow.trackGtagEvents).toBe(true);
		expect(flow.persistMessengerSeenToStorage).toBe(true);
		expect(flow.gtagOpenedEvent).toBe('intercom_messenger_opened');
		expect(flow.gtagClosedEvent).toBe('intercom_messenger_closed');
		expect(flow.messengerSeenStorageKey).toBe('intercom_messenger_seen');
		expect(flow.toastSuccessMarkOnboarded).toBe("Welcome! You've been marked as onboarded.");
		expect(flow.toastErrorMarkOnboarded).toBe('Failed to update onboarding status. Please try again.');
	});

	it('gives Pylon its own analytics events and storage key but the same behaviour knobs', async () => {
		const { SUPPORT_CHAT_FLOW } = await import('./support-chat');
		const intercom = SUPPORT_CHAT_FLOW[SupportChatProvider.Intercom];
		const pylon = SUPPORT_CHAT_FLOW[SupportChatProvider.Pylon];

		expect(pylon.gtagOpenedEvent).toBe('pylon_messenger_opened');
		expect(pylon.gtagClosedEvent).toBe('pylon_messenger_closed');
		expect(pylon.messengerSeenStorageKey).toBe('pylon_messenger_seen');
		expect(pylon.inactivityOpenDelayMs).toBe(intercom.inactivityOpenDelayMs);
		expect(pylon.autoOpenOnInactivity).toBe(intercom.autoOpenOnInactivity);
		expect(pylon.markCompletedOnClose).toBe(intercom.markCompletedOnClose);
	});
});
