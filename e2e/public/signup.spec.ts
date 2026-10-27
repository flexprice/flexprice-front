import { test, expect } from '../fixtures/test';

/**
 * Signup validation.
 *
 * Every assertion here is client-side: the forms reject bad input before any
 * request is made, so these run without credentials, without a backend, and on any
 * checkout. That makes them the part of the suite a pull request actually exercises
 * today — the authenticated projects stay dark until the CI secrets exist.
 */
test.describe('Signup form @critical', () => {
	test.beforeEach(async ({ loginPage, page }) => {
		await loginPage.goto();
		await loginPage.signupTab.click();
		await expect(page.getByRole('heading', { name: 'Create your account' })).toBeVisible();
	});

	test('rejects an empty submit', async ({ page }) => {
		await page.getByRole('button', { name: 'Create Account' }).click();

		// Asserts only that the form refuses and says something — see the fixme below
		// for why it cannot currently assert *which* field is at fault.
		await expect(page.getByText('Please confirm your password')).toBeVisible();
		await expect(page.getByRole('heading', { name: 'Create your account' })).toBeVisible();
	});

	/**
	 * Quarantined: this is the behaviour the form should have, and does not.
	 *
	 * validateForm calls setErrors with a fresh object in each branch, so every call
	 * overwrites the previous one and only the last field's message survives. Submit
	 * the form empty and it reports the confirmation field alone — email and password
	 * are never mentioned, which reads as "the form is broken" rather than "fill these
	 * in". Remove the fixme once the branches accumulate into one errors object.
	 */
	test.fixme('names every missing field on an empty submit', async ({ page }) => {
		await page.getByRole('button', { name: 'Create Account' }).click();

		await expect(page.getByText('Email is required')).toBeVisible();
		await expect(page.getByText('Password is required')).toBeVisible();
		await expect(page.getByText('Please confirm your password')).toBeVisible();
	});

	test('rejects a malformed email', async ({ page }) => {
		await page.getByLabel('Email', { exact: true }).fill('not-an-email');
		await page.getByLabel('Password', { exact: true }).fill('correct-horse');
		await page.getByLabel('Confirm Password', { exact: true }).fill('correct-horse');
		await page.getByRole('button', { name: 'Create Account' }).click();

		await expect(page.getByText('Please enter a valid email address')).toBeVisible();
	});

	test('rejects a password under six characters', async ({ page }) => {
		await page.getByLabel('Email', { exact: true }).fill('e2e@flexprice.invalid');
		await page.getByLabel('Password', { exact: true }).fill('short');
		await page.getByLabel('Confirm Password', { exact: true }).fill('short');
		await page.getByRole('button', { name: 'Create Account' }).click();

		await expect(page.getByText('Password must be at least 6 characters long')).toBeVisible();
	});

	test('rejects a confirmation that does not match', async ({ page }) => {
		await page.getByLabel('Email', { exact: true }).fill('e2e@flexprice.invalid');
		await page.getByLabel('Password', { exact: true }).fill('correct-horse');
		await page.getByLabel('Confirm Password', { exact: true }).fill('battery-staple');
		await page.getByRole('button', { name: 'Create Account' }).click();

		await expect(page.getByText('Passwords do not match')).toBeVisible();
	});

	test('returns to login from the signup tab', async ({ loginPage, page }) => {
		await loginPage.loginTab.click();

		await expect(page.getByRole('heading', { name: 'Login to your account' })).toBeVisible();
	});
});
