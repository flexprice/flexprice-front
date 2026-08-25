import { test, expect } from '../../fixtures/test';
import { newCustomer } from '../../data/testData';

/**
 * Creating a customer is the entry point to every downstream billing flow, so a
 * regression here blocks subscriptions, invoices and checkout alike.
 *
 * The assertions deliberately go past the success toast: a toast fires from the
 * client the moment the request resolves, and has fired before while the record
 * never reached the list. Reloading and finding the row again is what proves the
 * write actually landed.
 */
test.describe('Create customer @critical', () => {
	test.beforeEach(async ({ customersPage }) => {
		await customersPage.goto();
	});

	test('creates a customer and shows it in the list after a reload', async ({ customersPage, app, page }) => {
		const customer = newCustomer();

		await customersPage.openCreateDrawer();
		await customersPage.fillCustomer(customer);
		await customersPage.saveButton.click();

		await app.expectToast('Customer added successfully');
		await expect(customersPage.drawer).toBeHidden();

		await page.reload();
		await expect(customersPage.row(customer.name)).toBeVisible();
	});

	test('keeps save unavailable until the required fields are filled', async ({ customersPage }) => {
		const customer = newCustomer();

		await customersPage.openCreateDrawer();

		// The drawer disables Save rather than letting an empty submit through and
		// reporting errors afterwards, so there is no click to make here — asserting
		// the gate itself is the honest test.
		await expect(customersPage.saveButton).toBeDisabled();

		// Name is the only field anyone has to type: external_id is derived from it as
		// `cust-<slugified name>`, which is what releases the gate.
		await customersPage.nameInput.fill(customer.name);

		await expect(customersPage.externalIdInput).toHaveValue(`cust-${customer.name.toLowerCase().replace(/\s/g, '-')}`);
		await expect(customersPage.saveButton).toBeEnabled();
	});

	test('rejects a malformed email', async ({ customersPage }) => {
		const customer = newCustomer({ email: 'not-an-email' });

		await customersPage.openCreateDrawer();
		await customersPage.fillCustomer(customer);
		await customersPage.saveButton.click();

		await expect(customersPage.drawer.getByText('Invalid email address')).toBeVisible();
		await expect(customersPage.drawer).toBeVisible();
	});
});
