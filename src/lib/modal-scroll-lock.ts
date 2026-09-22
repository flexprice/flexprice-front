import { useRef, useEffect, useCallback } from 'react';

/**
 * Shared ownership count for the Dialog/Sheet scroll-lock safety net (see Dialog.tsx / Sheet.tsx).
 *
 * Radix's own scroll lock (react-remove-scroll) can leave document.body's overflow/pointer-events
 * stuck when a Dialog or Sheet closes while nested near another modal or popover. Each atom clears
 * that stuck state after closing, but must only do so once every other open overlay has also
 * closed — otherwise it can rip the lock out from under a dialog that's still legitimately open.
 *
 * React guarantees a `useEffect` cleanup runs before unmount or before the effect re-runs, so this
 * count is always accurate at the moment it's read — independent of whatever internal timing issue
 * caused Radix's own cleanup to be skipped in the first place.
 */
let openCount = 0;

export function registerModalOpen(): () => void {
	openCount += 1;
	let released = false;
	return () => {
		if (released) return;
		released = true;
		openCount = Math.max(0, openCount - 1);
	};
}

export function hasRegisteredOpenModals(): boolean {
	return openCount > 0;
}

/**
 * DOM-level fallback used alongside the counter above: catches overlays that don't (or can't)
 * call registerModalOpen — e.g. a Radix AlertDialog (role="alertdialog", not "dialog") or a
 * Popover/Select dropdown portaled outside any Dialog/Sheet. Extend this selector, not the call
 * sites, when a new overlay type needs to participate in the safety net.
 */
const OPEN_OVERLAY_SELECTOR =
	'[role="dialog"][data-state="open"], [role="alertdialog"][data-state="open"], [data-radix-popper-content-wrapper]';

export function hasOpenOverlayInDom(): boolean {
	return !!document.querySelector(OPEN_OVERLAY_SELECTOR);
}

/**
 * Require `data-state="open"` so a `forceMount`-ed overlay that's actually closed (kept in the
 * DOM for its own exit animation) doesn't get mistaken for something open — that would make
 * useSheetOutsideDismissGuards block every outside-click dismissal indefinitely. Radix puts
 * `data-state` on the content element itself, not on the outer `data-radix-popper-content-wrapper`
 * positioning div, hence the descendant combinator (space) for that one selector.
 */
const PORTALED_OVERLAY_SELECTOR = [
	'[data-radix-popper-content-wrapper] [data-state="open"]',
	'[data-radix-select-content][data-state="open"]',
	'[data-radix-menu-content][data-state="open"]',
	'[data-radix-dropdown-menu-content][data-state="open"]',
	'[data-radix-popover-content][data-state="open"]',
].join(', ');

/**
 * A second, fully open Dialog/AlertDialog (e.g. an editor opened on top of a table that's shown
 * inside another Dialog, like ConfigureAddonDialog's charges table + line-item editor). Kept out
 * of PORTALED_OVERLAY_SELECTOR/hasOpenPortaledOverlay deliberately: that function is used as a
 * "some overlay is open somewhere" check with no way to exclude the current dialog's own content,
 * and a Dialog's own root always matches `[role="dialog"][data-state="open"]` while it's mounted -
 * folding this in there would make every Dialog perpetually see "an overlay is open" (itself) and
 * never dismiss on a genuine outside click. It's only safe to check by event target: Radix already
 * only invokes onPointerDownOutside/onInteractOutside for a target outside the dialog's own DOM
 * subtree, so a target that closest()-matches this selector is necessarily a *different* dialog.
 */
const NESTED_DIALOG_SELECTOR = '[role="dialog"][data-state="open"], [role="alertdialog"][data-state="open"]';

const isPortaledOverlayTarget = (target: EventTarget | null) =>
	target instanceof Element && (!!target.closest(PORTALED_OVERLAY_SELECTOR) || !!target.closest(NESTED_DIALOG_SELECTOR));

const hasOpenPortaledOverlay = () => !!document.querySelector(PORTALED_OVERLAY_SELECTOR);

/**
 * Non-modal Sheets/Dialogs (see useSheetOutsideDismissGuards below) still dismiss on outside
 * click via Radix's dismissable layer even though `modal={false}` disables pointer-event
 * blocking. Without this guard, clicking a portaled Select/Popover/Combobox nested inside the
 * sheet/dialog reads as an "outside" click to Radix's layer and closes the sheet/dialog out from
 * under the dropdown mid-interaction.
 */
export function useSheetOutsideDismissGuards(enabled = true) {
	const suppressDismissRef = useRef(false);

	useEffect(() => {
		if (!enabled) {
			suppressDismissRef.current = false;
			return;
		}

		// Capture before nested dismissable layers unmount open dropdowns.
		const onPointerDownCapture = () => {
			if (!hasOpenPortaledOverlay()) return;
			suppressDismissRef.current = true;
		};
		// Backup clear if this gesture never hits the outside handlers (e.g. click inside the
		// sheet/dialog) - tied to the end of *this* pointer gesture rather than a fixed delay, so
		// suppression can never linger into a later, unrelated click and swallow a real dismiss.
		const clearSuppression = () => {
			suppressDismissRef.current = false;
		};

		document.addEventListener('pointerdown', onPointerDownCapture, true);
		document.addEventListener('pointerup', clearSuppression, true);
		document.addEventListener('pointercancel', clearSuppression, true);
		return () => {
			document.removeEventListener('pointerdown', onPointerDownCapture, true);
			document.removeEventListener('pointerup', clearSuppression, true);
			document.removeEventListener('pointercancel', clearSuppression, true);
		};
	}, [enabled]);

	/**
	 * Radix fires `onPointerDownOutside` and then `onInteractOutside` for the same
	 * gesture, so this runs twice. Suppression is deliberately NOT cleared here:
	 * the dropdown closes between the two calls, so clearing on the first left the
	 * second with a false ref and no overlay left in the DOM to detect — it fell
	 * through and dismissed the dialog. That is the "click anywhere with a select
	 * open and the modal closes" report. The pointerup/pointercancel listener
	 * above clears it at the end of this same gesture, before any later click.
	 */
	const preventOutsideDismiss = useCallback((event: Event) => {
		if (isPortaledOverlayTarget(event.target) || suppressDismissRef.current || hasOpenPortaledOverlay()) {
			event.preventDefault();
		}
	}, []);

	const preventFocusOutsideDismiss = useCallback((event: Event) => {
		event.preventDefault();
	}, []);

	return {
		onPointerDownOutside: preventOutsideDismiss,
		onInteractOutside: preventOutsideDismiss,
		onFocusOutside: preventFocusOutsideDismiss,
	};
}
