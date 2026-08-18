import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { I18nextProvider } from 'react-i18next';
import { createInstance } from 'i18next';
import { initReactI18next } from 'react-i18next';
import commonEn from '@/i18n/locales/en/common.json';
import type { User } from '@/models/User';
import WhatsNewModal from './WhatsNewModal';

const mockUser: User = {
	id: 'user-123',
	email: 'test@flexprice.io',
	tenant: {
		id: 'tenant-1',
		name: 'Test Tenant',
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
		status: 'published',
		created_at: '2026-01-01T00:00:00Z',
		updated_at: '2026-01-01T00:00:00Z',
	},
};

vi.mock('@/hooks/useUser', () => ({
	default: vi.fn(),
}));

import useUser from '@/hooks/useUser';

const renderModal = async () => {
	const i18n = createInstance();
	await i18n.use(initReactI18next).init({
		lng: 'en',
		resources: { en: { common: commonEn } },
		ns: ['common'],
		defaultNS: 'common',
		interpolation: { escapeValue: false },
	});
	return render(
		<I18nextProvider i18n={i18n}>
			<WhatsNewModal />
		</I18nextProvider>,
	);
};

describe('WhatsNewModal', () => {
	beforeEach(() => {
		localStorage.clear();
		vi.mocked(useUser).mockReturnValue({
			user: mockUser,
			loading: false,
			error: null,
			refetch: vi.fn(),
		} as ReturnType<typeof useUser>);
		const root = document.createElement('div');
		root.id = 'modal-root';
		document.body.appendChild(root);
	});

	afterEach(() => {
		document.getElementById('modal-root')?.remove();
		vi.clearAllMocks();
	});

	it('opens after login when this release has not been seen', async () => {
		await renderModal();
		expect(await screen.findByText('We tidied up Flexprice.')).toBeInTheDocument();
		expect(screen.getByTestId('whats-new-photo-island')).toBeInTheDocument();
	});

	it('does not open before the user is loaded', async () => {
		vi.mocked(useUser).mockReturnValue({
			user: undefined,
			loading: true,
			error: null,
			refetch: vi.fn(),
		} as ReturnType<typeof useUser>);

		await renderModal();
		expect(screen.queryByText('We tidied up Flexprice.')).not.toBeInTheDocument();
	});

	it('opens on preview event even after dismiss', async () => {
		await renderModal();
		await userEvent.click(screen.getByRole('button'));
		await waitFor(() => {
			expect(screen.queryByText('We tidied up Flexprice.')).not.toBeInTheDocument();
		});

		window.dispatchEvent(new CustomEvent('flexprice:preview-whats-new'));
		expect(await screen.findByText('We tidied up Flexprice.')).toBeInTheDocument();
	});
});
