import { test, expect } from '../../fixtures/test';

/**
 * The admin half of the permission comparison in e2e/rbac/customer-permissions.spec.ts.
 * Kept here because it runs as the primary account like every other journey; the two
 * files are only meaningful read together.
 */
test.describe('Customer permissions (admin) @critical', () => {
	test('an account with write access can open the create drawer', async ({ customersPage }) => {
		await customersPage.goto();

		await expect(customersPage.addButton).toBeEnabled();
		await customersPage.openCreateDrawer();
	});
});
