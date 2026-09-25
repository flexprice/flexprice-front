import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import { createInstance } from 'i18next';
import type { i18n as I18nInstance } from 'i18next';
import type { EndpointOut } from 'svix';
import EndpointAdvancedTab from './EndpointAdvancedTab';

/**
 * Svix returns a sensitive header's *name* in `sensitive` and withholds its value entirely —
 * `headers` comes back empty for an endpoint whose only header is `Authorization`. This suite
 * pins both halves of that: the row must still render, and a later edit must not wipe it.
 */
const { mockPatch, mockUpdate, mockReload, headersData } = vi.hoisted(() => ({
	mockPatch: vi.fn().mockResolvedValue(undefined),
	mockUpdate: vi.fn().mockResolvedValue(undefined),
	mockReload: vi.fn(),
	headersData: { current: { headers: {}, sensitive: [] as string[] } },
}));

vi.mock('svix-react', () => ({
	useEndpointHeaders: () => ({
		data: headersData.current,
		reload: mockReload,
		patchEndpointHeaders: mockPatch,
		updateEndpointHeaders: mockUpdate,
	}),
	useEndpointFunctions: () => ({ updateEndpoint: vi.fn(), deleteEndpoint: vi.fn(), recoverEndpointMessages: vi.fn() }),
}));
vi.mock('react-hot-toast', () => ({ default: { success: vi.fn(), error: vi.fn() } }));

let testI18n: I18nInstance;
beforeAll(async () => {
	const instance = createInstance();
	await instance.use(initReactI18next).init({
		lng: 'en',
		fallbackLng: 'en',
		ns: ['developers', 'common'],
		defaultNS: 'developers',
		resources: {
			en: {
				common: { actions: { edit: 'Edit', save: 'Save', cancel: 'Cancel' } },
				developers: {
					webhooks: {
						endpoints: {
							detail: {
								customHeaders: 'Custom Headers',
								headerKeyPlaceholder: 'Key',
								headerValuePlaceholder: 'Value',
								headersSaveFailed: 'Failed to update custom headers',
								headerValueHidden: 'Value hidden',
								headerValueHiddenHint: 'This header is treated as sensitive.',
								addHeader: 'Add header',
								removeHeader: 'Remove header {{key}}',
								throttling: 'Endpoint Throttling',
								noThrottle: 'No throttling rate set',
								throttlePlaceholder: 'e.g. 10',
							},
						},
					},
				},
			},
		},
		interpolation: { escapeValue: false },
	});
	testI18n = instance;
});

const endpoint = { id: 'ep_1', url: 'https://example.com', description: '', filterTypes: [], disabled: false } as unknown as EndpointOut;

const renderTab = () =>
	render(
		<I18nextProvider i18n={testI18n}>
			<EndpointAdvancedTab endpoint={endpoint} onUpdated={vi.fn()} />
		</I18nextProvider>,
	);

beforeEach(() => {
	vi.clearAllMocks();
	headersData.current = { headers: {}, sensitive: [] };
});

describe('CustomHeaders', () => {
	it('renders a sensitive header even though its value is withheld', () => {
		// The reported bug: Authorization configured, `headers` empty, nothing on screen.
		headersData.current = { headers: {}, sensitive: ['Authorization'] };
		renderTab();

		expect(screen.getByText('Authorization')).toBeInTheDocument();
		expect(screen.getByText('Value hidden')).toBeInTheDocument();
	});

	it('shows ordinary headers with their values', () => {
		headersData.current = { headers: { Test: 'Test' }, sensitive: [] };
		renderTab();

		// key and value are both "Test", so both cells render it
		expect(screen.getAllByText('Test')).toHaveLength(2);
		expect(screen.queryByText('Value hidden')).not.toBeInTheDocument();
	});

	it('patches only the added header, so a sensitive one is not dropped', async () => {
		headersData.current = { headers: {}, sensitive: ['Authorization'] };
		renderTab();

		fireEvent.change(screen.getByPlaceholderText('Key'), { target: { value: 'X-Trace' } });
		fireEvent.change(screen.getByPlaceholderText('Value'), { target: { value: 'abc' } });
		fireEvent.click(screen.getByRole('button', { name: 'Add header' }));

		await waitFor(() => expect(mockPatch).toHaveBeenCalled());
		// The whole point: the payload names one header, and never rewrites the full set.
		expect(mockPatch).toHaveBeenCalledWith({ headers: { 'X-Trace': 'abc' } });
		expect(mockUpdate).not.toHaveBeenCalled();
	});

	it('removes a header with deleteHeaders rather than a full replace', async () => {
		headersData.current = { headers: { 'X-Trace': 'abc' }, sensitive: ['Authorization'] };
		renderTab();

		fireEvent.click(screen.getByRole('button', { name: 'Remove header X-Trace' }));

		await waitFor(() => expect(mockPatch).toHaveBeenCalled());
		const [payload] = mockPatch.mock.calls[0];
		expect(payload.deleteHeaders).toHaveLength(1);
		expect(payload.headers).toEqual({});
		expect(mockUpdate).not.toHaveBeenCalled();
	});
});
