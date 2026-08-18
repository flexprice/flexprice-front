import { config } from './config';
import { SupportChatAnalyticsEvent, SupportChatProvider, SupportChatStorageKey } from '@/models/SupportChat';
import { isValidPylonAppId } from '@/core/services/support-chat/adapters/pylon';
import { UserActivityEvent } from '@/types/enums/dom';

/** Behaviour knobs for the messenger. String fields are enum-typed so a typo is a compile error. */
export interface SupportChatFlowConfig {
	/** Hide the provider's floating launcher; we use the header Help button. */
	hideDefaultLauncher: boolean;
	/** Idle time before auto-opening the messenger for non-onboarded tenants (ms). */
	inactivityOpenDelayMs: number;
	/** Intercom visibility poll interval (ms). Unused by Pylon. */
	statePollIntervalMs: number;
	activityEvents: readonly UserActivityEvent[];
	/** After idle, open the messenger if onboarding is incomplete. */
	autoOpenOnInactivity: boolean;
	/** PATCH tenant metadata on close when onboarding was incomplete. */
	markCompletedOnClose: boolean;
	trackGtagEvents: boolean;
	persistMessengerSeenToStorage: boolean;
	gtagOpenedEvent: SupportChatAnalyticsEvent;
	gtagClosedEvent: SupportChatAnalyticsEvent;
	messengerSeenStorageKey: SupportChatStorageKey;
	toastSuccessMarkOnboarded: string;
	toastErrorMarkOnboarded: string;
}

/** ms × sec × min; idle before auto-open for non-onboarded tenants. */
const SUPPORT_CHAT_INACTIVITY_TIMEOUT_MS = 1000 * 60 * 15; // 15 minutes

/** Knobs that are identical for every provider. */
const SHARED_FLOW = {
	hideDefaultLauncher: true,
	inactivityOpenDelayMs: SUPPORT_CHAT_INACTIVITY_TIMEOUT_MS,
	statePollIntervalMs: 1000,
	activityEvents: [UserActivityEvent.MouseMove, UserActivityEvent.KeyDown, UserActivityEvent.Scroll, UserActivityEvent.TouchStart],
	autoOpenOnInactivity: true,
	markCompletedOnClose: true,
	trackGtagEvents: true,
	persistMessengerSeenToStorage: true,
	toastSuccessMarkOnboarded: "Welcome! You've been marked as onboarded.",
	toastErrorMarkOnboarded: 'Failed to update onboarding status. Please try again.',
} satisfies Partial<SupportChatFlowConfig>;

/** Total by construction: a new provider will not compile until its config is added here. */
export const SUPPORT_CHAT_FLOW: Record<SupportChatProvider, SupportChatFlowConfig> = {
	[SupportChatProvider.Intercom]: {
		...SHARED_FLOW,
		gtagOpenedEvent: SupportChatAnalyticsEvent.IntercomOpened,
		gtagClosedEvent: SupportChatAnalyticsEvent.IntercomClosed,
		messengerSeenStorageKey: SupportChatStorageKey.IntercomSeen,
	},
	[SupportChatProvider.Pylon]: {
		...SHARED_FLOW,
		gtagOpenedEvent: SupportChatAnalyticsEvent.PylonOpened,
		gtagClosedEvent: SupportChatAnalyticsEvent.PylonClosed,
		messengerSeenStorageKey: SupportChatStorageKey.PylonSeen,
	},
};

function isProviderConfigured(enabled: boolean, appId: string): boolean {
	return enabled && appId.trim().length > 0;
}

/** True when Intercom specifically is configured. */
export function isIntercomProviderConfigured(): boolean {
	return isProviderConfigured(config.intercom.enabled, config.intercom.appId);
}

/** True when Pylon specifically is configured, with an app id `init()` will accept. */
export function isPylonProviderConfigured(): boolean {
	return isProviderConfigured(config.pylon.enabled, config.pylon.appId) && isValidPylonAppId(config.pylon.appId);
}

/** Resolves the active provider. Intercom wins when both are configured, preserving pre-Pylon behaviour. */
export function getActiveSupportChatProvider(): SupportChatProvider | null {
	const intercomReady = isIntercomProviderConfigured();
	const pylonReady = isPylonProviderConfigured();

	if (intercomReady && pylonReady && !config.app.isProd) {
		// A config mistake, not a runtime error, so deliberately not routed through ErrorLoggingService.
		console.warn(
			'[support-chat] Intercom and Pylon are both enabled. Using Intercom and ignoring Pylon. Set VITE_INTERCOM_ENABLED=false to use Pylon.',
		);
	}

	if (intercomReady) return SupportChatProvider.Intercom;
	if (pylonReady) return SupportChatProvider.Pylon;
	return null;
}

/** True when any provider is active. Used by CommandPalette to gate the chat command. */
export function isSupportChatAvailable(): boolean {
	return getActiveSupportChatProvider() !== null;
}

const SUPPORT_CHAT_COMMAND_LABEL: Record<SupportChatProvider, string> = {
	[SupportChatProvider.Intercom]: 'Open Intercom',
	[SupportChatProvider.Pylon]: 'Open Pylon',
};

/** Command-palette label for the active provider. A pure env read, safe at module load. */
export function getSupportChatCommandLabel(): string {
	const provider = getActiveSupportChatProvider();
	return SUPPORT_CHAT_COMMAND_LABEL[provider ?? SupportChatProvider.Intercom];
}
