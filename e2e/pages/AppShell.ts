import { Page, Locator, expect } from '@playwright/test';
import { expectPageLoaded, toast } from '../utils/selectors';

/**
 * The authenticated dashboard chrome: sidebar navigation and the toasts the app
 * uses to report the outcome of nearly every mutation.
 *
 * Sidebar entries render as real react-router <Link>s, so they are addressed by
 * role rather than by CSS. Second-level entries (Customers, Plans, Invoices …)
 * live inside a collapsible section that must be opened first.
 */
export class AppShell {
	constructor(private readonly page: Page) {}

	get sidebar(): Locator {
		return this.page.locator('nav, [data-sidebar="sidebar"]').first();
	}

	navLink(name: string): Locator {
		return this.page.getByRole('link', { name, exact: true });
	}

	/**
	 * Opens a top-level sidebar section if its children are not already visible.
	 * Clicking an already-open section would collapse it, so the visibility of the
	 * child is what decides — not a blind click.
	 */
	async openSection(section: string, child: string): Promise<void> {
		const childLink = this.navLink(child);
		if (await childLink.isVisible().catch(() => false)) return;
		await this.navLink(section).click();
		await expect(childLink).toBeVisible();
	}

	/** Navigates via the sidebar the way a person would, not by URL. */
	async gotoViaSidebar(section: string, child: string): Promise<void> {
		await this.openSection(section, child);
		await this.navLink(child).click();
	}

	/** The rail control that collapses the sidebar to icons and expands it back. */
	get sidebarToggle(): Locator {
		return this.page.getByRole('button', { name: 'Toggle Sidebar' });
	}

	async collapseSidebar(): Promise<void> {
		if (await this.isSidebarCollapsed()) return;
		await this.sidebarToggle.click();
		await expect.poll(() => this.isSidebarCollapsed()).toBe(true);
	}

	async expandSidebar(): Promise<void> {
		if (!(await this.isSidebarCollapsed())) return;
		await this.sidebarToggle.click();
		await expect.poll(() => this.isSidebarCollapsed()).toBe(false);
	}

	/**
	 * The shadcn sidebar records its own state on the wrapper as data-state,
	 * which is more reliable than measuring width while the transition animates.
	 */
	async isSidebarCollapsed(): Promise<boolean> {
		const state = await this.page
			.locator('[data-state]')
			.filter({ has: this.page.locator('[data-sidebar="sidebar"]') })
			.first()
			.getAttribute('data-state')
			.catch(() => null);
		if (state) return state === 'collapsed';
		return (await this.page.locator('[data-collapsible="icon"]').count()) > 0;
	}

	/** react-hot-toast renders its notifications into a live region. */
	toast(text: string | RegExp): Locator {
		return toast(this.page, text);
	}

	async expectToast(text: string | RegExp): Promise<void> {
		await expect(this.toast(text)).toBeVisible();
	}

	/** Asserts the named dashboard screen is the one currently loaded. */
	async expectPage(title: string): Promise<void> {
		await expectPageLoaded(this.page, title);
	}
}
