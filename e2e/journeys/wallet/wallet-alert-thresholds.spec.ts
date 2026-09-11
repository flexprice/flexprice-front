import { test, expect } from '../../fixtures/test';
import { newCustomer } from '../../data/testData';

/**
 * The complete wallet lifecycle this branch adds: create a wallet, then configure
 * its balance alerts using either an Absolute (currency) or Percentage threshold.
 *
 * `describe.serial`, mirroring golden-path/catalogue-to-subscription.spec.ts: each
 * step depends on the wallet and alert configuration the previous step left behind,
 * so the report should name exactly which step in the chain broke rather than one
 * opaque failure. Playwright still gives every test its own `page` even inside a
 * serial block, so each step re-navigates to the customer's wallet tab — what
 * persists between steps is server state (the wallet, its saved alert settings),
 * not browser state.
 *
 * The customer is created once in `beforeAll`, not via the `existingCustomer`
 * fixture: that fixture is test-scoped, so it hands each of the five serial tests
 * a *different* freshly-created customer — exactly the kind of thing this spec
 * needs to be one wallet's lifecycle across all five. Creating it directly over the
 * API keeps the same "arrange the precondition over the API" rule the fixture
 * itself follows, just shared across the whole describe block instead of per test.
 */
test.describe.serial('Wallet creation and alert thresholds @critical', () => {
	let customerId: string;

	test.beforeAll(async ({ api }) => {
		const customer = await api.createCustomer(newCustomer());
		customerId = customer.id;
	});

	test.afterAll(async ({ api }) => {
		// The backend refuses to delete a customer that still has a wallet, so this
		// must run before the customer itself is deleted.
		await api.terminateWalletsForCustomer(customerId);
		await api.deleteCustomer(customerId);
	});

	test('1. creates a USD wallet for the customer', async ({ customerWalletPage, app, page }) => {
		await customerWalletPage.goto(customerId);

		await customerWalletPage.createWallet('USD');

		await app.expectToast('Wallet created successfully');
		// Appears twice — the wallet selector and the details card both show the name —
		// `.first()` is enough to prove the wallet actually landed.
		await expect(page.getByText('Prepaid Wallet - USD', { exact: true }).first()).toBeVisible();
	});

	test('2. enables alerts and saves an absolute critical threshold', async ({ customerWalletPage, app }) => {
		await customerWalletPage.goto(customerId);
		await customerWalletPage.openAlertSettings();

		await customerWalletPage.setAlertsEnabled(true);
		await customerWalletPage.setThreshold('Critical', '10');
		await customerWalletPage.saveAlertSettings();

		await app.expectToast('Alert settings updated successfully');
		await expect(customerWalletPage.alertDialog).toBeHidden();

		// Reopen to prove the write actually landed, not just that the client-side
		// state looked right before the request resolved.
		await customerWalletPage.openAlertSettings();
		await expect(customerWalletPage.thresholdTypeControl.getByRole('button', { name: 'Absolute' })).toHaveAttribute(
			'aria-pressed',
			'true',
		);
		await expect(customerWalletPage.thresholdValue('Critical')).toHaveValue('10');
	});

	test('3. switching threshold type is non-destructive', async ({ customerWalletPage }) => {
		await customerWalletPage.goto(customerId);
		await customerWalletPage.openAlertSettings();

		// Absolute "10" from step 2, confirmed by the same reopen check that step 2 ends on.
		await expect(customerWalletPage.thresholdValue('Critical')).toHaveValue('10');

		await customerWalletPage.chooseThresholdType('Percentage');

		// A fresh mode starts with its own (empty) draft — the Absolute "10" is held
		// separately, not shown or overwritten here.
		await expect(customerWalletPage.thresholdValue('Critical')).toHaveValue('');

		await customerWalletPage.setThreshold('Critical', '25');
		await customerWalletPage.chooseThresholdType('Absolute');

		await expect(customerWalletPage.thresholdValue('Critical')).toHaveValue('10');

		await customerWalletPage.chooseThresholdType('Percentage');
		await expect(customerWalletPage.thresholdValue('Critical')).toHaveValue('25');

		// Neither switch was saved — only Save Changes persists a mode. Leaving the
		// dialog without saving keeps step 2's Absolute "10" as what step 4 loads.
		await customerWalletPage.alertDialog.getByRole('button', { name: 'Cancel', exact: true }).click();
	});

	test('4. rejects a percentage threshold outside 0-100 on save', async ({ customerWalletPage, app }) => {
		await customerWalletPage.goto(customerId);
		await customerWalletPage.openAlertSettings();

		await customerWalletPage.chooseThresholdType('Percentage');
		await customerWalletPage.setThreshold('Critical', '150');
		await customerWalletPage.saveAlertSettings();

		await app.expectToast('Critical threshold must be between 0 and 100.');
		// Rejected client-side before any request — the dialog stays open on the
		// invalid value rather than silently discarding it.
		await expect(customerWalletPage.alertDialog).toBeVisible();
		await expect(customerWalletPage.thresholdValue('Critical')).toHaveValue('150');
	});

	test('5. saves a valid percentage threshold', async ({ customerWalletPage, app }) => {
		await customerWalletPage.goto(customerId);
		await customerWalletPage.openAlertSettings();

		await customerWalletPage.chooseThresholdType('Percentage');
		await customerWalletPage.setThreshold('Critical', '25');
		await customerWalletPage.saveAlertSettings();

		await app.expectToast('Alert settings updated successfully');
		await expect(customerWalletPage.alertDialog).toBeHidden();

		await customerWalletPage.openAlertSettings();
		await expect(customerWalletPage.thresholdTypeControl.getByRole('button', { name: 'Percentage' })).toHaveAttribute(
			'aria-pressed',
			'true',
		);
		await expect(customerWalletPage.thresholdValue('Critical')).toHaveValue('25');
	});
});
