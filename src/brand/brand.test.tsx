import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { mergeBundles, brandNameFor } from '@/i18n';
import { parseBrandConfig } from '@/config/branding';
import { Slot } from './Slot';
import { brandRoutes } from './modules';

describe('brand pack (default: Flexprice)', () => {
	it('fills brand config from the pack', () => {
		const brand = parseBrandConfig({});
		expect(brand.id).toBe('flexprice');
		expect(brand.title).toBe('flexprice.io');
		expect(brand.links.docs).toBe('https://docs.flexprice.io');
	});

	it('lets VITE_BRAND_CONFIG override pack fields', () => {
		expect(parseBrandConfig({ name: 'Acme', title: 'Acme Billing' })).toMatchObject({
			name: 'Acme',
			title: 'Acme Billing',
			id: 'flexprice',
		});
	});

	it('resolves {{brand}} per language, falling back to the name', () => {
		expect(brandNameFor('en')).toBe('Flexprice');
		expect(brandNameFor('ar')).toBe('Flexprice');
	});

	it('renders the fallback when the pack does not override a slot', () => {
		render(<Slot name='sidebar.header' collapsed={false} fallback={<span>default header</span>} />);
		expect(screen.getByText('default header')).toBeInTheDocument();
	});

	it('adds no routes', () => {
		expect(brandRoutes).toEqual([]);
	});
});

describe('mergeBundles', () => {
	it('deep-merges overrides and keeps untouched keys', () => {
		const base = { login: { heading: 'Log in', subheading: 'Welcome back' }, other: 'x' };
		expect(mergeBundles(base, { login: { subheading: 'Hi again' } })).toEqual({
			login: { heading: 'Log in', subheading: 'Hi again' },
			other: 'x',
		});
	});

	it('does not mutate the base bundle', () => {
		const base = { a: { b: '1' } };
		mergeBundles(base, { a: { b: '2' } });
		expect(base.a.b).toBe('1');
	});
});
