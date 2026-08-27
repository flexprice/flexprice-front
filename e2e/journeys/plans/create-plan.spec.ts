import { test, expect } from '../../fixtures/test';
import { newPlan } from '../../data/testData';

/**
 * Creating a plan through the drawer — the UI path is the behaviour under test here,
 * so nothing about it is short-circuited over the API.
 *
 * Plans created this way never expose their id to the test, so cleanup resolves them
 * by name in afterEach. Doing it there rather than at the end of the test body means
 * a failing assertion still cleans up, instead of leaving `e2e-plan-*` rows behind in
 * the catalogue of a shared tenant every time something breaks.
 */
test.describe('Create plan @critical', () => {
	const created: string[] = [];

	test.afterEach(async ({ api }) => {
		while (created.length > 0) {
			await api.deletePlanByName(created.pop()!);
		}
	});

	test('creates a plan and shows it in the list after a reload', async ({ plansPage, page }) => {
		const plan = newPlan();

		await plansPage.goto();
		await plansPage.openCreateDrawer();
		await plansPage.fillPlan(plan);
		created.push(plan.name);
		await plansPage.createButton.click();

		// Creating a plan takes you straight to it, rather than back to the list.
		await expect(page).toHaveURL(/\/product-catalog\/plan\/[^/]+/);
		await expect(plansPage.drawer).toBeHidden();

		// Then back to the list, which is what proves the plan actually reached the
		// catalogue rather than only the page the redirect landed on.
		await plansPage.goto();
		await expect(plansPage.row(plan.name)).toBeVisible();
	});

	test('derives the lookup key from the plan name', async ({ plansPage }) => {
		const plan = newPlan();

		await plansPage.goto();
		await plansPage.openCreateDrawer();

		// The drawer auto-fills lookup_key as `plan-<slugified name>` on every name
		// change, so the two fields are not independently required — asserting that
		// derivation is what actually describes the drawer's behaviour.
		await plansPage.nameInput.fill(plan.name);

		await expect(plansPage.lookupKeyInput).toHaveValue(`plan-${plan.name.toLowerCase().replace(/\s/g, '-')}`);
		await expect(plansPage.createButton).toBeEnabled();
	});
});
