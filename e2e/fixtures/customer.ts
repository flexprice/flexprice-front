import { CreatedCustomer } from '../utils/api';
import { newCustomer } from '../data/testData';
import { authFixtures } from './auth';

/**
 * A customer that already exists before the test starts, created over the API and
 * removed afterwards.
 *
 * Use this whenever a customer is a *precondition*. Creating one through the drawer
 * to reach a subscription screen adds a slow second thing that can fail for reasons
 * unrelated to what is under test — see e2e/journeys/customers for the tests that do
 * exercise the drawer deliberately.
 *
 * Chained onto `authFixtures` rather than merged with it: merging two test objects
 * that both declare `api` lets the later declaration silently shadow the real one.
 */
export interface CustomerFixtures {
	existingCustomer: CreatedCustomer;
}

export const customerFixtures = authFixtures.extend<CustomerFixtures>({
	existingCustomer: async ({ api }, use) => {
		const customer = await api.createCustomer(newCustomer());
		await use(customer);
		await api.deleteCustomer(customer.id);
	},
});
