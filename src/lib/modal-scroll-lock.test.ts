import { renderHook } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { registerModalOpen, hasRegisteredOpenModals, useSheetOutsideDismissGuards } from './modal-scroll-lock';

describe('modal-scroll-lock', () => {
	beforeEach(() => {
		// Drain any registrations left over from a previous test so counts start at 0.
		while (hasRegisteredOpenModals()) {
			registerModalOpen()();
		}
	});

	it('tracks open/close pairs correctly', () => {
		const release = registerModalOpen();
		expect(hasRegisteredOpenModals()).toBe(true);
		release();
		expect(hasRegisteredOpenModals()).toBe(false);
	});

	it("calling the same release twice does not double-decrement another modal's registration", () => {
		const releaseA = registerModalOpen();
		const releaseB = registerModalOpen();

		releaseA();
		releaseA(); // idempotent: must not release B's slot too
		expect(hasRegisteredOpenModals()).toBe(true); // B is still open

		releaseB();
		expect(hasRegisteredOpenModals()).toBe(false);
	});
});

/** Stands in for an open Radix dropdown portaled outside the dialog. */
const openDropdown = () => {
	const wrapper = document.createElement('div');
	wrapper.setAttribute('data-radix-popper-content-wrapper', '');
	const content = document.createElement('div');
	content.setAttribute('data-state', 'open');
	wrapper.appendChild(content);
	document.body.appendChild(wrapper);
	return { wrapper, content };
};

/** Stands in for a second Dialog (e.g. a line-item editor) opened on top of another. */
const openNestedDialog = () => {
	const content = document.createElement('div');
	content.setAttribute('role', 'dialog');
	content.setAttribute('data-state', 'open');
	const child = document.createElement('button');
	content.appendChild(child);
	document.body.appendChild(content);
	return { content, child };
};

const outsideEvent = (target: EventTarget) => {
	const event = new Event('pointerdown', { cancelable: true });
	Object.defineProperty(event, 'target', { value: target });
	return event;
};

describe('useSheetOutsideDismissGuards', () => {
	afterEach(() => {
		document.body.innerHTML = '';
	});

	// Radix fires onPointerDownOutside then onInteractOutside for one gesture, and
	// the dropdown closes in between. Clearing suppression on the first call left
	// the second unguarded, so clicking anywhere with a select open dismissed the
	// dialog underneath it.
	it('keeps suppressing after the dropdown closes mid-gesture', () => {
		const { wrapper } = openDropdown();
		const { result } = renderHook(() => useSheetOutsideDismissGuards(true));

		// Gesture starts while the dropdown is still open.
		document.dispatchEvent(new Event('pointerdown', { cancelable: true }));

		const first = outsideEvent(document.body);
		result.current.onPointerDownOutside(first);
		expect(first.defaultPrevented).toBe(true);

		// The dropdown closes as a result of the same gesture.
		wrapper.remove();

		const second = outsideEvent(document.body);
		result.current.onInteractOutside(second);
		expect(second.defaultPrevented).toBe(true);
	});

	// Suppression must not outlive its gesture, or a later click can never dismiss.
	it('stops suppressing once the gesture ends', () => {
		const { wrapper } = openDropdown();
		const { result } = renderHook(() => useSheetOutsideDismissGuards(true));

		document.dispatchEvent(new Event('pointerdown', { cancelable: true }));
		wrapper.remove();
		document.dispatchEvent(new Event('pointerup', { cancelable: true }));

		const later = outsideEvent(document.body);
		result.current.onInteractOutside(later);
		expect(later.defaultPrevented).toBe(false);
	});

	// ConfigureAddonDialog's charges-table Dialog stays open behind a line-item editor Dialog it
	// opens on top of itself. A click inside that editor reaches the table dialog's dismissable
	// layer as an "outside" event (different portal subtree) and must not close it.
	it('does not dismiss when the outside-detected click lands inside a nested dialog', () => {
		const { child } = openNestedDialog();
		const { result } = renderHook(() => useSheetOutsideDismissGuards(true));

		const event = outsideEvent(child);
		result.current.onPointerDownOutside(event);
		expect(event.defaultPrevented).toBe(true);
	});

	it('still dismisses on a click outside everything, even while a nested dialog exists elsewhere in the DOM', () => {
		openNestedDialog();
		const { result } = renderHook(() => useSheetOutsideDismissGuards(true));

		const event = outsideEvent(document.body);
		result.current.onPointerDownOutside(event);
		expect(event.defaultPrevented).toBe(false);
	});
});
