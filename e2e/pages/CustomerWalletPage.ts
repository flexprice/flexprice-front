import { Page, Locator, expect } from '@playwright/test';
import { dialog } from '../utils/selectors';

export type WalletAlertLevelTitle = 'Critical' | 'Warning' | 'Info';
export type WalletAlertThresholdType = 'Absolute' | 'Percentage';

/**
 * A customer's Wallet tab: creating a wallet and, once one exists, its Alert
 * Settings dialog (Absolute/Percentage thresholds).
 *
 * The wallet actions trigger (⋮) is icon-only with no accessible name — the app
 * gives it `aria-haspopup="menu"` but no `aria-label`, so it is addressed by that
 * attribute rather than by role+name. Radix's own menu items do carry a proper
 * `role="menuitem"` and their visible text as accessible name.
 *
 * The thresholds are three always-present rows (WalletAlertThresholdSection), not
 * add/remove cards. Each row's input carries an explicit `aria-label` of
 * "<Severity> — <condition copy>", so a level is addressed directly by that label
 * rather than by scoping to a card and hunting for a role inside it.
 */
export class CustomerWalletPage {
	constructor(private readonly page: Page) {}

	async goto(customerId: string): Promise<void> {
		await this.page.goto(`/billing/customers/${customerId}`);
		await this.walletTab.click();
		await expect(this.walletTab).toHaveAttribute('aria-selected', 'true');
	}

	get walletTab(): Locator {
		return this.page.getByRole('tab', { name: 'Wallet' });
	}

	// ---- Empty state / wallet actions -------------------------------------------------

	get addWalletButton(): Locator {
		return this.page.getByRole('button', { name: 'Add Wallet', exact: true });
	}

	/** Icon-only "⋮" trigger beside Topup Wallet, present once a wallet already exists. */
	get walletActionsTrigger(): Locator {
		return this.page.locator('button[aria-haspopup="menu"]');
	}

	async openWalletActions(): Promise<void> {
		await this.walletActionsTrigger.click();
	}

	menuItem(name: string): Locator {
		return this.page.getByRole('menuitem', { name, exact: true });
	}

	get walletDetailsBalanceBadge(): Locator {
		return this.page.getByText(/balance (below|above)/i);
	}

	// ---- Create Wallet dialog ----------------------------------------------------------

	get createWalletDialog(): Locator {
		return dialog(this.page);
	}

	async openCreateWalletDialog(): Promise<void> {
		// The wallet list is behind its own query, so the tab renders a loading
		// skeleton before settling on either the empty-state CTA or the wallet
		// details view — wait for that to resolve before branching, rather than
		// taking an `isVisible()` snapshot that can race the skeleton.
		const trigger = this.addWalletButton.or(this.walletActionsTrigger);
		await expect(trigger.first()).toBeVisible();

		// Present via the empty-state CTA for a customer's first wallet, and via the
		// "Create Wallet" menu item once one already exists.
		if (await this.addWalletButton.isVisible()) {
			await this.addWalletButton.click();
		} else {
			await this.openWalletActions();
			await this.menuItem('Create Wallet').click();
		}
		await expect(this.createWalletDialog.getByText('Create Wallet', { exact: true })).toBeVisible();
	}

	async chooseCurrency(code: string): Promise<void> {
		// CurrencyPriceUnitSelector's <label> is not `for`-bound to the trigger, and its
		// accessible name did not resolve reliably via getByRole in practice, so this
		// addresses the verified DOM adjacency instead: the label is immediately
		// followed by the combobox trigger.
		await this.createWalletDialog.locator('label:text-is("Currency") + button[role="combobox"]').click();
		await this.page.getByRole('option', { name: code, exact: true }).click();
	}

	get saveWalletButton(): Locator {
		return this.createWalletDialog.getByRole('button', { name: 'Save Wallet', exact: true });
	}

	async createWallet(currency: string): Promise<void> {
		await this.openCreateWalletDialog();
		await this.chooseCurrency(currency);
		await this.saveWalletButton.click();
		await expect(this.createWalletDialog).toBeHidden();
	}

	// ---- Alert Settings dialog -----------------------------------------------------------

	get alertDialog(): Locator {
		return dialog(this.page);
	}

	async openAlertSettings(): Promise<void> {
		await this.openWalletActions();
		await this.menuItem('Alert Settings').click();
		await expect(this.alertDialog.getByText('Wallet Alert Settings', { exact: true })).toBeVisible();
	}

	get enableAlertsSwitch(): Locator {
		return this.alertDialog.getByRole('switch');
	}

	async setAlertsEnabled(enabled: boolean): Promise<void> {
		if ((await this.enableAlertsSwitch.isChecked()) !== enabled) await this.enableAlertsSwitch.click();
	}

	get thresholdTypeControl(): Locator {
		return this.alertDialog.getByRole('group', { name: 'Threshold type' });
	}

	async chooseThresholdType(type: WalletAlertThresholdType): Promise<void> {
		await this.thresholdTypeControl.getByRole('button', { name: type, exact: true }).click();
	}

	/**
	 * A level's threshold input.
	 *
	 * The row renders an explicit `aria-label` combining the severity and the fixed
	 * condition copy ("Critical — Balance below"), which is a stable accessible name and
	 * removes the need to scope to a container first. Note the input is a textbox, not a
	 * `spinbutton`: the row uses the Input atom's `variant="number"` for keystroke
	 * filtering but passes no `type`, so it renders as `<input type="text">`.
	 */
	thresholdValue(title: WalletAlertLevelTitle): Locator {
		return this.alertDialog.getByLabel(`${title} — Balance below`);
	}

	/**
	 * Sets a level's threshold. Every level is always present, so there is nothing to add
	 * first — clearing the field is how a level is left unconfigured.
	 */
	async setThreshold(title: WalletAlertLevelTitle, value: string): Promise<void> {
		await this.thresholdValue(title).fill(value);
	}

	get saveAlertSettingsButton(): Locator {
		return this.alertDialog.getByRole('button', { name: 'Save Changes', exact: true });
	}

	async saveAlertSettings(): Promise<void> {
		await this.saveAlertSettingsButton.click();
	}
}
