import { describe, expect, it } from 'vitest';
import { formatProviderName, getProviderLogo } from './providerMarks';

describe('providerMarks', () => {
	it('title-cases provider ids', () => {
		expect(formatProviderName('aws_marketplace')).toBe('Aws Marketplace');
	});

	it('resolves zoho_books to the zoho catalog mark', () => {
		const zohoBooks = getProviderLogo('zoho_books');
		const zoho = getProviderLogo('zoho');
		expect(zohoBooks).toBeTruthy();
		expect(zoho).toBeTruthy();
		expect(zohoBooks?.logo).toBe(zoho?.logo);
		expect(getProviderLogo('stripe')?.logo).toBeTruthy();
	});
});
