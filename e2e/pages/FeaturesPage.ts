import { Page, Locator, expect } from '@playwright/test';
import { expectPageLoaded, rowContaining, selectByLabel } from '../utils/selectors';

/**
 * Features list and the full-page create form behind it.
 *
 * Creating a feature is a page, not a drawer — `/product-catalog/features/create-feature`.
 * A Boolean feature is the cheapest thing to create: metered features additionally
 * require an event name, an aggregation function and an aggregation field, none of
 * which are the subject of a flow test about navigating the catalogue.
 */
export class FeaturesPage {
	constructor(private readonly page: Page) {}

	static readonly path = '/product-catalog/features';
	static readonly createPath = '/product-catalog/features/create-feature';

	async goto(): Promise<void> {
		await this.page.goto(FeaturesPage.path);
		await expectPageLoaded(this.page, 'Features');
	}

	async gotoCreate(): Promise<void> {
		await this.page.goto(FeaturesPage.createPath);
		await expect(this.nameInput).toBeVisible();
	}

	get nameInput(): Locator {
		// AddFeature passes no `id` to Input, so the field's accessible name is its
		// placeholder rather than the "Name*" label rendered beside it.
		return this.page.getByPlaceholder('Enter a name for the feature', { exact: true });
	}

	get saveButton(): Locator {
		return this.page.getByRole('button', { name: 'Save', exact: true });
	}

	async chooseType(type: 'Metered' | 'Boolean' | 'Static'): Promise<void> {
		await selectByLabel(this.page, 'Type*', type);
	}

	row(name: string): Locator {
		return rowContaining(this.page, name);
	}
}
