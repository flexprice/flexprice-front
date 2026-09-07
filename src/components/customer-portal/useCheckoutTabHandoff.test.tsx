import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CHECKOUT_RETURN_PARAM } from './checkoutHandoff';
import useCheckoutTabHandoff from './useCheckoutTabHandoff';

const setUrl = (url: string) => window.history.replaceState(null, '', url);

describe('useCheckoutTabHandoff', () => {
	beforeEach(() => {
		vi.useFakeTimers();
		setUrl('/customer-portal');
	});
	afterEach(() => vi.useRealTimers());

	it('does nothing on an ordinary visit', () => {
		const close = vi.spyOn(window, 'close').mockImplementation(() => {});
		const { result } = renderHook(() => useCheckoutTabHandoff());

		expect(result.current.isHandingOff).toBe(false);
		expect(result.current.wasCheckoutReturn).toBe(false);
		act(() => void vi.runAllTimers());
		expect(close).not.toHaveBeenCalled();
	});

	// postMessage only queues delivery and window.close() destroys the context that
	// queued it, so closing in the same tick can drop the announcement — leaving the
	// tab the customer started from none the wiser, its dialog still open.
	it('lets the announcement dispatch before tearing the tab down', () => {
		setUrl(`/customer-portal?${CHECKOUT_RETURN_PARAM}=1`);
		const close = vi.spyOn(window, 'close').mockImplementation(() => {});

		const { result } = renderHook(() => useCheckoutTabHandoff());

		// Renders nothing meanwhile: this tab is on its way out.
		expect(result.current.isHandingOff).toBe(true);
		expect(close).not.toHaveBeenCalled();

		act(() => void vi.advanceTimersByTime(200));
		expect(close).toHaveBeenCalled();
	});

	// Browsers only permit self-close for script-opened windows, so a tab that
	// cannot close must go on rendering the portal rather than staying blank.
	it('renders the portal when the browser refuses to close the tab', () => {
		setUrl(`/customer-portal?${CHECKOUT_RETURN_PARAM}=1`);
		vi.spyOn(window, 'close').mockImplementation(() => {});

		const { result } = renderHook(() => useCheckoutTabHandoff());
		act(() => void vi.advanceTimersByTime(1000));

		expect(result.current.isHandingOff).toBe(false);
		// Still true: the wrapper recovers the stored token only on such a landing,
		// and this tab is now the one rendering the portal.
		expect(result.current.wasCheckoutReturn).toBe(true);
	});
});
