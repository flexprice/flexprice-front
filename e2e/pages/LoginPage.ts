import { Page, Locator, expect } from '@playwright/test';

export class LoginPage {
	constructor(private readonly page: Page) {}

	get email(): Locator {
		return this.page.getByLabel('Email', { exact: true });
	}

	get password(): Locator {
		return this.page.getByLabel('Password', { exact: true });
	}

	get submit(): Locator {
		return this.page.getByRole('button', { name: 'Login', exact: true });
	}

	get forgotPassword(): Locator {
		return this.page.getByRole('button', { name: 'Forgot your password?' });
	}

	async goto(): Promise<void> {
		await this.page.goto('/login');
		await expect(this.email).toBeVisible();
	}

	async login(email: string, password: string): Promise<void> {
		await this.email.fill(email);
		await this.password.fill(password);
		await this.submit.click();
	}
}
