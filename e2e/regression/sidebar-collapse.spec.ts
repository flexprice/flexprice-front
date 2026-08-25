import { test, expect } from '../fixtures/test';

/**
 * Regressions in the collapsed sidebar. Both of these shipped broken once; each test
 * is written as the sequence a person performed, with the assertion on the thing that
 * was actually wrong rather than on the markup around it.
 */
test.describe('Sidebar collapse @regression', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/home');
	});

	/**
	 * Quarantined, not deleted — this documents a real gap that is still open.
	 *
	 * Collapsed, the rail renders only top-level entries: clicking "Billing" follows
	 * its own href to /billing/customers and shows a tooltip, and the nested list
	 * (Customers, Subscriptions, Invoices, …) is never rendered. Expanded, that same
	 * click sets aria-expanded and reveals all six children.
	 *
	 * So everything below the top level is unreachable without expanding the rail
	 * first. `fixme` keeps the expected behaviour written down and visibly disabled
	 * rather than quietly passing; remove it when the collapsed rail grows a flyout.
	 */
	test.fixme('still exposes nested entries while collapsed', async ({ app, page }) => {
		await app.collapseSidebar();

		await app.navLink('Billing').click();
		await expect(app.navLink('Invoices')).toBeVisible();

		await app.navLink('Invoices').click();
		await expect(page).toHaveURL(/\/billing\/invoices/);
		await app.expectPage('Invoices');
	});

	/**
	 * Collapsing writes a `sidebar:state` cookie that SidebarProvider seeds its
	 * initial state from on mount. The write predated the read, so the rail used to
	 * reopen expanded on every load no matter what the user chose — both directions
	 * are asserted so an inverted or ignored cookie fails here.
	 */
	test('remembers the rail state across a reload', async ({ app, page }) => {
		await app.collapseSidebar();
		await page.reload();
		await expect.poll(() => app.isSidebarCollapsed()).toBe(true);

		await app.expandSidebar();
		await page.reload();
		await expect.poll(() => app.isSidebarCollapsed()).toBe(false);
	});
});
