import { test, expect } from '../../fixtures/test';

/**
 * Navigation is the highest-traffic surface in the dashboard and its failures are
 * behavioural rather than visual — a section that opens but shows nothing, an entry
 * that highlights without changing the page. Asserting the destination rendered,
 * not merely that a link exists, is what makes these worth running.
 */
test.describe('Sidebar navigation @critical', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/home');
	});

	test('opens a nested section and navigates to its child', async ({ app, page }) => {
		await app.gotoViaSidebar('Billing', 'Customers');

		await expect(page).toHaveURL(/\/billing\/customers/);
		await app.expectPage('Customers');
	});

	test('reaches the product catalog through its nested entries', async ({ app, page }) => {
		await app.gotoViaSidebar('Product Catalog', 'Plans');

		await expect(page).toHaveURL(/\/product-catalog\/plan/);
		await app.expectPage('Plans');
	});
});
