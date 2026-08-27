import { test, expect } from '../fixtures/test';

/**
 * Permission gating on the customers screen.
 *
 * Runs as its own project against the read-only account, alongside an assertion that
 * the same control *is* available to the admin. Only the pair is meaningful: showing
 * that an admin can click Add proves nothing about whether a viewer is correctly
 * stopped, and vice versa.
 *
 * The gate under test is `can('customer', 'write')` in CustomerListPage, which
 * disables the Add control and swaps in an explanatory tooltip.
 */
test.describe('Customer permissions @regression', () => {
	test('a read-only account cannot reach the create-customer drawer', async ({ customersPage }) => {
		await customersPage.goto();

		await expect(customersPage.addButton).toBeDisabled();
	});

	test('a read-only account sees why the control is unavailable', async ({ customersPage, page }) => {
		await customersPage.goto();

		// The disabled control is wrapped in a focusable span carrying the tooltip,
		// because a disabled button emits no pointer events of its own.
		await customersPage.addButton.locator('..').focus();

		await expect(page.getByText("You don't have permission to manage customers")).toBeVisible();
	});
});
