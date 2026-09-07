import type { PortalTheme } from '@/types/dto/PortalConfig';

/**
 * Bridges the tenant portal theme onto the app's design tokens.
 *
 * The portal used to style itself with inline `style` props reading `--portal-*`
 * hex values, with a hardcoded fallback beside every one — 86 of them across 13
 * files, and a `hasTheme` ternary around each so every colour was written twice.
 * Nothing was consistent by construction.
 *
 * The two systems could not simply be pointed at each other: `--portal-*` holds
 * hex strings from tenant config, while the app's tokens hold space-separated RGB
 * triples so Tailwind can apply an alpha channel (`rgb(var(--fp-surface) / <a>)`).
 * So the translation happens here, once, and portal components then use ordinary
 * utility classes — `bg-surface`, `text-content-secondary`, `border-line`.
 */

/** The portal's own palette, matching the fallbacks the inline styles used to carry. */
const PORTAL_DEFAULTS = {
	surface: '#ffffff',
	background: '#fafafa',
	border: '#e9e9e9',
	textPrimary: '#09090b',
	textSecondary: '#71717a',
	textTertiary: '#a1a1aa',
} as const;

/** App tokens the portal drives. Anything absent here keeps the app's own value. */
const TOKEN_NAMES = {
	surface: '--fp-surface',
	background: '--fp-surface-subtle',
	border: '--fp-line',
	textPrimary: '--fp-content',
	textSecondary: '--fp-content-secondary',
	textTertiary: '--fp-content-tertiary',
} as const;

type Slot = keyof typeof PORTAL_DEFAULTS;

/** `#2563eb` → `37 99 235`, or null when the string is not a colour we can read. */
export function hexToRgbTriple(hex?: string): string | null {
	if (!hex) return null;
	const clean = hex.trim().replace('#', '');
	const full = clean.length === 3 ? clean.replace(/./g, (c) => c + c) : clean;
	if (!/^[0-9a-f]{6}$/i.test(full)) return null;
	const r = parseInt(full.slice(0, 2), 16);
	const g = parseInt(full.slice(2, 4), 16);
	const b = parseInt(full.slice(4, 6), 16);
	return `${r} ${g} ${b}`;
}

/** True when text on this background needs to be light. */
export function isColorDark(hex: string): boolean {
	const triple = hexToRgbTriple(hex);
	if (!triple) return false;
	const [r, g, b] = triple.split(' ').map(Number);
	return (0.299 * r + 0.587 * g + 0.114 * b) / 255 < 0.5;
}

/**
 * The token values to write for a portal, themed or not.
 *
 * Always returns a full set rather than only the tenant's overrides: an unthemed
 * portal has to keep its own greys, not inherit the dashboard's, or every portal
 * without a theme would shift the day this bridge landed.
 */
export function portalTokenOverrides(theme?: PortalTheme): Record<string, string> {
	const dark = theme?.background_color ? isColorDark(theme.background_color) : false;

	// Tenants supply brand colours only; text adapts to the background they chose.
	const derivedText: Pick<Record<Slot, string>, 'textPrimary' | 'textSecondary' | 'textTertiary'> = dark
		? { textPrimary: '#ffffff', textSecondary: '#a5a5a5', textTertiary: '#8a8a8a' }
		: {
				textPrimary: PORTAL_DEFAULTS.textPrimary,
				textSecondary: PORTAL_DEFAULTS.textSecondary,
				textTertiary: PORTAL_DEFAULTS.textTertiary,
			};

	const resolved: Record<Slot, string> = {
		surface: theme?.surface_color || PORTAL_DEFAULTS.surface,
		background: theme?.background_color || PORTAL_DEFAULTS.background,
		border: theme?.border_color || PORTAL_DEFAULTS.border,
		...derivedText,
	};

	const tokens: Record<string, string> = {};
	(Object.keys(resolved) as Slot[]).forEach((slot) => {
		const triple = hexToRgbTriple(resolved[slot]);
		// A tenant value we cannot parse falls back to the portal's own, rather than
		// leaving the token unset and letting the dashboard's palette show through.
		const safe = triple ?? hexToRgbTriple(PORTAL_DEFAULTS[slot]);
		if (safe) tokens[TOKEN_NAMES[slot]] = safe;
	});
	return tokens;
}

/** Names written by portalTokenOverrides, so a caller can clear exactly what it set. */
export const PORTAL_TOKEN_NAMES = Object.values(TOKEN_NAMES);
