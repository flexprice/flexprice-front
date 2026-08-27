import { Page, Locator, expect } from '@playwright/test';
import { dialog, expectPageLoaded, rowContaining } from '../utils/selectors';

/**
 * Plans list and the create/edit drawer behind its "Add" CTA.
 *
 * The drawer's submit reads "Create" for a new plan and "Save" when editing — the
 * two are distinct locators rather than one loose regex, so a drawer that opens in
 * the wrong mode fails here instead of silently doing the other thing.
 *
 * Addressed by placeholder for the same reason as CustomersPage: PlanDrawer passes
 * no `id`, so its inputs carry no associated label.
 */
export class PlansPage {
	constructor(private readonly page: Page) {}

	static readonly path = '/product-catalog/plan';

	async goto(): Promise<void> {
		await this.page.goto(PlansPage.path);
		await expectPageLoaded(this.page, 'Plans');
	}

	get addButton(): Locator {
		return this.page.getByRole('button', { name: 'Add', exact: true });
	}

	get drawer(): Locator {
		return dialog(this.page);
	}

	get nameInput(): Locator {
		return this.drawer.getByPlaceholder('Enter a name for the plan', { exact: true });
	}

	get lookupKeyInput(): Locator {
		return this.drawer.getByPlaceholder('Enter a slug for the plan', { exact: true });
	}

	get descriptionInput(): Locator {
		return this.drawer.getByPlaceholder('Enter description', { exact: true });
	}

	get createButton(): Locator {
		return this.drawer.getByRole('button', { name: 'Create', exact: true });
	}

	get saveButton(): Locator {
		return this.drawer.getByRole('button', { name: 'Save', exact: true });
	}

	async openCreateDrawer(): Promise<void> {
		await this.addButton.click();
		await expect(this.drawer).toBeVisible();
		await expect(this.drawer.getByText('Create Plan')).toBeVisible();
	}

	async fillPlan(fields: { name: string; lookupKey: string; description?: string }): Promise<void> {
		await this.nameInput.fill(fields.name);
		await this.lookupKeyInput.fill(fields.lookupKey);
		if (fields.description) await this.descriptionInput.fill(fields.description);
	}

	row(name: string): Locator {
		return rowContaining(this.page, name);
	}
}
