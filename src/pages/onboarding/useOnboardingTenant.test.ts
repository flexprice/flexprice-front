import { act, renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockMutate = vi.fn();

vi.mock('react-router', () => ({
	useNavigate: () => vi.fn(),
}));

vi.mock('@tanstack/react-query', () => ({
	useQuery: () => ({ data: undefined, isLoading: false }),
	useMutation: () => ({ mutate: mockMutate, isPending: false }),
}));

vi.mock('react-i18next', () => ({
	useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('react-hot-toast', () => ({
	default: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn() }),
}));

vi.mock('@/hooks/useUser', () => ({
	default: () => ({ user: { id: 'u1', email: 'a@b.com', tenant: { id: 't1' } }, loading: false }),
}));

vi.mock('@/core/routes/Routes', () => ({ RouteNames: { homeDashboard: '/' } }));
vi.mock('@/api/TenantApi', () => ({ default: { getTenantById: vi.fn(), updateTenant: vi.fn() } }));
vi.mock('@/api/OnboardingApi', () => ({ default: { recordOnboardingData: vi.fn() } }));
vi.mock('@/core/services/tanstack/ReactQueryProvider', () => ({ refetchQueries: vi.fn() }));

// Imported after the mocks above so the module picks them up.
import useOnboardingTenant from './useOnboardingTenant';

/** Runs validate() through the only caller that exposes it: handleContinue(). */
const validateWith = (orgUrl: string) => {
	const { result } = renderHook(() => useOnboardingTenant());
	act(() => {
		result.current.setOrgName('Acme Corp');
		result.current.setOrgUrl(orgUrl);
		result.current.setReferralSource('LinkedIn');
	});
	act(() => {
		result.current.handleContinue();
	});
	return result;
};

describe('useOnboardingTenant validate()', () => {
	beforeEach(() => {
		mockMutate.mockReset();
	});

	it('flags an empty organization URL as required', () => {
		const result = validateWith('   ');
		expect(result.current.errors.orgUrl).toBe('tenantSetup.orgUrlRequired');
		expect(mockMutate).not.toHaveBeenCalled();
	});

	it('rejects a value that is not a URL', () => {
		const result = validateWith('not-a-url');
		expect(result.current.errors.orgUrl).toBe('tenantSetup.orgUrlInvalid');
		expect(mockMutate).not.toHaveBeenCalled();
	});

	it('rejects a URL that is not served over http(s)', () => {
		const result = validateWith('ftp://x.com');
		expect(result.current.errors.orgUrl).toBe('tenantSetup.orgUrlInvalid');
		expect(mockMutate).not.toHaveBeenCalled();
	});

	it('accepts a well-formed https URL', () => {
		const result = validateWith('https://acme.com');
		expect(result.current.errors.orgUrl).toBeUndefined();
		expect(result.current.errors).toEqual({});
		expect(mockMutate).toHaveBeenCalledTimes(1);
	});
});
