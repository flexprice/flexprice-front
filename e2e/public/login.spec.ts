import { test, expect } from '../fixtures/test';

/**
 * The login page is the only screen every user meets, and it renders without a
 * backend session — so these run on any checkout, with or without credentials.
 */
test.describe('Login page @critical', () => {
	test.beforeEach(async ({ loginPage }) => {
		await loginPage.goto();
	});

	test('renders the credential form', async ({ loginPage, page }) => {
		await expect(page.getByRole('heading', { name: 'Login to your account' })).toBeVisible();
		await expect(loginPage.email).toBeVisible();
		await expect(loginPage.password).toBeVisible();
		await expect(loginPage.submit).toBeEnabled();
	});

	test('masks the password until the reveal control is used', async ({ loginPage, page }) => {
		await loginPage.password.fill('correct-horse-battery-staple');
		await expect(loginPage.password).toHaveAttribute('type', 'password');

		// The eye control is the sibling suffix inside the password field's wrapper.
		await page.locator('#password').locator('..').locator('span.cursor-pointer').click();
		await expect(loginPage.password).toHaveAttribute('type', 'text');
	});

	test('rejects a submit with no credentials instead of navigating', async ({ loginPage, page }) => {
		await loginPage.submit.click();

		await expect(page.getByText('Please enter both email and password')).toBeVisible();
		await expect(page).toHaveURL(/\/login/);
	});

	test('switches to password recovery and back', async ({ loginPage, page }) => {
		await loginPage.forgotPassword.click();
		await expect(page.getByRole('heading', { name: 'Forgot your password?' })).toBeVisible();

		await page.getByRole('button', { name: 'Back to login' }).click();
		await expect(page.getByRole('heading', { name: 'Login to your account' })).toBeVisible();
	});
});
