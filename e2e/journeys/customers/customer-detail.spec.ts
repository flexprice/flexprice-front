import { test, expect } from '../../fixtures/test';

/**
 * Reaching an existing customer's detail page.
 *
 * The customer here is a *precondition*, so it is created over the API by the
 * `existingCustomer` fixture and removed afterwards. Clicking through the create
 * drawer to arrange it would add a slow second thing that can fail for reasons
 * unrelated to what this test is about — that path has its own coverage in
 * create-customer.spec.ts.
 */
test.describe('Customer detail @critical', () => {
	test('an API-created customer appears in the list', async ({ existingCustomer, customersPage }) => {
		await customersPage.goto();

		await expect(customersPage.row(existingCustomer.name)).toBeVisible();
	});

	test('the detail page renders its tabs for a known customer', async ({ existingCustomer, page }) => {
		await page.goto(`/billing/customers/${existingCustomer.id}`);

		// Tabs are the detail page's own content; a URL that resolves to a blank
		// shell is exactly the failure worth catching here.
		await expect(page.getByRole('tab', { name: 'Overview' })).toBeVisible();
		await expect(page.getByRole('tab', { name: 'Wallet' })).toBeVisible();
		await expect(page.getByText(existingCustomer.name).first()).toBeVisible();
	});
});
