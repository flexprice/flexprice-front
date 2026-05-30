import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ConsentStatus } from '@/types/consent';
import type { User } from '@/models';

vi.mock('posthog-js', () => ({
	default: {
		opt_in_capturing: vi.fn(),
		opt_out_capturing: vi.fn(),
	},
}));

import posthog from 'posthog-js';
import { applyConsentDecision, scheduleIdle } from './consent-scripts';

const mockUser: User = {
	id: '1',
	email: 'test@example.com',
	name: 'Test User',
	tenant: {
		id: 't1',
		name: 'ACME',
		billing_details: {
			address: {
				address_line1: '',
				address_line2: '',
				address_city: '',
				address_state: '',
				address_postal_code: '',
				address_country: '',
			},
		},
		status: 'active',
		created_at: '',
		updated_at: '',
	},
};

const mockReoIdentify = vi.fn();

beforeEach(() => {
	vi.clearAllMocks();
	(window as unknown as Record<string, unknown>).Reo = { identify: mockReoIdentify };
});

afterEach(() => {
	delete (window as unknown as Record<string, unknown>).Reo;
});

describe('applyConsentDecision', () => {
	it('calls posthog.opt_in_capturing when status is Accepted', () => {
		applyConsentDecision(ConsentStatus.Accepted, mockUser);
		expect(posthog.opt_in_capturing).toHaveBeenCalledOnce();
		expect(posthog.opt_out_capturing).not.toHaveBeenCalled();
	});

	it('calls posthog.opt_out_capturing when status is Rejected', () => {
		applyConsentDecision(ConsentStatus.Rejected, mockUser);
		expect(posthog.opt_out_capturing).toHaveBeenCalledOnce();
		expect(posthog.opt_in_capturing).not.toHaveBeenCalled();
	});

	it('calls window.Reo.identify with user data when status is Accepted', () => {
		applyConsentDecision(ConsentStatus.Accepted, mockUser);
		expect(mockReoIdentify).toHaveBeenCalledWith({
			username: 'test@example.com',
			type: 'email',
			firstname: 'Test User',
			company: 'ACME',
		});
	});

	it('does not call window.Reo.identify when status is Rejected', () => {
		applyConsentDecision(ConsentStatus.Rejected, mockUser);
		expect(mockReoIdentify).not.toHaveBeenCalled();
	});

	it('does not call window.Reo.identify when user is undefined', () => {
		applyConsentDecision(ConsentStatus.Accepted, undefined);
		expect(mockReoIdentify).not.toHaveBeenCalled();
	});

	it('does not throw when window.Reo is not present', () => {
		delete (window as unknown as Record<string, unknown>).Reo;
		expect(() => applyConsentDecision(ConsentStatus.Accepted, mockUser)).not.toThrow();
	});
});

describe('scheduleIdle', () => {
	it('executes callback via requestIdleCallback when available', () => {
		const mockRIC = vi.fn((cb: IdleRequestCallback) => {
			cb({ didTimeout: false, timeRemaining: () => 50 });
			return 1;
		});
		vi.stubGlobal('requestIdleCallback', mockRIC);

		const cb = vi.fn();
		scheduleIdle(cb);

		expect(mockRIC).toHaveBeenCalledOnce();
		expect(cb).toHaveBeenCalledOnce();

		vi.unstubAllGlobals();
	});

	it('falls back to setTimeout when requestIdleCallback is unavailable', () => {
		vi.stubGlobal('requestIdleCallback', undefined);
		vi.useFakeTimers();

		const cb = vi.fn();
		scheduleIdle(cb);
		expect(cb).not.toHaveBeenCalled();

		vi.runAllTimers();
		expect(cb).toHaveBeenCalledOnce();

		vi.useRealTimers();
		vi.unstubAllGlobals();
	});
});
