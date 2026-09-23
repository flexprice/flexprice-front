import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import '@testing-library/jest-dom';
import { createInstance } from 'i18next';
import { I18nextProvider } from 'react-i18next';
import enCustomers from '@/i18n/locales/en/customers.json';
import GrantWindowLedger from './GrantWindowLedger';
import { ENTITLEMENT_GRANT_MEASURE, ENTITLEMENT_GRANT_STATUS, GrantAllowanceState } from '@/models/Entitlement';

const NOW = new Date('2026-09-23T03:00:00Z').getTime();

const allowance = (over: Partial<GrantAllowanceState>): GrantAllowanceState =>
	({
		grant_id: 'eg_1',
		entitlement_id: 'ent_1',
		measure: ENTITLEMENT_GRANT_MEASURE.QUANTITY,
		unlimited: false,
		quota: '100',
		usage: '0',
		valid_from: '2026-09-23T01:00:00Z',
		valid_to: '2026-09-23T02:00:00Z',
		status: ENTITLEMENT_GRANT_STATUS.ACTIVE,
		is_active: false,
		...over,
	}) as GrantAllowanceState;

// Rendering through the real locale files also asserts the new keys resolve — a
// missing one would surface here as raw `usageTable.grantsTitle` text.
const renderLedger = (allowances: GrantAllowanceState[]) => {
	const i18n = createInstance();
	i18n.init({
		lng: 'en',
		fallbackLng: 'en',
		ns: ['customers'],
		defaultNS: 'customers',
		resources: { en: { customers: enCustomers } },
		interpolation: { escapeValue: false },
	});
	return render(
		<I18nextProvider i18n={i18n}>
			<GrantWindowLedger allowances={allowances} isOpen now={NOW} onOpenChange={() => {}} />
		</I18nextProvider>,
	);
};

describe('GrantWindowLedger', () => {
	it('names each window by what it is doing, which status alone cannot say', () => {
		renderLedger([
			allowance({ grant_id: 'closed', usage: '40' }),
			allowance({
				grant_id: 'exhausted',
				usage: '240',
				status: ENTITLEMENT_GRANT_STATUS.EXHAUSTED,
				quota_crossed_at: '2026-09-23T01:42:00Z',
			}),
			allowance({
				grant_id: 'active',
				valid_from: '2026-09-23T02:00:00Z',
				valid_to: '2026-09-23T04:00:00Z',
				is_active: true,
				usage: '10',
			}),
			// Starts later today: the server reports it inactive, and "closed" would be a lie.
			allowance({ grant_id: 'scheduled', valid_from: '2026-09-23T05:00:00Z', valid_to: '2026-09-23T06:00:00Z' }),
		]);

		expect(screen.getByText('Closed')).toBeInTheDocument();
		expect(screen.getByText('Exhausted')).toBeInTheDocument();
		expect(screen.getByText('Active')).toBeInTheDocument();
		expect(screen.getByText('Scheduled')).toBeInTheDocument();
	});

	it('renders an unlimited window without a ceiling to measure against', () => {
		renderLedger([allowance({ unlimited: true, usage: '10000', quota: '0', is_active: true })]);

		expect(screen.getByText('10,000 / Unlimited')).toBeInTheDocument();
		expect(screen.getByText('Active')).toBeInTheDocument();
	});
});
