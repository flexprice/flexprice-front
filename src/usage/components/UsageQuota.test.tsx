import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import '@testing-library/jest-dom';
import { I18nextProvider } from 'react-i18next';
import { createInstance } from 'i18next';
import { initReactI18next } from 'react-i18next';
import UsageQuota from './UsageQuota';
import enCommon from '@/i18n/locales/en/common.json';

describe('UsageQuota', () => {
	it('renders a row per item with usage / limit text', () => {
		render(
			<UsageQuota
				items={[
					{ id: 'f1', name: 'API Calls', currentUsage: 250, limit: 1000, isUnlimited: false },
					{ id: 'f2', name: 'Storage', currentUsage: 42, limit: null, isUnlimited: true },
				]}
			/>,
		);
		expect(screen.getByText('API Calls')).toBeInTheDocument();
		expect(screen.getByText('Storage')).toBeInTheDocument();
		expect(screen.getByText('Usage Quota')).toBeInTheDocument();
	});

	it('treats a zero limit as finite, not unlimited', () => {
		render(<UsageQuota items={[{ id: 'f1', name: 'Zero Quota', currentUsage: 0, limit: 0, isUnlimited: false }]} />);
		// "0 / 0" — a real, finite zero-limit quota — not "0 / Unlimited".
		expect(screen.getByText(/^0\s*\/\s*0$/)).toBeInTheDocument();
	});

	it('marks a zero-limit quota as over-limit once any usage exists', () => {
		const { container } = render(<UsageQuota items={[{ id: 'f1', name: 'Zero Quota', currentUsage: 5, limit: 0, isUnlimited: false }]} />);
		expect(container.querySelector('.bg-destructive')).toBeInTheDocument();
	});

	// An absent quota is a fact about the plan, not a transient empty: a customer
	// whose plan has no metered features would see the placeholder on every visit.
	it('renders nothing for an empty item list', () => {
		const { container } = render(<UsageQuota items={[]} />);
		expect(container).toBeEmptyDOMElement();
	});

	it('honors a custom label', () => {
		render(<UsageQuota items={[{ id: 'f1', name: 'X', currentUsage: 1, limit: null, isUnlimited: true }]} label='My Usage' />);
		expect(screen.getByText('My Usage')).toBeInTheDocument();
	});

	// Regression test for the host-i18n handoff path: `useUsageT` defers to the host's `t` whenever
	// the host has ANY `common` bundle loaded (namespace-level check, not per-key) — so a dashboard
	// host MUST have real `usageWidgets.*` keys in its own `common` locale file, or this component
	// renders raw keys like `usageWidgets.quotaTitle` in production instead of "Usage Quota". This
	// wraps UsageQuota in a host i18next instance seeded from the actual dashboard locale file
	// (`src/i18n/locales/en/common.json`) to prove the real file — not the bundled fallback — resolves
	// the keys.
	it('resolves translated text from the host dashboard locale file, not the bundled fallback', async () => {
		const hostI18n = createInstance();
		await hostI18n.use(initReactI18next).init({
			lng: 'en',
			fallbackLng: 'en',
			ns: ['common'],
			defaultNS: 'common',
			// Override the title with a value distinct from both the bundled fallback ("Usage Quota")
			// and the real dashboard copy — proves the host instance's own resources actually won,
			// rather than the test passing because both sources happen to agree.
			resources: {
				en: {
					common: {
						...enCommon,
						usageWidgets: {
							...enCommon.usageWidgets,
							quotaTitle: 'HOST-QUOTA-TITLE',
						},
					},
				},
			},
			interpolation: { escapeValue: false },
		});

		render(
			<I18nextProvider i18n={hostI18n}>
				<UsageQuota items={[{ id: 'f1', name: 'API Calls', currentUsage: 1, limit: null, isUnlimited: true }]} />
			</I18nextProvider>,
		);

		expect(screen.getByText('HOST-QUOTA-TITLE')).toBeInTheDocument();
		expect(screen.queryByText('usageWidgets.quotaTitle')).not.toBeInTheDocument();
	});
});
