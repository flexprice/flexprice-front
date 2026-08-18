import type { PropsWithChildren } from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SupportChatProvider } from '@/models/SupportChat';
import type { SupportChatAdapter, SupportChatVisibilityHandlers } from './SupportChatAdapter';

const { mockGetTenantById, mockUpdateTenant, mockUseUser, mockToastSuccess, mockToastError, mockLogError, mockRefetchQueries } = vi.hoisted(
	() => ({
		mockGetTenantById: vi.fn(),
		mockUpdateTenant: vi.fn(),
		mockUseUser: vi.fn(),
		mockToastSuccess: vi.fn(),
		mockToastError: vi.fn(),
		mockLogError: vi.fn(),
		mockRefetchQueries: vi.fn().mockResolvedValue(undefined),
	}),
);

vi.mock('@/api/TenantApi', () => ({
	default: { getTenantById: mockGetTenantById, updateTenant: mockUpdateTenant },
}));
vi.mock('@/hooks/useUser', () => ({ default: mockUseUser }));
vi.mock('react-hot-toast', () => ({
	toast: { success: mockToastSuccess, error: mockToastError },
}));
vi.mock('@/core/services/error/ErrorLoggingService', () => ({
	default: { logError: mockLogError },
	errorLogger: { logError: mockLogError },
}));
vi.mock('../tanstack/ReactQueryProvider', () => ({ refetchQueries: mockRefetchQueries }));

import { SUPPORT_CHAT_FLOW } from '@/config/support-chat';
import { useSupportChat } from './useSupportChat';

const FLOW = SUPPORT_CHAT_FLOW[SupportChatProvider.Intercom];

const USER = {
	id: 'user_1',
	email: 'ada@example.com',
	name: 'Ada Lovelace',
	tenant: { id: 'tenant_1', name: 'Acme Inc', created_at: '2024-01-01T00:00:00Z' },
};

/** Adapter double that lets the test drive onShow/onHide directly. */
function createFakeAdapter() {
	let handlers: SupportChatVisibilityHandlers | null = null;
	const adapter: SupportChatAdapter & {
		emitShow: () => void;
		emitHide: () => void;
		initMock: ReturnType<typeof vi.fn>;
		showMock: ReturnType<typeof vi.fn>;
		disposeMock: ReturnType<typeof vi.fn>;
	} = {
		initMock: vi.fn().mockResolvedValue(undefined),
		showMock: vi.fn(),
		disposeMock: vi.fn(),
		init: (user) => adapter.initMock(user),
		show: () => adapter.showMock(),
		subscribe: (next) => {
			handlers = next;
			return () => {
				handlers = null;
			};
		},
		dispose: () => adapter.disposeMock(),
		emitShow: () => handlers?.onShow(),
		emitHide: () => handlers?.onHide(),
	};
	return adapter;
}

/** Hands back the QueryClient so tests can wait for the tenant query to settle, not just fire. */
function renderSupportChat(adapter: SupportChatAdapter) {
	const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
	const Wrapper = ({ children }: PropsWithChildren) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
	const rendered = renderHook(() => useSupportChat(adapter, FLOW), { wrapper: Wrapper });
	return { ...rendered, queryClient };
}

/** Resolves once the tenant query has data. */
async function waitForTenantLoaded(queryClient: QueryClient) {
	await waitFor(() => expect(queryClient.getQueryData(['tenant', 'tenant_1'])).toBeDefined());
}

function gtagSpy() {
	const gtag = vi.fn();
	(window as unknown as { gtag?: unknown }).gtag = gtag;
	return gtag;
}

describe('useSupportChat', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		localStorage.clear();
		delete (window as unknown as { gtag?: unknown }).gtag;
		mockUseUser.mockReturnValue({ user: USER, loading: false, error: null, refetch: vi.fn() });
		mockGetTenantById.mockResolvedValue({ id: 'tenant_1', name: 'Acme Inc', metadata: {} });
		mockUpdateTenant.mockResolvedValue({ id: 'tenant_1' });
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('initialises the adapter with the identified user', async () => {
		const adapter = createFakeAdapter();
		renderSupportChat(adapter);

		await waitFor(() => expect(adapter.initMock).toHaveBeenCalledOnce());
		expect(adapter.initMock).toHaveBeenCalledWith({
			id: 'user_1',
			email: 'ada@example.com',
			name: 'Ada Lovelace',
			createdAt: new Date('2024-01-01T00:00:00Z').getTime(),
			tenantId: 'tenant_1',
		});
	});

	it('falls back to the tenant name when the user has no name of their own', async () => {
		mockUseUser.mockReturnValue({
			user: { ...USER, name: undefined },
			loading: false,
			error: null,
			refetch: vi.fn(),
		});
		const adapter = createFakeAdapter();
		renderSupportChat(adapter);

		await waitFor(() => expect(adapter.initMock).toHaveBeenCalledOnce());
		expect(adapter.initMock).toHaveBeenCalledWith(expect.objectContaining({ name: 'Acme Inc' }));
	});

	it('identifies the person, not the company, when a user name exists', async () => {
		const adapter = createFakeAdapter();
		renderSupportChat(adapter);

		await waitFor(() => expect(adapter.initMock).toHaveBeenCalledOnce());
		expect(adapter.initMock).toHaveBeenCalledWith(expect.objectContaining({ name: 'Ada Lovelace' }));
	});

	it('opens the messenger through the adapter', async () => {
		const adapter = createFakeAdapter();
		const { result } = renderSupportChat(adapter);

		await waitFor(() => expect(adapter.initMock).toHaveBeenCalledOnce());
		// Flush the microtask that resolves init() and flips status to Ready.
		await act(async () => undefined);
		act(() => result.current.open());

		expect(adapter.showMock).toHaveBeenCalledOnce();
	});

	it('does not open while the adapter has failed to initialise', async () => {
		const adapter = createFakeAdapter();
		adapter.initMock.mockRejectedValue(new Error('widget unavailable'));
		const { result } = renderSupportChat(adapter);

		await waitFor(() => expect(mockLogError).toHaveBeenCalledOnce());
		act(() => result.current.open());

		expect(adapter.showMock).not.toHaveBeenCalled();
	});

	it('emits the gtag opened event when the messenger becomes visible', async () => {
		const gtag = gtagSpy();
		const adapter = createFakeAdapter();
		renderSupportChat(adapter);

		await waitFor(() => expect(adapter.initMock).toHaveBeenCalledOnce());
		await act(async () => undefined);
		act(() => adapter.emitShow());

		expect(gtag).toHaveBeenCalledWith('event', 'intercom_messenger_opened', {
			user_id: 'user_1',
			tenant_id: 'tenant_1',
		});
	});

	it('marks the tenant onboarded when the messenger is dismissed', async () => {
		const adapter = createFakeAdapter();
		const { queryClient } = renderSupportChat(adapter);

		await waitForTenantLoaded(queryClient);
		act(() => adapter.emitShow());
		act(() => adapter.emitHide());

		await waitFor(() => expect(mockUpdateTenant).toHaveBeenCalledOnce());
		expect(mockUpdateTenant).toHaveBeenCalledWith({
			name: 'Acme Inc',
			metadata: { onboarding_completed: 'true' },
		});
		await waitFor(() => expect(mockToastSuccess).toHaveBeenCalledWith(FLOW.toastSuccessMarkOnboarded));
	});

	it('does not mark the tenant onboarded when onboarding is already complete', async () => {
		mockGetTenantById.mockResolvedValue({
			id: 'tenant_1',
			name: 'Acme Inc',
			metadata: { onboarding_completed: 'true' },
		});
		const adapter = createFakeAdapter();
		const { queryClient } = renderSupportChat(adapter);

		await waitForTenantLoaded(queryClient);
		act(() => adapter.emitShow());
		act(() => adapter.emitHide());

		expect(mockUpdateTenant).not.toHaveBeenCalled();
	});

	it('marks the tenant onboarded only once across repeated hide events', async () => {
		const adapter = createFakeAdapter();
		const { queryClient } = renderSupportChat(adapter);

		await waitForTenantLoaded(queryClient);
		act(() => adapter.emitShow());
		act(() => {
			adapter.emitHide();
			adapter.emitHide();
			adapter.emitHide();
		});

		await waitFor(() => expect(mockUpdateTenant).toHaveBeenCalledOnce());
	});

	it('ignores a hide that arrives without a preceding show', async () => {
		const adapter = createFakeAdapter();
		const { queryClient } = renderSupportChat(adapter);

		await waitForTenantLoaded(queryClient);
		act(() => adapter.emitHide());

		expect(mockUpdateTenant).not.toHaveBeenCalled();
	});

	it('never puts email or name into the gtag payload', async () => {
		const gtag = gtagSpy();
		const adapter = createFakeAdapter();
		const { queryClient } = renderSupportChat(adapter);

		await waitForTenantLoaded(queryClient);
		act(() => adapter.emitShow());
		act(() => adapter.emitHide());

		const serialised = JSON.stringify(gtag.mock.calls);
		expect(serialised).not.toContain('ada@example.com');
		expect(serialised).not.toContain('Ada Lovelace');
		expect(serialised).not.toContain('Acme Inc');
	});

	it('records the messenger as seen in localStorage on close', async () => {
		const adapter = createFakeAdapter();
		const { queryClient } = renderSupportChat(adapter);

		await waitForTenantLoaded(queryClient);
		act(() => adapter.emitShow());
		act(() => adapter.emitHide());

		expect(localStorage.getItem('intercom_messenger_seen')).toBe('true');
	});

	it('toasts an error when marking the tenant onboarded fails', async () => {
		mockUpdateTenant.mockRejectedValue(new Error('network down'));
		const adapter = createFakeAdapter();
		const { queryClient } = renderSupportChat(adapter);

		await waitForTenantLoaded(queryClient);
		act(() => adapter.emitShow());
		act(() => adapter.emitHide());

		await waitFor(() => expect(mockToastError).toHaveBeenCalledWith(FLOW.toastErrorMarkOnboarded));
	});

	it('opens the messenger when the command palette action fires', async () => {
		const adapter = createFakeAdapter();
		renderSupportChat(adapter);

		await waitFor(() => expect(adapter.initMock).toHaveBeenCalledOnce());
		await act(async () => undefined);
		act(() => {
			window.dispatchEvent(new CustomEvent('command-palette:action:open-intercom'));
		});

		expect(adapter.showMock).toHaveBeenCalledOnce();
	});

	it('auto-opens after the inactivity delay while onboarding is incomplete', async () => {
		// Fake timers must be installed BEFORE render; a real-timer setTimeout cannot be advanced later.
		vi.useFakeTimers();
		const adapter = createFakeAdapter();
		const { queryClient } = renderSupportChat(adapter);

		// advanceTimersByTimeAsync flushes microtasks so init() and the query settle first.
		await act(async () => {
			await vi.advanceTimersByTimeAsync(0);
		});
		expect(queryClient.getQueryData(['tenant', 'tenant_1'])).toBeDefined();
		expect(adapter.showMock).not.toHaveBeenCalled();

		await act(async () => {
			await vi.advanceTimersByTimeAsync(FLOW.inactivityOpenDelayMs);
		});

		expect(adapter.showMock).toHaveBeenCalled();
	});

	it('disposes the adapter on unmount', async () => {
		const adapter = createFakeAdapter();
		const { unmount } = renderSupportChat(adapter);

		await waitFor(() => expect(adapter.initMock).toHaveBeenCalledOnce());
		unmount();

		expect(adapter.disposeMock).toHaveBeenCalledOnce();
	});

	it('caches tenant data per tenant id, not globally, so a tenant switch cannot read stale data', async () => {
		const adapter = createFakeAdapter();
		mockGetTenantById.mockResolvedValue({ id: 'tenant_1', name: 'Acme Inc', metadata: { onboarding_completed: 'true' } });
		const { queryClient } = renderSupportChat(adapter);

		await waitForTenantLoaded(queryClient);

		expect(queryClient.getQueryData(['tenant', 'tenant_1'])).toMatchObject({ id: 'tenant_1' });
		expect(queryClient.getQueryData(['tenant'])).toBeUndefined();
	});

	it('re-identifies without disposing when identity changes without unmounting', async () => {
		const adapter = createFakeAdapter();
		const { rerender, result } = renderSupportChat(adapter);

		await waitFor(() => expect(adapter.initMock).toHaveBeenCalledTimes(1));
		await act(async () => undefined);

		mockUseUser.mockReturnValue({
			user: { ...USER, id: 'user_2', tenant: { ...USER.tenant, id: 'tenant_2', name: 'Other Co' } },
			loading: false,
			error: null,
			refetch: vi.fn(),
		});
		mockGetTenantById.mockResolvedValue({ id: 'tenant_2', name: 'Other Co', metadata: {} });
		rerender();

		await waitFor(() => expect(adapter.initMock).toHaveBeenCalledTimes(2));
		expect(adapter.disposeMock).not.toHaveBeenCalled();

		await act(async () => undefined);
		act(() => result.current.open());
		expect(adapter.showMock).toHaveBeenCalledOnce();
	});

	it('disposes exactly once, on unmount, even after an identity change', async () => {
		const adapter = createFakeAdapter();
		const { rerender, unmount } = renderSupportChat(adapter);

		await waitFor(() => expect(adapter.initMock).toHaveBeenCalledTimes(1));

		mockUseUser.mockReturnValue({ user: { ...USER, id: 'user_2' }, loading: false, error: null, refetch: vi.fn() });
		rerender();
		await waitFor(() => expect(adapter.initMock).toHaveBeenCalledTimes(2));

		unmount();
		expect(adapter.disposeMock).toHaveBeenCalledOnce();
	});
});
