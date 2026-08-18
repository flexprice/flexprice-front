/** Support-chat providers the dashboard can render. Exactly one is active per environment. */
export enum SupportChatProvider {
	Intercom = 'intercom',
	Pylon = 'pylon',
}

/** Messenger open/close state as observed by the hook. `Unknown` until the first event. */
export enum SupportChatVisibility {
	Unknown = 'unknown',
	Open = 'open',
	Closed = 'closed',
}

/** Adapter initialisation lifecycle. `show()` is a no-op unless `Ready`. */
export enum SupportChatStatus {
	Idle = 'idle',
	Initializing = 'initializing',
	Ready = 'ready',
	Failed = 'failed',
}

/** gtag event names. The Intercom values are pre-existing and MUST NOT change. */
export enum SupportChatAnalyticsEvent {
	IntercomOpened = 'intercom_messenger_opened',
	IntercomClosed = 'intercom_messenger_closed',
	PylonOpened = 'pylon_messenger_opened',
	PylonClosed = 'pylon_messenger_closed',
}

/** localStorage keys. The Intercom value is pre-existing and MUST NOT change. */
export enum SupportChatStorageKey {
	IntercomSeen = 'intercom_messenger_seen',
	PylonSeen = 'pylon_messenger_seen',
}

/** The only value ever written under a `SupportChatStorageKey`. */
export enum SupportChatStorageValue {
	Seen = 'true',
}
