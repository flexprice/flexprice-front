import { config } from './config';
import { SupportChatAnalyticsEvent, SupportChatProvider, SupportChatStorageKey } from '@/models/SupportChat';
import { UserActivityEvent } from '@/types/enums/dom';

/**
 * Behaviour knobs for the support-chat messenger. Tune here instead of scattering
 * literals through the hook. String fields are enum-typed so a typo is a compile
 * error rather than a silently dead analytics event.
 */
export interface SupportChatFlowConfig {
	/** Hide the provider's floating launcher; we use the header Help button and command palette. */
	hideDefaultLauncher: boolean;
	/** Idle time before auto-opening the messenger for non-onboarded tenants (ms). */
	inactivityOpenDelayMs: number;
	/** How often the Intercom adapter polls for visibility (ms). Unused by Pylon, which has native events. */
	statePollIntervalMs: number;
	activityEvents: readonly UserActivityEvent[];
	/** After idle, open the messenger if onboarding is incomplete. */
	autoOpenOnInactivity: boolean;
	/** PATCH tenant metadata when the messenger closes and onboarding was incomplete. */
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

/**
 * Total by construction: adding a provider to `SupportChatProvider` is a compile
 * error until its flow config is supplied here.
 */
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

/** True when Intercom specifically is configured. Backs the deprecated `isIntercomMessengerAvailable`. */
export function isIntercomProviderConfigured(): boolean {
	return isProviderConfigured(config.intercom.enabled, config.intercom.appId);
}

/** True when Pylon specifically is configured. */
export function isPylonProviderConfigured(): boolean {
	return isProviderConfigured(config.pylon.enabled, config.pylon.appId);
}

/**
 * Resolves the single active provider. Intercom wins when both are configured,
 * preserving pre-Pylon behaviour for any environment that later enables both.
 */
export function getActiveSupportChatProvider(): SupportChatProvider | null {
	const intercomReady = isIntercomProviderConfigured();
	const pylonReady = isPylonProviderConfigured();

	if (intercomReady && pylonReady && !config.app.isProd) {
		// A configuration mistake, not a runtime error — deliberately not routed through ErrorLoggingService.
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

/**
 * Command-palette label for the active provider. A pure env read with no side
 * effects, so it is safe to evaluate at module load in `commands.ts`.
 * Falls back to the Intercom label so the command reads identically to today
 * when no provider is configured (the command is hidden in that case anyway).
 */
export function getSupportChatCommandLabel(): string {
	const provider = getActiveSupportChatProvider();
	return SUPPORT_CHAT_COMMAND_LABEL[provider ?? SupportChatProvider.Intercom];
}
