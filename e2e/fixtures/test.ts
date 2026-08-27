import { expect } from '@playwright/test';
import { AppShell } from '../pages/AppShell';
import { LoginPage } from '../pages/LoginPage';
import { CustomersPage } from '../pages/CustomersPage';
import { PlansPage } from '../pages/PlansPage';
import { SubscriptionsPage } from '../pages/SubscriptionsPage';
import { FeaturesPage } from '../pages/FeaturesPage';
import { AddonsPage } from '../pages/AddonsPage';
import { customerFixtures } from './customer';

/**
 * The suite's entry point — specs import `test` and `expect` from here, never from
 * @playwright/test directly, so page objects and data fixtures arrive without each
 * spec constructing them.
 *
 * Composition is a chain (auth -> customer -> page objects) rather than a merge, so
 * every fixture is declared exactly once and none can shadow another.
 */
interface PageFixtures {
	app: AppShell;
	loginPage: LoginPage;
	customersPage: CustomersPage;
	plansPage: PlansPage;
	subscriptionsPage: SubscriptionsPage;
	featuresPage: FeaturesPage;
	addonsPage: AddonsPage;
}

export const test = customerFixtures.extend<PageFixtures>({
	app: async ({ page }, use) => {
		await use(new AppShell(page));
	},
	loginPage: async ({ page }, use) => {
		await use(new LoginPage(page));
	},
	customersPage: async ({ page }, use) => {
		await use(new CustomersPage(page));
	},
	plansPage: async ({ page }, use) => {
		await use(new PlansPage(page));
	},
	subscriptionsPage: async ({ page }, use) => {
		await use(new SubscriptionsPage(page));
	},
	featuresPage: async ({ page }, use) => {
		await use(new FeaturesPage(page));
	},
	addonsPage: async ({ page }, use) => {
		await use(new AddonsPage(page));
	},
});

export { expect };
