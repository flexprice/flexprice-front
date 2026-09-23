import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router';
import { createInstance } from 'i18next';
import { I18nextProvider } from 'react-i18next';
import enCustomers from '@/i18n/locales/en/customers.json';
import enCatalog from '@/i18n/locales/en/catalog.json';
import CustomerUsageTable from './CustomerUsageTable';
import CustomerUsage, { ENTITLEMENT_SOURCE_ENTITY_TYPE } from '@/models/CustomerUsage';
import { ENTITLEMENT_GRANT_DURATION_UNIT, ENTITLEMENT_GRANT_MEASURE } from '@/models/Entitlement';
import { FEATURE_TYPE } from '@/models/Feature';

const usage = (over: Partial<CustomerUsage>): CustomerUsage =>
	({
		feature: { id: 'feat_1', name: 'API calls', type: FEATURE_TYPE.METERED },
		total_limit: 50,
		is_unlimited: false,
		current_usage: 20,
		usage_percent: 40,
		is_enabled: true,
		is_soft_limit: false,
		next_usage_reset_at: null,
		sources: [{ entity_type: ENTITLEMENT_SOURCE_ENTITY_TYPE.PLAN, entity_id: 'plan_1', entity_name: 'Starter' }],
		...over,
	}) as CustomerUsage;

const renderTable = (data: CustomerUsage[]) => {
	const i18n = createInstance();
	i18n.init({
		lng: 'en',
		fallbackLng: 'en',
		ns: ['customers', 'catalog'],
		defaultNS: 'customers',
		resources: { en: { customers: enCustomers, catalog: enCatalog } },
		interpolation: { escapeValue: false },
	});
	return render(
		<I18nextProvider i18n={i18n}>
			<MemoryRouter>
				<CustomerUsageTable data={data} />
			</MemoryRouter>
		</I18nextProvider>,
	);
};

describe('CustomerUsageTable', () => {
	it('reads the allowance as the rule it is — the amount alone does not say what it renews against', () => {
		renderTable([
			usage({
				grant_quota: '50',
				grant_duration_value: 1,
				grant_duration_unit: ENTITLEMENT_GRANT_DURATION_UNIT.SUBSCRIPTION_PERIOD,
				grant_measure: ENTITLEMENT_GRANT_MEASURE.AMOUNT,
			}),
		]);

		expect(screen.getByText('50 / billing period')).toBeInTheDocument();
		expect(screen.getByText('Additive')).toBeInTheDocument();
	});

	it('names a parallel feature as such and gives each budget its own row', () => {
		renderTable([
			usage({
				buckets: [
					{
						entitlement_id: 'ent_1',
						source_entity_id: 'plan_1',
						grant_quota: '400',
						grant_duration_value: 1,
						grant_duration_unit: ENTITLEMENT_GRANT_DURATION_UNIT.DAY,
					},
					{ entitlement_id: 'ent_2', source_entity_id: 'addon_1', grant_unlimited: true },
				],
			}),
		]);

		expect(screen.getByText('400 / day')).toBeInTheDocument();
		expect(screen.getAllByText('Parallel')).toHaveLength(2);
		expect(screen.getByText('Unlimited')).toBeInTheDocument();
	});
});
