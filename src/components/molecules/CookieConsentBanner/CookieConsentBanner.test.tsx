import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

vi.mock('@/hooks/useCookieConsent');

vi.mock('react-dom', async () => {
	const actual = await vi.importActual<typeof import('react-dom')>('react-dom');
	return { ...actual, createPortal: (node: React.ReactNode) => node };
});

vi.mock('react-i18next', () => ({
	useTranslation: () => ({
		t: (key: string) => {
			const translations: Record<string, string> = {
				'cookieConsent.title': 'We use cookies',
				'cookieConsent.description':
					'We use analytics cookies to understand how you use our product and improve your experience. You can accept or reject non-essential cookies below.',
				'cookieConsent.acceptAll': 'Accept all',
				'cookieConsent.rejectAll': 'Reject all',
				'cookieConsent.privacyPolicy': 'Privacy Policy',
				'cookieConsent.termsAndConditions': 'Terms and Conditions',
			};
			return translations[key] ?? key;
		},
	}),
}));

import useCookieConsent from '@/hooks/useCookieConsent';
import CookieConsentBanner from './CookieConsentBanner';

const mockUseCookieConsent = vi.mocked(useCookieConsent);

beforeEach(() => {
	const modalRoot = document.createElement('div');
	modalRoot.id = 'modal-root';
	document.body.appendChild(modalRoot);
	vi.clearAllMocks();
});

afterEach(() => {
	document.getElementById('modal-root')?.remove();
});

describe('CookieConsentBanner', () => {
	it('renders nothing when showBanner is false', () => {
		mockUseCookieConsent.mockReturnValue({
			showBanner: false,
			accept: vi.fn(),
			reject: vi.fn(),
			isLoading: false,
			consentState: { status: null, version: null },
		});

		render(<CookieConsentBanner />);

		expect(screen.queryByText('We use cookies')).toBeNull();
	});

	it('renders banner when showBanner is true', () => {
		mockUseCookieConsent.mockReturnValue({
			showBanner: true,
			accept: vi.fn(),
			reject: vi.fn(),
			isLoading: false,
			consentState: { status: null, version: null },
		});

		render(<CookieConsentBanner />);

		expect(screen.getByText('We use cookies')).toBeInTheDocument();
	});

	it('calls accept when Accept all is clicked', async () => {
		const accept = vi.fn();
		mockUseCookieConsent.mockReturnValue({
			showBanner: true,
			accept,
			reject: vi.fn(),
			isLoading: false,
			consentState: { status: null, version: null },
		});

		render(<CookieConsentBanner />);

		await userEvent.click(screen.getByText('Accept all'));

		expect(accept).toHaveBeenCalledOnce();
	});

	it('calls reject when Reject all is clicked', async () => {
		const reject = vi.fn();
		mockUseCookieConsent.mockReturnValue({
			showBanner: true,
			accept: vi.fn(),
			reject,
			isLoading: false,
			consentState: { status: null, version: null },
		});

		render(<CookieConsentBanner />);

		await userEvent.click(screen.getByText('Reject all'));

		expect(reject).toHaveBeenCalledOnce();
	});

	it('buttons are disabled when isLoading is true', () => {
		mockUseCookieConsent.mockReturnValue({
			showBanner: true,
			accept: vi.fn(),
			reject: vi.fn(),
			isLoading: true,
			consentState: { status: null, version: null },
		});

		render(<CookieConsentBanner />);

		expect(screen.getByText('Accept all')).toBeDisabled();
		expect(screen.getByText('Reject all')).toBeDisabled();
	});

	it('renders Privacy Policy link when privacyPolicyUrl is provided', () => {
		mockUseCookieConsent.mockReturnValue({
			showBanner: true,
			accept: vi.fn(),
			reject: vi.fn(),
			isLoading: false,
			consentState: { status: null, version: null },
		});

		render(<CookieConsentBanner privacyPolicyUrl='https://example.com/privacy' />);

		const link = screen.getByText('Privacy Policy');
		expect(link).toBeInTheDocument();
		expect(link).toHaveAttribute('href', 'https://example.com/privacy');
	});

	it('renders Terms link when termsUrl is provided', () => {
		mockUseCookieConsent.mockReturnValue({
			showBanner: true,
			accept: vi.fn(),
			reject: vi.fn(),
			isLoading: false,
			consentState: { status: null, version: null },
		});

		render(<CookieConsentBanner termsUrl='https://example.com/terms' />);

		const link = screen.getByText('Terms and Conditions');
		expect(link).toBeInTheDocument();
		expect(link).toHaveAttribute('href', 'https://example.com/terms');
	});
});
