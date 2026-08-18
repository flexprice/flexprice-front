import { describe, expect, it } from 'vitest';
import {
	SupportChatAnalyticsEvent,
	SupportChatProvider,
	SupportChatStatus,
	SupportChatStorageKey,
	SupportChatStorageValue,
	SupportChatVisibility,
} from './SupportChat';
import { TenantMetadataFlag } from './Tenant';

describe('SupportChat enums', () => {
	it('locks the Intercom analytics event names to their pre-Pylon values', () => {
		expect(SupportChatAnalyticsEvent.IntercomOpened).toBe('intercom_messenger_opened');
		expect(SupportChatAnalyticsEvent.IntercomClosed).toBe('intercom_messenger_closed');
	});

	it('locks the Intercom storage key to its pre-Pylon value', () => {
		expect(SupportChatStorageKey.IntercomSeen).toBe('intercom_messenger_seen');
		expect(SupportChatStorageValue.Seen).toBe('true');
	});

	it('locks the tenant metadata truth value to its pre-Pylon value', () => {
		expect(TenantMetadataFlag.True).toBe('true');
	});

	it('namespaces the Pylon analytics events separately from Intercom', () => {
		expect(SupportChatAnalyticsEvent.PylonOpened).toBe('pylon_messenger_opened');
		expect(SupportChatAnalyticsEvent.PylonClosed).toBe('pylon_messenger_closed');
		expect(SupportChatStorageKey.PylonSeen).toBe('pylon_messenger_seen');
	});

	it('exposes exactly two providers', () => {
		expect(Object.values(SupportChatProvider)).toEqual(['intercom', 'pylon']);
	});

	it('models visibility and status as distinct closed sets', () => {
		expect(Object.values(SupportChatVisibility)).toEqual(['unknown', 'open', 'closed']);
		expect(Object.values(SupportChatStatus)).toEqual(['idle', 'initializing', 'ready', 'failed']);
	});
});
