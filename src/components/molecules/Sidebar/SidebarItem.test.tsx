import { render, screen, fireEvent, act } from '@testing-library/react';
import { useState } from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MemoryRouter } from 'react-router';
import SidebarItem from './SidebarItem';
import { SidebarProvider } from '@/components/ui';

const mockNavigate = vi.hoisted(() => vi.fn());

// SidebarProvider's useIsMobile hook reads this; jsdom doesn't implement it.
window.matchMedia =
	window.matchMedia ||
	((query: string) => ({
		matches: false,
		media: query,
		onchange: null,
		addListener: vi.fn(),
		removeListener: vi.fn(),
		addEventListener: vi.fn(),
		removeEventListener: vi.fn(),
		dispatchEvent: vi.fn(),
	}));

vi.mock('react-router', async () => {
	const actual = await vi.importActual<typeof import('react-router')>('react-router');
	return { ...actual, useNavigate: () => mockNavigate };
});

const baseItem = {
	title: 'Product Catalog',
	url: '/product-catalog/features',
	items: [
		{ title: 'Features', url: '/product-catalog/features' },
		{ title: 'Plans', url: '/product-catalog/plan' },
	],
};

/** Mirrors SidebarMenu.tsx's own open/close state wiring, so a click that toggles
 *  `isOpen` actually re-renders the Collapsible open, exposing the same timing
 *  the real sidebar has - rendering SidebarItem with a static `isOpen` prop would
 *  never open the section a click is meant to open. */
const StatefulSidebarItem = ({ initialOpen = false }: { initialOpen?: boolean }) => {
	const [isOpen, setIsOpen] = useState(initialOpen);
	return <SidebarItem {...baseItem} isOpen={isOpen} onToggle={setIsOpen} />;
};

const renderItem = (props: { initialOpen?: boolean } = {}) =>
	render(
		<MemoryRouter>
			<SidebarProvider>
				<StatefulSidebarItem {...props} />
			</SidebarProvider>
		</MemoryRouter>,
	);

describe('SidebarItem', () => {
	beforeEach(() => {
		vi.useFakeTimers();
		mockNavigate.mockReset();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("cancels the parent section's delayed default-page navigation when a child link is clicked first", () => {
		renderItem({ initialOpen: false });

		// Opening the section schedules a delayed navigate to its own default page
		// (Features).
		act(() => {
			fireEvent.click(screen.getByText('Product Catalog'));
		});

		// Before that delay elapses, the user (or a fast automated click) goes straight
		// to a specific child instead - the section is now open, so this is reachable.
		act(() => {
			fireEvent.click(screen.getByText('Plans'));
		});

		act(() => {
			vi.advanceTimersByTime(150);
		});

		// The stale Features navigation must not fire and clobber the Plans link's own
		// (React Router native, not mocked) navigation.
		expect(mockNavigate).not.toHaveBeenCalledWith('/product-catalog/features');
	});

	it('still navigates to the default page when nothing else is clicked before the delay', () => {
		renderItem({ initialOpen: false });

		act(() => {
			fireEvent.click(screen.getByText('Product Catalog'));
		});

		act(() => {
			vi.advanceTimersByTime(150);
		});

		expect(mockNavigate).toHaveBeenCalledWith('/product-catalog/features');
	});
});
