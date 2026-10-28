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

	/** The auth page is a single route with tabs; these switch between them. */
	get signupTab(): Locator {
		return this.page.getByRole('button', { name: 'Sign up' });
	}

	get loginTab(): Locator {
		return this.page.getByRole('button', { name: 'Log in' });
	}

	get backToLogin(): Locator {
		return this.page.getByRole('button', { name: 'Back to login' });
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
