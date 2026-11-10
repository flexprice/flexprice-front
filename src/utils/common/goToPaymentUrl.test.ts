import { afterEach, describe, expect, it, vi } from 'vitest';
import { goToPaymentUrl } from './openPaymentUrl';

describe('goToPaymentUrl', () => {
	afterEach(() => vi.restoreAllMocks());

	it('sends this tab to the payment page instead of opening another', () => {
		const open = vi.spyOn(window, 'open').mockImplementation(() => null);
		const href = vi.fn();
		const location = {
			set href(value: string) {
				href(value);
			},
		};
		vi.spyOn(window, 'location', 'get').mockReturnValue(location as unknown as Location);
		const beforeLeave = vi.fn();

		expect(goToPaymentUrl('https://checkout.stripe.com/c/pay/cs_1', beforeLeave)).toBe(true);
		expect(beforeLeave).toHaveBeenCalled();
		expect(href).toHaveBeenCalledWith('https://checkout.stripe.com/c/pay/cs_1');
		expect(open).not.toHaveBeenCalled();
	});

	it('refuses a URL that is not a web page, without leaving', () => {
		const beforeLeave = vi.fn();
		expect(goToPaymentUrl('javascript:alert(1)', beforeLeave)).toBe(false);
		expect(beforeLeave).not.toHaveBeenCalled();
	});
});
