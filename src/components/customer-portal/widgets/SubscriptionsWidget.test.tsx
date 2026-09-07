import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom';
import { createInstance } from 'i18next';
import { I18nextProvider } from 'react-i18next';
import enPortal from '@/i18n/locales/en/customer-portal.json';
import SubscriptionsWidget from './SubscriptionsWidget';

vi.mock('@/context/PortalConfigContext', () => ({ usePortalConfig: () => ({ config: {} }) }));

const SUB = {
	id: 'subs_1',
	subscription_status: 'active',
	current_period_start: '2026-09-01T00:00:00Z',
	current_period_end: '2026-10-01T00:00:00Z',
	plan: { name: 'test2' },
};

const renderWidget = (subscriptions: unknown[]) => {
	const i18n = createInstance();
	i18n.init({
		lng: 'en',
		fallbackLng: 'en',
		ns: ['customer-portal'],
		defaultNS: 'customer-portal',
		resources: { en: { 'customer-portal': enPortal } },
		interpolation: { escapeValue: false },
	});
	return render(
		<I18nextProvider i18n={i18n}>
			<SubscriptionsWidget subscriptions={subscriptions as never} />
		</I18nextProvider>,
	);
};

describe('SubscriptionsWidget', () => {
	// Each subscription used to sit in its own bordered box inside the section's
	// card — a second level of hierarchy the content does not have, costing about
	// a third of the section's height.
	it('lists subscriptions as rows, not nested cards', () => {
		const { container } = renderWidget([SUB, { ...SUB, id: 'subs_2', plan: { name: 'adv2' } }]);

		expect(screen.getByText('test2')).toBeInTheDocument();
		expect(screen.getByText('adv2')).toBeInTheDocument();
		// Separated by a rule rather than each carrying its own border.
		expect(container.querySelector('.divide-y')).toBeInTheDocument();
		expect(container.querySelectorAll('.rounded-lg')).toHaveLength(0);
	});

	// The dates are one fact about the period, not two findings deserving separate
	// icons and columns — and "Next billing:" reads as a form label.
	it('states the period and next billing on one line, without a colon', () => {
		renderWidget([SUB]);

		const meta = screen.getByText(/Sep 1, 2026/);
		expect(meta).toHaveTextContent('·');
		expect(meta).toHaveTextContent(/Next billing Oct 1, 2026/);
		expect(meta).not.toHaveTextContent('Next billing:');
	});

	it('counts the subscriptions in the header', () => {
		renderWidget([SUB, { ...SUB, id: 'subs_2' }]);
		expect(screen.getByText('2 subscriptions')).toBeInTheDocument();
	});
});
