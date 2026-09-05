import { useState } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter, useLocation } from 'react-router';
import { describe, it, expect, vi, beforeEach, afterEach, beforeAll } from 'vitest';
import { SidebarProvider } from '@/components/ui';
import SidebarItem from './SidebarItem';

// jsdom does not implement matchMedia; useIsMobile() (pulled in transitively via
// SidebarProvider) calls it on mount, so every test in this file needs a stub.
beforeAll(() => {
	window.matchMedia =
		window.matchMedia ||
		((query: string) =>
			({
				matches: false,
				media: query,
				onchange: null,
				addListener: () => {},
				removeListener: () => {},
				addEventListener: () => {},
				removeEventListener: () => {},
				dispatchEvent: () => false,
			}) as unknown as MediaQueryList);
});

function LocationProbe() {
	const location = useLocation();
	return <div data-testid='pathname'>{location.pathname}</div>;
}

/** Mirrors how SidebarMenu drives SidebarItem: `isOpen`/`onToggle` are controlled. */
function ProductCatalogHarness() {
	const [isOpen, setIsOpen] = useState(false);
	return (
		<>
			<SidebarItem
				title='Product Catalog'
				url='/product-catalog/features'
				isOpen={isOpen}
				onToggle={setIsOpen}
				items={[
					{ title: 'Features', url: '/product-catalog/features' },
					{ title: 'Plans', url: '/product-catalog/plan' },
				]}
			/>
			<LocationProbe />
		</>
	);
}

describe('SidebarItem', () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	// Regression test for a race: the parent item's own click handler defers
	// `navigate(item.url)` by 100ms (to let the accordion's open animation start).
	// Clicking a specific child in that window used to still get silently
	// overridden once the deferred navigate fired, landing the user back on the
	// parent's default page instead of the child they picked.
	it('does not override a child navigation made while the parent has a deferred navigate pending', () => {
		render(
			<MemoryRouter initialEntries={['/home']}>
				<SidebarProvider>
					<ProductCatalogHarness />
				</SidebarProvider>
			</MemoryRouter>,
		);

		// Opens the section and schedules navigate('/product-catalog/features') ~100ms out.
		fireEvent.click(screen.getByRole('link', { name: 'Product Catalog' }));

		// Picks a specific child before that deferred navigate fires.
		fireEvent.click(screen.getByRole('link', { name: 'Plans' }));

		// Let the parent's deferred navigate's timer elapse.
		act(() => {
			vi.advanceTimersByTime(150);
		});

		expect(screen.getByTestId('pathname')).toHaveTextContent('/product-catalog/plan');
	});

	it('still follows through with the deferred navigate when nothing else navigated in the meantime', () => {
		render(
			<MemoryRouter initialEntries={['/home']}>
				<SidebarProvider>
					<ProductCatalogHarness />
				</SidebarProvider>
			</MemoryRouter>,
		);

		fireEvent.click(screen.getByRole('link', { name: 'Product Catalog' }));
		act(() => {
			vi.advanceTimersByTime(150);
		});

		expect(screen.getByTestId('pathname')).toHaveTextContent('/product-catalog/features');
	});
});
