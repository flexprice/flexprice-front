import { Page, Locator, expect } from '@playwright/test';
import { dialog, expectPageLoaded, rowContaining } from '../utils/selectors';

/**
 * Customers list and the create/edit drawer behind its "Add" CTA.
 *
 * Fields are addressed by placeholder rather than by label. The Input atom only
 * associates its `<label>` with the control when the caller passes an `id`, and
 * CreateCustomerDrawer does not — so the input's accessible name is its placeholder.
 * Placeholders come from src/i18n/locales/en/customers.json.
 */
export class CustomersPage {
	constructor(private readonly page: Page) {}

	static readonly path = '/billing/customers';

	async goto(): Promise<void> {
		await this.page.goto(CustomersPage.path);
		await expectPageLoaded(this.page, 'Customers');
	}

	get addButton(): Locator {
		return this.page.getByRole('button', { name: 'Add', exact: true });
	}

	get drawer(): Locator {
		return dialog(this.page);
	}

	get nameInput(): Locator {
		return this.drawer.getByPlaceholder('Enter Name', { exact: true });
	}

	get externalIdInput(): Locator {
		return this.drawer.getByPlaceholder('customer-', { exact: true });
	}

	get emailInput(): Locator {
		return this.drawer.getByPlaceholder('e.g. example@gmail.com', { exact: true });
	}

	get saveButton(): Locator {
		return this.drawer.getByRole('button', { name: 'Save', exact: true });
	}

	async openCreateDrawer(): Promise<void> {
		await this.addButton.click();
		await expect(this.drawer).toBeVisible();
		await expect(this.drawer.getByText('Add Customer')).toBeVisible();
	}

	async fillCustomer(fields: { name: string; externalId: string; email?: string }): Promise<void> {
		await this.nameInput.fill(fields.name);
		await this.externalIdInput.fill(fields.externalId);
		if (fields.email) await this.emailInput.fill(fields.email);
	}

	row(name: string): Locator {
		return rowContaining(this.page, name);
	}
}
