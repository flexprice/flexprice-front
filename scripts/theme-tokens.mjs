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
			{ name: 'surface-heavy', light: 'gray.400', dark: '#4f4f57' },
			{ name: 'surface-faint', light: 'zinc.50', dark: '#1f1f22' },

			/*
			 * The app canvas behind every card. It used to share `surface` with the cards themselves, so
			 * in dark the page and the panels on it were both #1d1d1f and nothing read as raised.
			 * Dropping the canvas to #181818 puts real separation back. Light is untouched — both are
			 * still #ffffff, exactly as before.
			 */
			{ name: 'surface-canvas', light: 'white', dark: '#181818', note: 'main content area — stays darker than surface' },
			{ name: 'surface-cool', light: 'slate.50', dark: '#1a1a1d' },
			{ name: 'surface-inverse', light: 'gray.900', dark: '#eeeff1', note: 'dark-on-light chips invert' },
			{ name: 'surface-inverse-zinc', light: 'zinc.900', dark: '#eeeff1', note: 'inverted tooltips built on zinc rather than gray' },
			{
				name: 'surface-track',
				light: 'slate.800',
				dark: '#45454d',
				note: 'switch track when off — dark on light cards, must lighten on dark ones',
			},
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
			{ name: 'content-subtle', light: 'gray.400', dark: '#878c95', note: 'brightened from #6e727b — 3.25:1 failed AA on surface-subtle' },
			{
				name: 'content-disabled',
				light: 'gray.300',
				dark: '#55585f',
				note: 'deliberately low contrast (2.2:1) — disabled text is exempt from AA and must read as disabled',
			},
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
			{ name: 'content-zinc-disabled', light: 'zinc.300', dark: '#55585f' },
			{
				name: 'content-zinc-subtle',
				light: 'zinc.400',
				dark: '#878c95',
				note: 'brightened from #6e727b — same AA failure as content-subtle',
			},
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
			{ name: 'content-slate-subtle', light: 'slate.400', dark: '#858b96', note: 'brightened from #74787f — 3.53:1 failed AA' },
			{ name: 'content-slate-disabled', light: 'slate.300', dark: '#55585f', note: 'unselected step marker' },
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
			{ name: 'warning-deepest', light: 'amber.900', dark: '#f7d9ab' },
			{ name: 'accent-orange', light: 'orange.600', dark: '#f5793c' },
			{ name: 'accent-orange-muted', light: 'orange.100', dark: '#3a2312' },
			{ name: 'accent-orange-bg', light: 'orange.50', dark: '#2e1f10' },
			{ name: 'accent-yellow', light: 'yellow.500', dark: '#efc64a' },
			{ name: 'accent-yellow-mid', light: 'yellow.600', dark: '#e0b843' },
			{ name: 'accent-yellow-bg', light: 'yellow.50', dark: '#2b2612' },
			{ name: 'accent-yellow-line', light: 'yellow.400', dark: '#6b5518' },
			{ name: 'accent-yellow-strong', light: 'yellow.700', dark: '#e8bd52' },
			{ name: 'accent-yellow-deep', light: 'yellow.900', dark: '#f2d98a' },
		],
	},
	{
		group: 'Status — success (green / emerald).',
		tokens: [
			{ name: 'success', light: 'green.600', dark: '#45c97a' },
			{ name: 'success-bright', light: 'green.500', dark: '#4fd687' },
			{ name: 'success-soft', light: 'green.400', dark: '#6fe09b' },
			{ name: 'success-strong', light: 'green.700', dark: '#58d18a' },
			{ name: 'success-deep', light: 'green.800', dark: '#7de0a5' },
			{ name: 'success-deepest', light: 'green.900', dark: '#9ae8bd' },
			{ name: 'success-line-subtle', light: 'green.100', dark: '#153524' },
			{ name: 'success-muted', light: 'green.50', dark: '#10261a' },
			{ name: 'success-line', light: 'green.200', dark: '#1e4630' },
			{ name: 'accent-emerald', light: 'emerald.500', dark: '#34d6a0' },
			{ name: 'accent-emerald-strong', light: 'emerald.600', dark: '#2ec894' },
			{ name: 'accent-emerald-soft', light: 'emerald.400', dark: '#4fe0ad' },
			{ name: 'accent-emerald-deep', light: 'emerald.700', dark: '#2fbb8c' },
			{ name: 'accent-emerald-muted', light: 'emerald.100', dark: '#10312a' },
			{ name: 'accent-emerald-line', light: 'emerald.200', dark: '#1b4a3d' },
			{ name: 'accent-emerald-bg', light: 'emerald.50', dark: '#0d2620' },
			{ name: 'accent-teal', light: 'teal.500', dark: '#2ed3c0' },
			{ name: 'accent-teal-deep', light: 'teal.600', dark: '#26bfae' },
		],
	},
	{
		group: 'Accents — indigo / purple / sky / violet.',
		tokens: [
			{ name: 'accent-indigo', light: 'indigo.600', dark: '#8a82ff' },
			{ name: 'accent-indigo-strong', light: 'indigo.700', dark: '#9b94ff' },
			{ name: 'accent-indigo-muted', light: 'indigo.50', dark: '#1b1b3a' },
			{ name: 'accent-indigo-line', light: 'indigo.200', dark: '#2e2e5c' },
			{ name: 'accent-rose', light: 'rose.400', dark: '#fb8a9c' },
			{ name: 'accent-rose-line', light: 'rose.200', dark: '#4d2028' },
			{ name: 'accent-rose-muted', light: 'rose.50', dark: '#2d1419' },
			{ name: 'accent-purple', light: 'purple.600', dark: '#b478f5' },
			{ name: 'accent-purple-muted', light: 'purple.50', dark: '#241633' },
			{ name: 'accent-purple-line', light: 'purple.100', dark: '#33204a' },
			{ name: 'accent-purple-deep', light: 'purple.900', dark: '#d9b3ff' },
			{ name: 'accent-sky', light: 'sky.600', dark: '#38a9e8' },
			{ name: 'accent-sky-bright', light: 'sky.500', dark: '#4fb8f5' },
			{ name: 'accent-violet', light: 'violet.600', dark: '#a176f5' },
		],
	},
	{
		group: 'App shell — sidebar chrome and nav states. Light values are the exact hexes the shell already used.',
		tokens: [
			{ name: 'surface-sidebar', light: '#f9f9f9', dark: '#0f0f10', note: 'sidebar canvas — darkest Midnight layer' },
			{ name: 'surface-bold', light: 'gray.300', dark: '#45454d', note: 'sidebar resize rail' },
			{ name: 'surface-selected', light: 'zinc.200', dark: '#2e2e33', note: 'active nav item' },
			{
				name: 'surface-selected-alt',
				light: '#ededed',
				dark: '#2b2b30',
				note: 'duplicate of surface-selected at a different light hex — collapsible later',
			},
			{ name: 'line-faint', light: '#bababa', dark: '#35353b', note: 'promo card hairline' },
			{ name: 'content-slate-deep', light: 'slate.950', dark: '#eeeff1', note: 'active breadcrumb' },
			{ name: 'brand-navy', light: '#092E44', dark: '#6db8e8', note: 'Flexprice navy — brightened so it reads on dark' },

			/*
			 * The primary button FILL, split from `brand-navy` on purpose.
			 *
			 * brand-navy has to serve two jobs that pull opposite ways in dark: as a fill it wants to stay
			 * a deep brand blue, and as TEXT on a dark card it has to be bright enough to read — which is
			 * why it was lifted to #6db8e8. One token cannot be both, so the fill gets its own.
			 *
			 * `content-on-brand` stays white in both themes because this button no longer inverts:
			 * content-inverse would land near-black on #1a70a2 at 3.54:1, while white reads 5.41:1.
			 */
			{ name: 'brand-fill', light: '#092E44', dark: '#1a70a2', note: 'primary button fill' },
			{ name: 'content-on-brand', light: 'white', dark: '#ffffff', note: 'label on brand-fill — white in both themes' },
			{ name: 'surface-notch', light: 'zinc.300', dark: '#45454d', note: 'Card notch bar — zinc.300 as a fill, not a border' },
			{ name: 'accent-yellow-muted', light: 'yellow.200', dark: '#3a2b12', note: 'Coming-soon badge fill' },
			{
				name: 'surface-avatar',
				light: 'black',
				dark: '#eeeff1',
				note: 'tenant initials tile — inverts, unlike surface-scrim which stays black',
			},
		],
	},
	{
		group: 'Status chips + toasts. Applied through inline style, so these are consumed as rgb(var(--fp-x)).',
		tokens: [
			{ name: 'chip-success-bg', light: '#ECFBE4', dark: '#16301f' },
			{ name: 'chip-success-text', light: '#377E6A', dark: '#5fc99a' },
			{ name: 'chip-success-line', light: '#d1e9ca', dark: '#24503a' },
			{ name: 'chip-neutral-bg', light: '#F0F2F5', dark: '#26262a' },
			{ name: 'chip-neutral-text', light: '#57646E', dark: '#a3abb5' },
			{ name: 'chip-danger-bg', light: 'red.100', dark: '#3a1a1c', note: 'chip danger text reuses the existing `danger` token (red.600)' },
			{ name: 'chip-info-bg', light: '#EFF8FF', dark: '#16243c' },
			{ name: 'chip-info-text', light: '#2F6FE2', dark: '#6ba5ff' },
			{ name: 'chip-warning-bg', light: 'orange.50', dark: '#2e1f10' },
			{ name: 'chip-warning-text', light: 'orange.700', dark: '#f5934f' },
			{ name: 'toast-success', light: '#5CA7A0', dark: '#6fc4bc', note: 'react-hot-toast iconTheme.primary' },
			{ name: 'toast-danger', light: '#E76E50', dark: '#f08a70' },
			{ name: 'line-zinc-bold', light: 'zinc.400', dark: '#45454d', note: 'InfoIcon focus ring' },
			{ name: 'line-zinc-tertiary', light: 'zinc.600', dark: '#55585f', note: 'RadioGroup selected border' },
			{ name: 'surface-slate-subtle', light: 'slate.100', dark: '#232326', note: 'MultiChipInput chip fill' },
			{ name: 'stepper-active', light: '#333333', dark: '#e4e5e8', note: 'Stepper active/completed step' },
			{ name: 'stepper-idle', light: '#999999', dark: '#74787f' },
			{ name: 'stepper-line', light: '#EBEBEB', dark: '#35353b' },
		],
	},
	{
		group: 'Environment badge — sandbox/production pill in the sidebar. Gradient stops are applied via inline style.',
		tokens: [
			{ name: 'env-dev-bg', light: '#FFFCEE', dark: '#241f10', note: 'gradient edge' },
			{ name: 'env-dev-bg-mid', light: '#FFF9DD', dark: '#2f2714', note: 'gradient centre' },
			{ name: 'env-prod-bg', light: '#EEF4FF', dark: '#141d33', note: 'gradient edge' },
			{ name: 'env-prod-bg-mid', light: '#DDE7FF', dark: '#1b2745', note: 'gradient centre' },
			{ name: 'env-prod-line', light: '#BFD0F5', dark: '#2f4a80' },
			{ name: 'env-prod-text', light: '#1F5ADA', dark: '#8fb8ff' },
		],
	},
	{
		group: 'Auth / banner surfaces — inline gradients and avatar tiles that must invert with their text.',
		tokens: [
			{ name: 'banner-bg', light: '#F7F7F7', dark: '#1f1f22', note: 'Slack banner gradient edge' },
			{ name: 'banner-bg-mid', light: '#EDEDED', dark: '#26262a', note: 'Slack banner gradient centre' },
			{ name: 'surface-avatar-navy', light: '#0B1121', dark: '#eeeff1', note: 'org initials tile — inverts with content-inverse' },
		],
	},
	{
		group: 'Restricted-environment banner — full-width inline gradients that must move with their text.',
		tokens: [
			{ name: 'banner-info-line', light: '#E3ECFF', dark: '#2f4a80' },
			{ name: 'banner-info-text', light: '#184FC7', dark: '#8fb8ff' },
			{ name: 'banner-danger-bg', light: '#FFEEEE', dark: '#2e1516', note: 'gradient edge' },
			{ name: 'banner-danger-bg-mid', light: '#FFEAEA', dark: '#3a1a1c', note: 'gradient centre' },
			{ name: 'banner-danger-line', light: '#FFDDDD', dark: '#4a2224' },
			{ name: 'banner-danger-text', light: '#C81B1B', dark: '#ff9a9d' },
		],
	},
	{
		group: 'Charts — axis, grid and series colours applied through Recharts props and inline style.',
		tokens: [
			{ name: 'chart-axis', light: '#cccccc', dark: '#45454d', note: 'axis line' },
			{ name: 'chart-grid', light: '#f0f0f0', dark: '#29292e', note: 'cartesian grid' },
			{ name: 'accent-indigo-bright', light: 'indigo.500', dark: '#8a93ff', note: 'series colour' },
		],
	},
	{
		group: 'Off-palette values that predate the token layer — greys and accents written as arbitrary hex.',
		tokens: [
			{ name: 'surface-panel', light: '#FBFBFB', dark: '#232326', note: 'filter popovers' },
			{ name: 'surface-panel-alt', light: '#FCFCFC', dark: '#26262a', note: 'tutorial card gradient end' },
			{ name: 'surface-thumb', light: '#F5F5F5', dark: '#232326', note: 'tutorial card thumbnail well' },
			{ name: 'surface-thumb-alt', light: '#F4F4F4', dark: '#232326' },

			/*
			 * Two backgrounds that exist only inside another surface and were never meant to be seen.
			 *
			 * In light each sits a single step from its parent — #F9F9F9 on #fafafa, #f3f4f6 on #F5F5F5 —
			 * so the pair has always read as one flat surface. Mapping them by ROLE sent them to sidebar
			 * chrome and app shell, which in Midnight are the darkest layer of all, and the empty state
			 * grew a near-black block behind its description.
			 *
			 * Light keeps the exact original value; dark matches the parent so the fill disappears again.
			 * Do not "simplify" these to their parent token — that would change light.
			 */
			{ name: 'surface-faint-inner', light: '#f9f9f9', dark: '#1f1f22', note: 'redundant fill inside surface-faint — must vanish' },
			{ name: 'surface-thumb-inner', light: 'gray.100', dark: '#232326', note: 'img placeholder inside surface-thumb — must vanish' },
			{ name: 'surface-cool-strong', light: '#DDE1EB', dark: '#26262e' },
			{ name: 'line-hairline', light: '#E9E9E9', dark: '#29292e', note: 'empty-state card border' },
			{ name: 'line-muted', light: '#CFCFCF', dark: '#35353b' },
			{ name: 'line-slate-deep', light: 'slate.900', dark: '#45454d', note: 'selected radio outline' },
			{ name: 'content-grey', light: '#5E5E5E', dark: '#a9adb6' },
			{ name: 'accent-teal-brand', light: '#2A9D90', dark: '#3fc2b3' },
			{ name: 'accent-yellow-brand', light: '#F5C50B', dark: '#f0cf5a' },
			{ name: 'accent-indigo-soft', light: '#6167D9', dark: '#8a90f0' },
			{ name: 'accent-amber-soft', light: '#FFBF76', dark: '#ffcf94' },
			{ name: 'accent-blue-deep', light: '#0E5AC9', dark: '#6ba5ff' },
			{ name: 'accent-amber-mid', light: '#C58E20', dark: '#dfae4a' },
		],
	},
	{
		group: 'Subscription-type chips — teal / violet / indigo triples applied through Chip props.',
		tokens: [
			{ name: 'chip-teal-bg', light: '#CCFBF1', dark: '#0f2f2b' },
			{ name: 'chip-teal-text', light: '#0F766E', dark: '#4fd6c4' },
			{ name: 'chip-teal-line', light: '#99F6E4', dark: '#1b4a44' },
			{ name: 'chip-violet-bg', light: '#F5F3FF', dark: '#1e1733' },
			{ name: 'chip-violet-text', light: '#6D28D9', dark: '#b295f5' },
			{ name: 'chip-violet-line', light: '#DDD6FE', dark: '#302449' },
			{ name: 'chip-indigo-bg', light: '#EEF2FF', dark: '#191c38' },
			{ name: 'chip-indigo-text', light: '#4338CA', dark: '#9aa2f5' },
			{ name: 'chip-indigo-line', light: '#E0E7FF', dark: '#282d54' },

			/*
			 * Feature-type chips (Static / Metered / Boolean / Config). Features.tsx passed these as raw
			 * hex into Chip's textColor/bgColor PROPS — a JSX prop rather than a class or a style, so no
			 * check ever saw them and they stayed pastel on a dark page. Light values are those exact
			 * hexes; dark follows the deep, desaturated fills the other chips already use.
			 */
			{ name: 'chip-type-static-bg', light: 'gray.100', dark: '#202024' },
			{ name: 'chip-type-static-text', light: 'gray.600', dark: '#a9adb6' },
			{ name: 'chip-type-metered-bg', light: 'blue.100', dark: '#16243c' },
			{ name: 'chip-type-metered-text', light: 'blue.800', dark: '#7fb3f5' },
			{ name: 'chip-type-boolean-bg', light: 'green.100', dark: '#16301f' },
			{ name: 'chip-type-boolean-text', light: 'green.800', dark: '#74d99f' },
			{ name: 'chip-type-config-bg', light: 'violet.50', dark: '#1e1733' },
			{ name: 'chip-type-config-text', light: 'violet.800', dark: '#b9a6f5' },
			{ name: 'chip-type-default-bg', light: 'gray.50', dark: '#1f1f22' },
			{ name: 'chip-type-default-text', light: 'gray.500', dark: '#8a8f98' },
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
