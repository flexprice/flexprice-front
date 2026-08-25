import { test, expect } from '../fixtures/test';

/**
 * Visual regression, applied narrowly.
 *
 * Snapshots are valuable on stable, composed surfaces where a layout break is the
 * bug and no assertion would catch it. They are actively harmful on tables, lists,
 * dashboards and anything showing live data or timestamps, where every run differs
 * and the suite turns into a diff-approval ritual.
 *
 * Good candidates here: the login page, the pricing widget, checkout, the customer
 * portal. Bad candidates: every list page in the dashboard.
 *
 * Baselines are platform-specific — Playwright suffixes them with the OS — so a
 * macOS baseline will not match a Linux CI runner. Generate them in the Playwright
 * Docker image; see e2e/README.md.
 */
test.describe('Login page appearance @visual', () => {
	test('matches the approved layout', async ({ loginPage, page }) => {
		await loginPage.goto();

		// Fonts settle after first paint; comparing before they do produces a diff
		// on every run that has nothing to do with layout.
		await page.evaluate(() => document.fonts.ready);

		await expect(page).toHaveScreenshot('login-page.png', {
			// Antialiasing differs slightly even on identical platforms.
			maxDiffPixelRatio: 0.01,
			animations: 'disabled',
			fullPage: true,
		});
	});
});
