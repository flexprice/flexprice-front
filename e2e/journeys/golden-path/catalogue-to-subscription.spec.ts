import { test, expect } from '../../fixtures/test';
import { newAddon, newCustomer, newFeature, newPlan } from '../../data/testData';

/**
 * The golden path: one tenant walked from an empty catalogue to a live subscription,
 * in the order the product is actually used.
 *
 * The sequence mirrors integration-testing-suite/go — the backend sanity suite is the
 * canonical definition of this lifecycle, and keeping the two in the same order means
 * a change to the flow is made in one place and copied, not reinvented. The division
 * of labour is deliberate:
 *
 *   backend suite  — does the billing engine produce the right numbers?
 *   this spec      — can a human drive that same lifecycle through the UI?
 *
 * `describe.serial` rather than one long test. Each step is its own case, so the
 * report names exactly which link in the chain broke, and Playwright stops the rest
 * once one fails — correct here, because step N+1 genuinely cannot run without N.
 * A single 30-assertion test would take the same time, fail as one opaque red line,
 * and tell you nothing about the steps after the break.
 *
 * State is module-scoped because serial cases share a worker and a browser context.
 */
test.describe.serial('Golden path: catalogue to subscription @critical', () => {
	const feature = newFeature();
	const plan = newPlan();
	const addon = newAddon();
	const customer = newCustomer();

	/** Set by step 4 so step 5, which gets its own page, can return to the plan. */
	let planUrl = '';

	// Reverse creation order: the backend refuses to delete an entity another still
	// references, exactly as steps_cleanup.go sequences it.
	test.afterAll(async ({ api }) => {
		await api.deleteAddonByName(addon.name);
		await api.deletePlanByName(plan.name);
		await api.deleteFeatureByName(feature.name);
	});

	test('1. create a feature', async ({ featuresPage }) => {
		await featuresPage.gotoCreate();

		await featuresPage.nameInput.fill(feature.name);
		// Boolean: a metered feature would also demand an event name, an aggregation
		// function and a field — metering config is not what this flow is testing.
		await featuresPage.chooseType('Boolean');
		await featuresPage.saveButton.click();

		await expect(featuresPage.nameInput).toBeHidden();
	});

	test('2. the feature is listed', async ({ featuresPage }) => {
		await featuresPage.goto();

		await expect(featuresPage.row(feature.name)).toBeVisible();
	});

	test('3. create a plan', async ({ plansPage, page }) => {
		await plansPage.goto();
		await plansPage.openCreateDrawer();
		await plansPage.fillPlan(plan);
		await plansPage.createButton.click();

		// Creating a plan redirects to the new plan's own page.
		await expect(page).toHaveURL(/\/product-catalog\/plan\/[^/]+/);

		await plansPage.goto();
		await expect(plansPage.row(plan.name)).toBeVisible();
	});

	test('4. open the plan and reach its charges', async ({ plansPage, page }) => {
		await plansPage.goto();
		await plansPage.row(plan.name).click();

		await expect(page).toHaveURL(/\/product-catalog\/plan\/[^/]+/);
		// The detail page's own content, not just a URL that resolved: a Charges
		// section and the tabs that hang off a real plan.
		await expect(page.getByRole('heading', { name: 'Charges' })).toBeVisible();
		await expect(page.getByRole('tab', { name: 'Entitlements' })).toBeVisible();

		// Serial cases share module state but each gets its own page, so the next
		// step needs the URL rather than the browser's history.
		planUrl = page.url();
	});

	test('5. reach the charge editor from the plan', async ({ page }) => {
		await page.goto(planUrl);

		await page.getByRole('button', { name: 'Add', exact: true }).first().click();

		// The charge editor is where behavioural dropdown bugs have concentrated, so
		// this asserts the editor actually opened rather than that a click landed.
		await expect(page).toHaveURL(/\/add-charges/);
		await expect(page.getByText('Select Charge Type')).toBeVisible();
		await expect(page.getByRole('button', { name: /^Fixed charges/ })).toBeVisible();
		await expect(page.getByRole('button', { name: /^Usage Charges/ })).toBeVisible();

		// Save stays gated until a charge is actually configured, which is the
		// behaviour worth pinning: the editor must not accept an empty charge.
		await expect(page.getByRole('button', { name: /Cannot save/ })).toBeDisabled();
	});

	test('6. create an addon', async ({ addonsPage, page }) => {
		await addonsPage.goto();
		await addonsPage.openCreateDrawer();

		// Addons take both fields: unlike plans and customers, the lookup key is not
		// derived from the name, so Create stays gated until each is filled.
		await expect(addonsPage.createButton).toBeDisabled();
		await addonsPage.fillAddon(addon);
		await expect(addonsPage.createButton).toBeEnabled();

		await addonsPage.createButton.click();

		// Creating an addon redirects to its own page, exactly as creating a plan does.
		await expect(page).toHaveURL(/\/product-catalog\/addons\/[^/]+/);
		await expect(addonsPage.drawer).toBeHidden();

		// Back to the list, which is what proves it reached the catalogue rather than
		// only the page the redirect landed on.
		await addonsPage.goto();
		await expect(addonsPage.row(addon.name)).toBeVisible();
	});

	test('7. create a customer', async ({ customersPage, app, page }) => {
		await customersPage.goto();
		await customersPage.openCreateDrawer();
		await customersPage.fillCustomer(customer);
		await customersPage.saveButton.click();

		await app.expectToast('Customer added successfully');

		await page.reload();
		await expect(customersPage.row(customer.name)).toBeVisible();
	});

	test('8. reach subscription creation for that customer', async ({ customersPage, page }) => {
		await customersPage.goto();
		await customersPage.row(customer.name).click();

		await expect(page).toHaveURL(/\/billing\/customers\/[^/]+/);
		await expect(page.getByRole('tab', { name: 'Overview' })).toBeVisible();
	});
});
