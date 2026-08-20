import { describe, expect, it } from 'vitest';
import { formatProviderName, getProviderLogo } from './providerMarks';

describe('providerMarks', () => {
	it('title-cases provider ids', () => {
		expect(formatProviderName('aws_marketplace')).toBe('Aws Marketplace');
	});

	it('resolves zoho_books to the zoho catalog mark', () => {
		expect(getProviderLogo('zoho_books')?.logo).toBe(getProviderLogo('zoho')?.logo);
		expect(getProviderLogo('stripe')?.logo).toBeTruthy();
	});
});
