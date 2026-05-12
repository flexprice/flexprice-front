import { config } from './config';

/** True when Intercom should load: `config.intercom.enabled` and non-empty `config.intercom.appId` from env (`VITE_INTERCOM_*` in config.ts). */
export function isIntercomMessengerAvailable(): boolean {
	return config.intercom.enabled && config.intercom.appId.trim().length > 0;
}

export interface IntercomMessengerFlowConfig {
	/** Hide Intercom's floating launcher; we use the header Help button and command palette. */
	hideDefaultLauncher: boolean;
	/** Idle time before auto-opening the messenger for non-onboarded tenants (ms). */
	inactivityOpenDelayMs: number;
	/** How often we poll `Intercom('isVisible')` to sync open/close handlers (ms). */
	statePollIntervalMs: number;
	activityEvents: readonly string[];
	/** After idle, open messenger if onboarding is incomplete. */
	autoOpenOnInactivity: boolean;
	/** PATCH tenant metadata when messenger closes and onboarding was incomplete. */
	markCompletedOnClose: boolean;
	trackGtagEvents: boolean;
	persistMessengerSeenToStorage: boolean;
	gtagOpenedEvent: string;
	gtagClosedEvent: string;
	messengerSeenStorageKey: string;
	toastSuccessMarkOnboarded: string;
	toastErrorMarkOnboarded: string;
}

/** Formerly `INACTIVITY_TIMEOUT` in IntercomMessenger: ms × sec × min; idle before auto-open for non-onboarded tenants. */
const INTERCOM_INACTIVITY_TIMEOUT_MS = 1000 * 60 * 15; // 15 minutes

/** Defaults for Intercom messenger UX — tune here instead of scattering literals in the component. */
export const INTERCOM_MESSENGER_FLOW: IntercomMessengerFlowConfig = {
	hideDefaultLauncher: true,
	inactivityOpenDelayMs: INTERCOM_INACTIVITY_TIMEOUT_MS,
	statePollIntervalMs: 1000,
	activityEvents: ['mousemove', 'keydown', 'scroll', 'touchstart'],
	autoOpenOnInactivity: true,
	markCompletedOnClose: true,
	trackGtagEvents: true,
	persistMessengerSeenToStorage: true,
	gtagOpenedEvent: 'intercom_messenger_opened',
	gtagClosedEvent: 'intercom_messenger_closed',
	messengerSeenStorageKey: 'intercom_messenger_seen',
	toastSuccessMarkOnboarded: "Welcome! You've been marked as onboarded.",
	toastErrorMarkOnboarded: 'Failed to update onboarding status. Please try again.',
};
