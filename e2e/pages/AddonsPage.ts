import { Page, Locator, expect } from '@playwright/test';
import { dialog, expectPageLoaded, rowContaining } from '../utils/selectors';

/**
 * Addons list and its create drawer.
 *
 * Same shape as the plan drawer — "Create" for a new addon, "Save" when editing —
 * and the same reason for addressing fields by placeholder: AddonDrawer passes no
 * `id` to Input, so the visible label is not associated with the control.
 *
 * Unlike plans and customers, the lookup key here is *not* derived from the name;
 * both fields have to be filled before Create enables.
 */
export class AddonsPage {
	constructor(private readonly page: Page) {}

	static readonly path = '/product-catalog/addons';

	async goto(): Promise<void> {
		await this.page.goto(AddonsPage.path);
		await expectPageLoaded(this.page, 'Addons');
	}

	get addButton(): Locator {
		return this.page.getByRole('button', { name: 'Add', exact: true });
	}

	get drawer(): Locator {
		return dialog(this.page);
	}

	get nameInput(): Locator {
		return this.drawer.getByPlaceholder('Enter a name for the addon', { exact: true });
	}

	get lookupKeyInput(): Locator {
		return this.drawer.getByPlaceholder('Enter a slug for the addon', { exact: true });
	}

	get createButton(): Locator {
		return this.drawer.getByRole('button', { name: 'Create', exact: true });
	}

	async openCreateDrawer(): Promise<void> {
		await this.addButton.click();
		await expect(this.drawer).toBeVisible();
		await expect(this.drawer.getByText('Create Addon')).toBeVisible();
	}

	async fillAddon(fields: { name: string; lookupKey: string }): Promise<void> {
		await this.nameInput.fill(fields.name);
		await this.lookupKeyInput.fill(fields.lookupKey);
	}

	row(name: string): Locator {
		return rowContaining(this.page, name);
	}
}
