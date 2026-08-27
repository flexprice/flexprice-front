import { expect, Locator, Page } from '@playwright/test';

/**
 * Cross-cutting locators shared by more than one page object.
 *
 * The selector policy, in order of preference:
 *
 *   1. getByRole   — how a user and a screen reader find it
 *   2. getByLabel  — form fields; the app labels its inputs with a real <label for>
 *   3. getByText   — toasts and copy
 *   4. getByTestId — add a data-testid when nothing above is stable
 *   5. CSS / XPath — last resort, and each use carries a comment saying why
 *
 * Never select on Tailwind classes or nth-child. Both change when someone restyles a
 * component that was otherwise working, which produces failures that teach the team
 * to ignore this suite.
 */

/** Radix renders Sheet and Dialog alike with role="dialog". */
export function dialog(page: Page): Locator {
	return page.getByRole('dialog');
}

/** A table row addressed by content rather than position. */
export function rowContaining(page: Page, text: string): Locator {
	return page.getByRole('row').filter({ hasText: text });
}

/**
 * react-hot-toast messages. `.first()` because a run that triggers two toasts in
 * quick succession would otherwise fail strict-mode locator resolution.
 */
export function toast(page: Page, text: string | RegExp): Locator {
	return page.getByText(text).first();
}

/**
 * Picks an option from one of the app's Select dropdowns, addressed by its label.
 *
 * The Select atom labels its Radix trigger properly (`<label for>` → trigger `id`), so the
 * combobox is reachable by its visible label text — no structural walk needed. `label` is the
 * label exactly as rendered, asterisk included (e.g. `'Type*'`).
 */
export async function selectByLabel(page: Page, label: string, option: string): Promise<void> {
	await page.getByLabel(label, { exact: true }).click();

	// Not `exact`: several of the app's Select options render a description beside
	// the label (feature type, pricing model), so the option's accessible name is
	// "Boolean Functionality that customers can either have access to…" rather than
	// "Boolean". Substring matching is what actually addresses them.
	await page.getByRole('option', { name: option }).first().click();
}

/**
 * Asserts the named screen is the one currently loaded.
 *
 * Deliberately not `getByRole('heading')`: the Page atom renders its title through
 * SectionHeader as a plain `<div>`, so no page title in the dashboard has a heading
 * role at all. Matching the visible text instead is ambiguous — "Customers" is also
 * a sidebar link — so this uses the document title, which the Page atom sets to
 * `<title> | <brand>` and which is unambiguous per screen.
 */
export async function expectPageLoaded(page: Page, title: string): Promise<void> {
	await expect(page).toHaveTitle(new RegExp(`^${escapeRegExp(title)}\\b`));
}

function escapeRegExp(value: string): string {
	return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
