import { describe, expect, it } from 'vitest';
import { getCustomerIntegrationProviders } from './customerListDisplay';
import type { CustomerResponse } from '@/types/dto';

describe('customerListDisplay', () => {
	it('uses expanded integrations before mapped providers', () => {
		const customer = {
			integrations: [{ provider_type: 'stripe' }, { provider_type: 'hubspot' }],
		} as CustomerResponse;
		expect(getCustomerIntegrationProviders(customer, ['paddle'])).toEqual(['stripe', 'hubspot']);
		expect(getCustomerIntegrationProviders({} as CustomerResponse, ['stripe', 'stripe'])).toEqual(['stripe']);
	});
});
