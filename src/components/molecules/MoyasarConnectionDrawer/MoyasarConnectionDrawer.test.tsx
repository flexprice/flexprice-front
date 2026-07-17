import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { I18nextProvider } from 'react-i18next';
import { createInstance } from 'i18next';
import type { i18n as I18nInstance } from 'i18next';
import { initReactI18next } from 'react-i18next';
import MoyasarConnectionDrawer from './MoyasarConnectionDrawer';
import ConnectionApi from '@/api/ConnectionApi';

vi.mock('@/api/ConnectionApi', () => ({ default: { Get: vi.fn(), Create: vi.fn(), Update: vi.fn() } }));
vi.mock('react-hot-toast', () => ({ default: { success: vi.fn(), error: vi.fn() } }));
vi.mock('@/hooks/UserContext', () => ({ useUser: () => ({ user: { tenant: { id: 'tenant-1' } } }) }));
vi.mock('@/hooks/useEnvironment', () => ({ useEnvironment: () => ({ activeEnvironment: { id: 'env-1' } }) }));

const CONNECTION_ID = 'conn_moyasar_1';

let testI18n: I18nInstance;
beforeAll(async () => {
	const instance = createInstance();
	await instance.use(initReactI18next).init({
		lng: 'en',
		fallbackLng: 'en',
		ns: ['settings'],
		defaultNS: 'settings',
		resources: {
			en: {
				settings: {
					connection: {
						moyasar: {
							successUrl: 'Success URL',
							cancelUrl: 'Cancel URL',
						},
						validation: {
							redirectUrlInvalid: 'Must be a valid URL starting with http:// or https://',
						},
						buttons: {
							updateConnection: 'Update Connection',
						},
					},
				},
			},
		},
		interpolation: { escapeValue: false },
	});
	testI18n = instance;
});

const Wrapper = ({ children }: { children: React.ReactNode }) => (
	<QueryClientProvider client={new QueryClient({ defaultOptions: { mutations: { retry: false } } })}>
		<I18nextProvider i18n={testI18n}>{children}</I18nextProvider>
	</QueryClientProvider>
);

const renderDrawer = (metadata: Record<string, string>) =>
	render(
		<MoyasarConnectionDrawer
			isOpen={true}
			onOpenChange={vi.fn()}
			connection={{ id: CONNECTION_ID, name: 'Moyasar Production', metadata }}
			onSave={vi.fn()}
		/>,
		{ wrapper: Wrapper },
	);

describe('MoyasarConnectionDrawer redirect URLs', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(ConnectionApi.Update).mockResolvedValue({ id: CONNECTION_ID } as never);
	});

	it('prefills both URLs from the connection metadata', () => {
		renderDrawer({ success_url: 'https://app.com/ok', cancel_url: 'https://app.com/cancel' });

		expect(screen.getByLabelText(/Success URL/i)).toHaveValue('https://app.com/ok');
		expect(screen.getByLabelText(/Cancel URL/i)).toHaveValue('https://app.com/cancel');
	});

	it('preserves unrelated metadata keys when saving', async () => {
		vi.mocked(ConnectionApi.Get).mockResolvedValue({
			id: CONNECTION_ID,
			metadata: { success_url: 'https://app.com/ok', some_other_key: 'keep-me' },
		} as never);

		renderDrawer({ success_url: 'https://app.com/ok', some_other_key: 'keep-me' });
		await userEvent.click(screen.getByRole('button', { name: /Update Connection/i }));

		await waitFor(() => expect(ConnectionApi.Update).toHaveBeenCalled());
		expect(vi.mocked(ConnectionApi.Update).mock.calls[0][1].metadata).toEqual({
			success_url: 'https://app.com/ok',
			some_other_key: 'keep-me',
		});
	});

	it('clears a URL by dropping its key while keeping the other', async () => {
		vi.mocked(ConnectionApi.Get).mockResolvedValue({
			id: CONNECTION_ID,
			metadata: { success_url: 'https://app.com/ok', cancel_url: 'https://app.com/cancel' },
		} as never);

		renderDrawer({ success_url: 'https://app.com/ok', cancel_url: 'https://app.com/cancel' });
		await userEvent.clear(screen.getByLabelText(/Cancel URL/i));
		await userEvent.click(screen.getByRole('button', { name: /Update Connection/i }));

		await waitFor(() => expect(ConnectionApi.Update).toHaveBeenCalled());
		expect(vi.mocked(ConnectionApi.Update).mock.calls[0][1].metadata).toEqual({ success_url: 'https://app.com/ok' });
	});

	it('merges against the freshly read map rather than the stale prop', async () => {
		// Another writer added a key after this drawer was handed its connection prop.
		vi.mocked(ConnectionApi.Get).mockResolvedValue({
			id: CONNECTION_ID,
			metadata: { success_url: 'https://app.com/ok', added_elsewhere: 'later' },
		} as never);

		renderDrawer({ success_url: 'https://app.com/ok' });
		await userEvent.click(screen.getByRole('button', { name: /Update Connection/i }));

		await waitFor(() => expect(ConnectionApi.Update).toHaveBeenCalled());
		expect(vi.mocked(ConnectionApi.Update).mock.calls[0][1].metadata).toEqual({
			success_url: 'https://app.com/ok',
			added_elsewhere: 'later',
		});
	});

	it('rejects a malformed URL without calling the API', async () => {
		renderDrawer({});
		await userEvent.type(screen.getByLabelText(/Success URL/i), 'not-a-url');
		await userEvent.click(screen.getByRole('button', { name: /Update Connection/i }));

		expect(await screen.findByText(/Must be a valid URL/i)).toBeInTheDocument();
		expect(ConnectionApi.Update).not.toHaveBeenCalled();
	});
});
