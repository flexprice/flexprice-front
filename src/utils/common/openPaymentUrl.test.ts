import { describe, it, expect, vi, afterEach } from 'vitest';
import { openPaymentUrl, isSafePaymentUrl } from './openPaymentUrl';

describe('openPaymentUrl', () => {
	afterEach(() => vi.restoreAllMocks());

	it('reports success when the browser allows the open', () => {
		vi.spyOn(window, 'open').mockReturnValue({} as Window);
		expect(openPaymentUrl('https://pay.test/link')).toBe(true);
	});

	// A popup blocker returns null rather than throwing. Callers rely on this to
	// know the user still needs the link surfaced.
	it('reports failure when a popup blocker returns null', () => {
		vi.spyOn(window, 'open').mockReturnValue(null);
		expect(openPaymentUrl('https://pay.test/link')).toBe(false);
	});

	it('reports failure when the browser throws instead', () => {
		vi.spyOn(window, 'open').mockImplementation(() => {
			throw new Error('blocked');
		});
		expect(openPaymentUrl('https://pay.test/link')).toBe(false);
	});

	// window.open evaluates a javascript: URL, and noopener isolates the new context
	// without preventing that. Payment URLs are unconstrained API strings.
	it('refuses a javascript: url without calling window.open', () => {
		const open = vi.spyOn(window, 'open');
		expect(openPaymentUrl('javascript:alert(1)')).toBe(false);
		expect(open).not.toHaveBeenCalled();
	});

	it('refuses data: and file: schemes', () => {
		const open = vi.spyOn(window, 'open');
		expect(openPaymentUrl('data:text/html,<script>alert(1)</script>')).toBe(false);
		expect(openPaymentUrl('file:///etc/passwd')).toBe(false);
		expect(open).not.toHaveBeenCalled();
	});

	it('accepts http and https', () => {
		expect(isSafePaymentUrl('https://pay.test/link')).toBe(true);
		expect(isSafePaymentUrl('http://localhost:8080/pay')).toBe(true);
	});

	it('does nothing without a url', () => {
		const open = vi.spyOn(window, 'open');
		expect(openPaymentUrl('')).toBe(false);
		expect(open).not.toHaveBeenCalled();
	});

	// The URL comes from an API response, and a payment page served over plain http
	// puts the customer's card details on the wire in cleartext.
	it('refuses http for a non-local host', () => {
		expect(isSafePaymentUrl('http://pay.example.com/checkout')).toBe(false);
		expect(isSafePaymentUrl('https://pay.example.com/checkout')).toBe(true);
	});

	it('still allows http for a local gateway', () => {
		expect(isSafePaymentUrl('http://localhost:8080/checkout')).toBe(true);
		expect(isSafePaymentUrl('http://127.0.0.1:8080/checkout')).toBe(true);
	});
});
