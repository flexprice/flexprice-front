// src/components/atoms/ShortPagination/ShortPaginationControls.test.tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom';
import { createInstance } from 'i18next';
import { I18nextProvider } from 'react-i18next';
import enCommon from '@/i18n/locales/en/common.json';
import { ShortPaginationControls } from './ShortPaginationControls';

describe('ShortPaginationControls', () => {
	it('renders real translated pagination text through a host i18next instance (regression test for the router-leak/i18n-bundling fix)', () => {
		const instance = createInstance();
		instance.init({
			lng: 'en',
			fallbackLng: 'en',
			ns: ['common'],
			defaultNS: 'common',
			resources: {
				en: {
					common: {
						...enCommon,
						// Deliberately distinct from the bundled fallback string in ShortPaginationControls.i18n.ts,
						// so this test can only pass if the component genuinely resolves text through the HOST's
						// `t` (host-precedence), not the bundled fallback which would produce a different string.
						pagination: { ...enCommon.pagination, showingRange: 'HOST-OVERRIDE {{start}}-{{end}}/{{total}} {{unit}}' },
					},
				},
			},
		});
		render(
			<I18nextProvider i18n={instance}>
				<ShortPaginationControls page={1} pageSize={10} totalItems={25} onPageChange={vi.fn()} unit='items' />
			</I18nextProvider>,
		);
		// Must resolve through the HOST's real common.json override — not the bundled fallback text, and never a raw key.
		expect(screen.getByText('HOST-OVERRIDE 1-10/25 items')).toBeInTheDocument();
		expect(screen.queryByText('pagination.showingRange')).not.toBeInTheDocument();
	});

	it('renders the bundled English default when no host i18next instance is present', () => {
		render(<ShortPaginationControls page={1} pageSize={10} totalItems={25} onPageChange={vi.fn()} unit='items' />);
		expect(screen.getByText('Showing 1 to 10 of 25 items')).toBeInTheDocument();
	});

	it('resyncs the controlled page to 1 when the total shrinks below the current page (page 2 -> page 1)', () => {
		const onPageChange = vi.fn();
		// page=2 with pageSize=10 was valid when totalItems was e.g. 15; after a delete/filter drops
		// totalItems to 5, page 2 no longer exists — the component must clamp and notify the parent.
		render(<ShortPaginationControls page={2} pageSize={10} totalItems={5} onPageChange={onPageChange} unit='items' />);
		expect(onPageChange).toHaveBeenCalledWith(1);
	});

	it('does not call onPageChange when the current page is already in range', () => {
		const onPageChange = vi.fn();
		render(<ShortPaginationControls page={1} pageSize={10} totalItems={25} onPageChange={onPageChange} unit='items' />);
		expect(onPageChange).not.toHaveBeenCalled();
	});
});
