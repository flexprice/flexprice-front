import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { ConsentStatus, CONSENT_VERSION } from '@/types/consent';
import type { User } from '@/models';

// Mock dependencies before importing the hook
vi.mock('@/hooks/useUser', () => ({ default: vi.fn() }));
vi.mock('@/api/UserApi', () => ({ UserApi: { updateMe: vi.fn() } }));
vi.mock('@/lib/consent-scripts', () => ({
	applyConsentDecision: vi.fn(),
	scheduleIdle: vi.fn((cb: () => void) => cb()), // execute synchronously in tests
}));

import useUser from '@/hooks/useUser';
import { UserApi } from '@/api/UserApi';
import { applyConsentDecision } from '@/lib/consent-scripts';
import useCookieConsent from './useCookieConsent';

const mockUser: User = {
	id: '1',
	email: 'user@example.com',
	name: 'Test',
	tenant: {
		id: 't1',
		name: 'ACME',
		billing_details: {
			address: { address_line1: '', address_line2: '', address_city: '', address_state: '', address_postal_code: '', address_country: '' },
		},
		status: 'active',
		created_at: '',
		updated_at: '',
	},
};

function mockUseUser(overrides: Partial<ReturnType<typeof useUser>> = {}) {
	vi.mocked(useUser).mockReturnValue({
		user: undefined,
		loading: false,
		error: null,
		refetch: vi.fn(),
		...overrides,
	});
}

beforeEach(() => {
	vi.clearAllMocks();
	localStorage.clear();
});

describe('useCookieConsent', () => {
	describe('showBanner', () => {
		it('is false while user is loading', () => {
			mockUseUser({ user: undefined, loading: true });
			const { result } = renderHook(() => useCookieConsent());
			expect(result.current.showBanner).toBe(false);
		});

		it('is false when user is not yet loaded', () => {
			mockUseUser({ user: undefined, loading: false });
			const { result } = renderHook(() => useCookieConsent());
			expect(result.current.showBanner).toBe(false);
		});

		it('is true when user is loaded and has no consent in metadata or cache', () => {
			mockUseUser({ user: mockUser, loading: false });
			const { result } = renderHook(() => useCookieConsent());
			expect(result.current.showBanner).toBe(true);
		});

		it('is false when user metadata has consent_status', () => {
			const userWithConsent: User = {
				...mockUser,
				metadata: { consent_status: ConsentStatus.Accepted, consent_version: CONSENT_VERSION, consent_at: '2025-01-01T00:00:00.000Z' },
			};
			mockUseUser({ user: userWithConsent, loading: false });
			const { result } = renderHook(() => useCookieConsent());
			expect(result.current.showBanner).toBe(false);
		});

		it('is false when localStorage cache has consent', () => {
			localStorage.setItem(
				'fp_consent',
				JSON.stringify({
					status: ConsentStatus.Accepted,
					version: CONSENT_VERSION,
					cachedAt: new Date().toISOString(),
				}),
			);
			mockUseUser({ user: mockUser, loading: false });
			const { result } = renderHook(() => useCookieConsent());
			expect(result.current.showBanner).toBe(false);
		});
	});

	describe('load restore', () => {
		it('calls applyConsentDecision with Rejected when backend has rejected consent', async () => {
			const userWithRejected: User = {
				...mockUser,
				metadata: { consent_status: ConsentStatus.Rejected, consent_version: CONSENT_VERSION, consent_at: '2025-01-01T00:00:00.000Z' },
			};
			mockUseUser({ user: userWithRejected, loading: false });
			renderHook(() => useCookieConsent());
			await waitFor(() => {
				expect(applyConsentDecision).toHaveBeenCalledWith(ConsentStatus.Rejected, userWithRejected);
			});
		});

		it('does not call applyConsentDecision when backend has accepted consent', async () => {
			const userWithAccepted: User = {
				...mockUser,
				metadata: { consent_status: ConsentStatus.Accepted, consent_version: CONSENT_VERSION, consent_at: '2025-01-01T00:00:00.000Z' },
			};
			mockUseUser({ user: userWithAccepted, loading: false });
			renderHook(() => useCookieConsent());
			await waitFor(() => {
				expect(applyConsentDecision).not.toHaveBeenCalled();
			});
		});
	});

	describe('accept()', () => {
		it('hides the banner immediately (optimistic update)', async () => {
			vi.mocked(UserApi.updateMe).mockResolvedValue(mockUser);
			mockUseUser({ user: mockUser, loading: false });
			const { result } = renderHook(() => useCookieConsent());

			expect(result.current.showBanner).toBe(true);
			await act(async () => {
				await result.current.accept();
			});
			expect(result.current.showBanner).toBe(false);
		});

		it('sets consentState to Accepted', async () => {
			vi.mocked(UserApi.updateMe).mockResolvedValue(mockUser);
			mockUseUser({ user: mockUser, loading: false });
			const { result } = renderHook(() => useCookieConsent());

			await act(async () => {
				await result.current.accept();
			});
			expect(result.current.consentState.status).toBe(ConsentStatus.Accepted);
		});

		it('calls applyConsentDecision with Accepted', async () => {
			vi.mocked(UserApi.updateMe).mockResolvedValue(mockUser);
			mockUseUser({ user: mockUser, loading: false });
			const { result } = renderHook(() => useCookieConsent());

			await act(async () => {
				await result.current.accept();
			});
			expect(applyConsentDecision).toHaveBeenCalledWith(ConsentStatus.Accepted, mockUser);
		});

		it('calls UserApi.updateMe with correct metadata keys', async () => {
			vi.mocked(UserApi.updateMe).mockResolvedValue(mockUser);
			mockUseUser({ user: mockUser, loading: false });
			const { result } = renderHook(() => useCookieConsent());

			await act(async () => {
				await result.current.accept();
			});
			expect(UserApi.updateMe).toHaveBeenCalledWith(
				expect.objectContaining({
					metadata: expect.objectContaining({
						consent_status: ConsentStatus.Accepted,
						consent_version: CONSENT_VERSION,
					}),
				}),
			);
		});

		it('rolls back state on API error', async () => {
			vi.mocked(UserApi.updateMe).mockRejectedValue(new Error('Network error'));
			mockUseUser({ user: mockUser, loading: false });
			const { result } = renderHook(() => useCookieConsent());

			await act(async () => {
				await result.current.accept();
			});
			expect(result.current.consentState.status).toBe(null);
			expect(result.current.showBanner).toBe(true);
		});
	});

	describe('reject()', () => {
		it('sets consentState to Rejected', async () => {
			vi.mocked(UserApi.updateMe).mockResolvedValue(mockUser);
			mockUseUser({ user: mockUser, loading: false });
			const { result } = renderHook(() => useCookieConsent());

			await act(async () => {
				await result.current.reject();
			});
			expect(result.current.consentState.status).toBe(ConsentStatus.Rejected);
		});

		it('calls applyConsentDecision with Rejected', async () => {
			vi.mocked(UserApi.updateMe).mockResolvedValue(mockUser);
			mockUseUser({ user: mockUser, loading: false });
			const { result } = renderHook(() => useCookieConsent());

			await act(async () => {
				await result.current.reject();
			});
			expect(applyConsentDecision).toHaveBeenCalledWith(ConsentStatus.Rejected, mockUser);
		});

		it('rolls back state on API error', async () => {
			vi.mocked(UserApi.updateMe).mockRejectedValue(new Error('Network error'));
			mockUseUser({ user: mockUser, loading: false });
			const { result } = renderHook(() => useCookieConsent());

			await act(async () => {
				await result.current.reject();
			});
			expect(result.current.consentState.status).toBe(null);
		});
	});
});
