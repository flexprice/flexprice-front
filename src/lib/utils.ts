import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

/**
 * The semantic type ramp in `tailwind.config.js` (`text-label`, `text-caption`, …) is a custom
 * `fontSize` extension, and tailwind-merge does not know about it: `text-*` is ambiguous, so an
 * unrecognised key falls into the **text-color** group. That made `cn('text-caption', 'text-muted')`
 * resolve to just `text-muted` — the ramp class was silently dropped every time it met a colour,
 * which is most call sites. Registering the keys under `font-size` restores the intended conflict
 * behaviour (ramp beats `text-sm`, and colours no longer cannibalise it).
 *
 * Keep this list in sync with `theme.extend.fontSize` in `tailwind.config.js`.
 */
const twMerge = extendTailwindMerge({
	extend: {
		classGroups: {
			'font-size': [{ text: ['label', 'table-header', 'body', 'caption', 'stat', 'subheading', 'heading'] }],
		},
	},
});

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}
