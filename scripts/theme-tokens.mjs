/**
 * Canonical dark-theme token table.
 *
 * Single source of truth for `--fp-*` in src/index.css and the matching Tailwind color keys.
 * Consumed by scripts/verify-theme-tokens.mjs, which asserts that every token's LIGHT value is
 * byte-identical to the Tailwind palette color it replaces.
 *
 * `light` is a Tailwind palette path — 'gray.500', 'white', 'black'. It is resolved against
 * tailwindcss/colors at verify time; it is never hand-typed as a hex, so light mode cannot drift.
 * `dark` is the Linear "Midnight" value, authored by hand.
 *
 * Ordering here mirrors the CSS block so a diff of one reads as a diff of the other.
 */

/** @type {Array<{ group: string, tokens: Array<{ name: string, light: string, dark: string, note?: string }> }>} */
export const TOKEN_GROUPS = [
	{
		group: 'Surfaces — backgrounds. Midnight layers chrome (darkest) under panels (lighter).',
		tokens: [
			{ name: 'surface', light: 'white', dark: '#1d1d1f', note: 'bg-white — the elevated panel' },
			{ name: 'surface-subtle', light: 'gray.50', dark: '#232326', note: 'recessed wells, table headers, hover rows' },
			{ name: 'surface-muted', light: 'zinc.100', dark: '#252528' },
			{ name: 'surface-shell', light: 'gray.100', dark: '#0f0f10', note: 'app chrome behind every panel — darkest layer' },
			{ name: 'surface-strong', light: 'gray.200', dark: '#2e2e33' },
			{ name: 'surface-faint', light: 'zinc.50', dark: '#1f1f22' },
			{ name: 'surface-cool', light: 'slate.50', dark: '#1a1a1d' },
			{ name: 'surface-inverse', light: 'gray.900', dark: '#eeeff1', note: 'dark-on-light chips invert' },
			{ name: 'surface-scrim', light: 'black', dark: '#000000', note: 'modal scrim — black in both themes' },
		],
	},
	{
		group: 'Content — text, icons, fills. The light ramp inverts to the Midnight text ramp.',
		tokens: [
			{ name: 'content', light: 'gray.900', dark: '#eeeff1' },
			{ name: 'content-heading', light: 'gray.800', dark: '#e4e5e8' },
			{ name: 'content-secondary', light: 'gray.700', dark: '#d0d2d7' },
			{ name: 'content-tertiary', light: 'gray.600', dark: '#a9adb6' },
			{ name: 'content-muted', light: 'gray.500', dark: '#8a8f98', note: 'Linear secondary text' },
			{ name: 'content-subtle', light: 'gray.400', dark: '#6e727b' },
			{ name: 'content-disabled', light: 'gray.300', dark: '#55585f' },
			{ name: 'content-inverse', light: 'white', dark: '#0f0f10', note: 'text on a filled button — button goes light in dark mode' },
			{ name: 'content-black', light: 'black', dark: '#eeeff1' },
		],
	},
	{
		group: 'Content (zinc ramp) — exists only to keep light byte-identical. Collapsible later.',
		tokens: [
			{ name: 'content-zinc', light: 'zinc.950', dark: '#eeeff1' },
			{ name: 'content-zinc-bold', light: 'zinc.900', dark: '#e8e9ec' },
			{ name: 'content-zinc-strong', light: 'zinc.800', dark: '#dcdde1' },
			{ name: 'content-zinc-secondary', light: 'zinc.700', dark: '#c6c8ce' },
			{ name: 'content-zinc-tertiary', light: 'zinc.600', dark: '#a2a6af' },
			{ name: 'content-zinc-muted', light: 'zinc.500', dark: '#8a8f98' },
			{ name: 'content-zinc-subtle', light: 'zinc.400', dark: '#6e727b' },
		],
	},
	{
		group: 'Content (slate ramp) — same rationale as the zinc ramp.',
		tokens: [
			{ name: 'content-slate', light: 'slate.900', dark: '#eeeff1' },
			{ name: 'content-slate-strong', light: 'slate.800', dark: '#e2e4e8' },
			{ name: 'content-slate-secondary', light: 'slate.700', dark: '#cbcdd4' },
			{ name: 'content-slate-tertiary', light: 'slate.600', dark: '#a5a9b3' },
			{ name: 'content-slate-muted', light: 'slate.500', dark: '#8a8f98' },
			{ name: 'content-slate-subtle', light: 'slate.400', dark: '#74787f' },
		],
	},
	{
		group: 'Lines — borders, dividers, rings. Hairlines, not surfaces.',
		tokens: [
			{ name: 'line', light: 'gray.200', dark: '#29292e', note: 'the workhorse border' },
			{ name: 'line-subtle', light: 'gray.100', dark: '#1f1f23' },
			{ name: 'line-strong', light: 'gray.300', dark: '#35353b' },
			{ name: 'line-bold', light: 'gray.400', dark: '#45454d' },
			{ name: 'line-zinc', light: 'zinc.200', dark: '#29292e' },
			{ name: 'line-zinc-subtle', light: 'zinc.100', dark: '#1f1f23' },
			{ name: 'line-zinc-strong', light: 'zinc.300', dark: '#35353b' },
			{ name: 'line-slate', light: 'slate.200', dark: '#29292e' },
			{ name: 'line-slate-subtle', light: 'slate.100', dark: '#1f1f23' },
			{ name: 'line-slate-strong', light: 'slate.300', dark: '#35353b' },
			{ name: 'line-inverse', light: 'black', dark: '#eeeff1' },
		],
	},
	{
		group: 'Status — info (blue). Solids brighten; tinted backgrounds invert to dark tints.',
		tokens: [
			{ name: 'info', light: 'blue.600', dark: '#5b9bff' },
			{ name: 'info-bright', light: 'blue.500', dark: '#6ba5ff' },
			{ name: 'info-strong', light: 'blue.700', dark: '#7fb2ff' },
			{ name: 'info-deep', light: 'blue.800', dark: '#9ac2ff' },
			{ name: 'info-deepest', light: 'blue.900', dark: '#b0cfff' },
			{ name: 'info-muted', light: 'blue.50', dark: '#14203a' },
			{ name: 'info-muted-strong', light: 'blue.100', dark: '#1b2c4d' },
			{ name: 'info-line', light: 'blue.200', dark: '#24406b' },
		],
	},
	{
		group: 'Status — danger (red).',
		tokens: [
			{ name: 'danger', light: 'red.600', dark: '#f2555a' },
			{ name: 'danger-bright', light: 'red.500', dark: '#f56a6e' },
			{ name: 'danger-soft', light: 'red.400', dark: '#f88a8d' },
			{ name: 'danger-strong', light: 'red.700', dark: '#ff8a8e' },
			{ name: 'danger-deep', light: 'red.800', dark: '#ffa5a8' },
			{ name: 'danger-muted', light: 'red.50', dark: '#2a1516' },
			{ name: 'danger-line', light: 'red.200', dark: '#4a2224' },
		],
	},
	{
		group: 'Status — warning (amber) plus the orange/yellow one-offs.',
		tokens: [
			{ name: 'warning', light: 'amber.600', dark: '#e89a3c' },
			{ name: 'warning-bright', light: 'amber.500', dark: '#f0a93f' },
			{ name: 'warning-soft', light: 'amber.400', dark: '#f5c25c' },
			{ name: 'warning-strong', light: 'amber.700', dark: '#f2b063' },
			{ name: 'warning-deep', light: 'amber.800', dark: '#f5c98a' },
			{ name: 'warning-muted', light: 'amber.50', dark: '#2a1f0d' },
			{ name: 'warning-muted-strong', light: 'amber.100', dark: '#3a2b12' },
			{ name: 'warning-line', light: 'amber.200', dark: '#4d3a18' },
			{ name: 'warning-line-strong', light: 'amber.300', dark: '#5e4720' },
			{ name: 'accent-orange', light: 'orange.600', dark: '#f5793c' },
			{ name: 'accent-yellow', light: 'yellow.500', dark: '#efc64a' },
		],
	},
	{
		group: 'Status — success (green / emerald).',
		tokens: [
			{ name: 'success', light: 'green.600', dark: '#45c97a' },
			{ name: 'success-bright', light: 'green.500', dark: '#4fd687' },
			{ name: 'success-soft', light: 'green.400', dark: '#6fe09b' },
			{ name: 'success-deep', light: 'green.800', dark: '#7de0a5' },
			{ name: 'success-muted', light: 'green.50', dark: '#10261a' },
			{ name: 'success-line', light: 'green.200', dark: '#1e4630' },
			{ name: 'accent-emerald', light: 'emerald.500', dark: '#34d6a0' },
			{ name: 'accent-emerald-strong', light: 'emerald.600', dark: '#2ec894' },
			{ name: 'accent-emerald-muted', light: 'emerald.100', dark: '#10312a' },
		],
	},
	{
		group: 'Accents — indigo / purple / sky / violet.',
		tokens: [
			{ name: 'accent-indigo', light: 'indigo.600', dark: '#8a82ff' },
			{ name: 'accent-indigo-strong', light: 'indigo.700', dark: '#9b94ff' },
			{ name: 'accent-indigo-muted', light: 'indigo.50', dark: '#1b1b3a' },
			{ name: 'accent-indigo-line', light: 'indigo.200', dark: '#2e2e5c' },
			{ name: 'accent-purple', light: 'purple.600', dark: '#b478f5' },
			{ name: 'accent-sky', light: 'sky.600', dark: '#38a9e8' },
			{ name: 'accent-violet', light: 'violet.600', dark: '#a176f5' },
		],
	},
	{
		group: 'Brand blue — pre-existing literals from tailwind.config.js, now themable. Light unchanged.',
		tokens: [
			{ name: 'brand-blue', light: '#3293D9', dark: '#4aa8e8', note: 'was colors.blue.DEFAULT' },
			{ name: 'brand-blue-light', light: '#E5F0FF', dark: '#16283f', note: 'was colors.blue.light' },
		],
	},
];

export const ALL_TOKENS = TOKEN_GROUPS.flatMap((g) => g.tokens);

/** '#6b7280' -> '107 114 128' (space-separated channels, for `rgb(var(--x) / <alpha-value>)`). */
export function hexToChannels(hex) {
	const h = hex.replace('#', '');
	const full = h.length === 3 ? [...h].map((c) => c + c).join('') : h;
	return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16)).join(' ');
}

/** Resolve a light spec ('gray.500' | 'white' | '#3293D9') to a lowercase hex. */
export function resolveLight(spec, palette) {
	if (spec.startsWith('#')) return spec.toLowerCase();
	if (spec === 'white') return '#ffffff';
	if (spec === 'black') return '#000000';
	const [family, step] = spec.split('.');
	const value = palette[family]?.[step];
	if (!value) throw new Error(`Unknown Tailwind palette path: ${spec}`);
	return value.toLowerCase();
}
