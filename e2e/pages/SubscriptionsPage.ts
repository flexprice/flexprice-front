import { Page, Locator, expect } from '@playwright/test';
import { expectPageLoaded, rowContaining } from '../utils/selectors';

/**
 * Subscriptions list. Creating a subscription navigates to its own page rather than
 * opening a drawer, so this exposes the entry point and leaves the multi-step form
 * to the journey that exercises it.
 */
export class SubscriptionsPage {
	constructor(private readonly page: Page) {}

	static readonly path = '/billing/subscriptions';

	async goto(): Promise<void> {
		await this.page.goto(SubscriptionsPage.path);
		await expectPageLoaded(this.page, 'Subscriptions');
	}

	get addButton(): Locator {
		return this.page.getByRole('button', { name: 'Add', exact: true });
	}

	row(text: string): Locator {
		return rowContaining(this.page, text);
	}

	/** Opens a subscription's detail page from the list. */
	async open(text: string): Promise<void> {
		await this.row(text).click();
		await expect(this.page).toHaveURL(/\/billing\/subscriptions\/[^/]+/);
	}
}
