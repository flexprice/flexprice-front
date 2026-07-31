import animatePlugin from 'tailwindcss-animate';

export default {
	darkMode: ['class'],
	content: ['./index.html', './src/**/*.{ts,tsx,js,jsx}'],
	theme: {
		extend: {
			fontSize: {
				xs: '12px',
				sm: '14px',
			},
			fontFamily: {
				sans: ['var(--font-sans)'],
				geist: ['Geist', 'sans-serif'],
				'fira-code': ['Fira Code', 'monospace'],
			},
			borderRadius: {
				DEFAULT: '6px',
				sm: '6px',
				md: '6px',
				lg: '6px',
				xl: '6px',
				'2xl': '6px',
				'3xl': '6px',
				full: '9999px',
			},
			colors: {
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))',
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))',
				},
				blue: {
					DEFAULT: '#3293D9',
					light: '#E5F0FF',
				},
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))',
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))',
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					/*
					 * Was the literal '#64748B', which made `text-muted-foreground` (250 uses — the
					 * second most common colour class in the app) unthemable: the `--muted-foreground`
					 * CSS variable was dead, so retuning it for dark did nothing.
					 *
					 * `--fp-content-slate-muted` resolves to slate.500 = #64748b, byte-identical to the
					 * literal it replaces, and scripts/verify-theme-tokens.mjs pins it there.
					 */
					foreground: 'rgb(var(--fp-content-slate-muted) / <alpha-value>)',
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))',
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))',
				},
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				chart: {
					1: 'hsl(var(--chart-1))',
					2: 'hsl(var(--chart-2))',
					3: 'hsl(var(--chart-3))',
					4: 'hsl(var(--chart-4))',
					5: 'hsl(var(--chart-5))',
				},

				/* ------------------------------------------------------------------
				 * Dark-theme token layer. Light values are byte-identical to the Tailwind
				 * palette colors they replace — see scripts/theme-tokens.mjs and the guard
				 * at scripts/verify-theme-tokens.mjs.
				 * ------------------------------------------------------------------ */

				/* Surfaces — backgrounds. Midnight layers chrome (darkest) under panels (lighter). */
				surface: 'rgb(var(--fp-surface) / <alpha-value>)',
				'surface-subtle': 'rgb(var(--fp-surface-subtle) / <alpha-value>)',
				'surface-muted': 'rgb(var(--fp-surface-muted) / <alpha-value>)',
				'surface-shell': 'rgb(var(--fp-surface-shell) / <alpha-value>)',
				'surface-strong': 'rgb(var(--fp-surface-strong) / <alpha-value>)',
				'surface-faint': 'rgb(var(--fp-surface-faint) / <alpha-value>)',
				'surface-cool': 'rgb(var(--fp-surface-cool) / <alpha-value>)',
				'surface-inverse': 'rgb(var(--fp-surface-inverse) / <alpha-value>)',
				'surface-scrim': 'rgb(var(--fp-surface-scrim) / <alpha-value>)',

				/* Content — text, icons, fills. The light ramp inverts to the Midnight text ramp. */
				content: 'rgb(var(--fp-content) / <alpha-value>)',
				'content-heading': 'rgb(var(--fp-content-heading) / <alpha-value>)',
				'content-secondary': 'rgb(var(--fp-content-secondary) / <alpha-value>)',
				'content-tertiary': 'rgb(var(--fp-content-tertiary) / <alpha-value>)',
				'content-muted': 'rgb(var(--fp-content-muted) / <alpha-value>)',
				'content-subtle': 'rgb(var(--fp-content-subtle) / <alpha-value>)',
				'content-disabled': 'rgb(var(--fp-content-disabled) / <alpha-value>)',
				'content-inverse': 'rgb(var(--fp-content-inverse) / <alpha-value>)',
				'content-black': 'rgb(var(--fp-content-black) / <alpha-value>)',

				/* Content (zinc ramp) — exists only to keep light byte-identical. Collapsible later. */
				'content-zinc': 'rgb(var(--fp-content-zinc) / <alpha-value>)',
				'content-zinc-bold': 'rgb(var(--fp-content-zinc-bold) / <alpha-value>)',
				'content-zinc-strong': 'rgb(var(--fp-content-zinc-strong) / <alpha-value>)',
				'content-zinc-secondary': 'rgb(var(--fp-content-zinc-secondary) / <alpha-value>)',
				'content-zinc-tertiary': 'rgb(var(--fp-content-zinc-tertiary) / <alpha-value>)',
				'content-zinc-muted': 'rgb(var(--fp-content-zinc-muted) / <alpha-value>)',
				'content-zinc-subtle': 'rgb(var(--fp-content-zinc-subtle) / <alpha-value>)',

				/* Content (slate ramp) — same rationale as the zinc ramp. */
				'content-slate': 'rgb(var(--fp-content-slate) / <alpha-value>)',
				'content-slate-strong': 'rgb(var(--fp-content-slate-strong) / <alpha-value>)',
				'content-slate-secondary': 'rgb(var(--fp-content-slate-secondary) / <alpha-value>)',
				'content-slate-tertiary': 'rgb(var(--fp-content-slate-tertiary) / <alpha-value>)',
				'content-slate-muted': 'rgb(var(--fp-content-slate-muted) / <alpha-value>)',
				'content-slate-subtle': 'rgb(var(--fp-content-slate-subtle) / <alpha-value>)',

				/* Lines — borders, dividers, rings. Hairlines, not surfaces. */
				line: 'rgb(var(--fp-line) / <alpha-value>)',
				'line-subtle': 'rgb(var(--fp-line-subtle) / <alpha-value>)',
				'line-strong': 'rgb(var(--fp-line-strong) / <alpha-value>)',
				'line-bold': 'rgb(var(--fp-line-bold) / <alpha-value>)',
				'line-zinc': 'rgb(var(--fp-line-zinc) / <alpha-value>)',
				'line-zinc-subtle': 'rgb(var(--fp-line-zinc-subtle) / <alpha-value>)',
				'line-zinc-strong': 'rgb(var(--fp-line-zinc-strong) / <alpha-value>)',
				'line-slate': 'rgb(var(--fp-line-slate) / <alpha-value>)',
				'line-slate-subtle': 'rgb(var(--fp-line-slate-subtle) / <alpha-value>)',
				'line-slate-strong': 'rgb(var(--fp-line-slate-strong) / <alpha-value>)',
				'line-inverse': 'rgb(var(--fp-line-inverse) / <alpha-value>)',

				/* Status — info (blue). Solids brighten; tinted backgrounds invert to dark tints. */
				info: 'rgb(var(--fp-info) / <alpha-value>)',
				'info-bright': 'rgb(var(--fp-info-bright) / <alpha-value>)',
				'info-strong': 'rgb(var(--fp-info-strong) / <alpha-value>)',
				'info-deep': 'rgb(var(--fp-info-deep) / <alpha-value>)',
				'info-deepest': 'rgb(var(--fp-info-deepest) / <alpha-value>)',
				'info-muted': 'rgb(var(--fp-info-muted) / <alpha-value>)',
				'info-muted-strong': 'rgb(var(--fp-info-muted-strong) / <alpha-value>)',
				'info-line': 'rgb(var(--fp-info-line) / <alpha-value>)',

				/* Status — danger (red). */
				danger: 'rgb(var(--fp-danger) / <alpha-value>)',
				'danger-bright': 'rgb(var(--fp-danger-bright) / <alpha-value>)',
				'danger-soft': 'rgb(var(--fp-danger-soft) / <alpha-value>)',
				'danger-strong': 'rgb(var(--fp-danger-strong) / <alpha-value>)',
				'danger-deep': 'rgb(var(--fp-danger-deep) / <alpha-value>)',
				'danger-muted': 'rgb(var(--fp-danger-muted) / <alpha-value>)',
				'danger-line': 'rgb(var(--fp-danger-line) / <alpha-value>)',

				/* Status — warning (amber) plus the orange/yellow one-offs. */
				warning: 'rgb(var(--fp-warning) / <alpha-value>)',
				'warning-bright': 'rgb(var(--fp-warning-bright) / <alpha-value>)',
				'warning-soft': 'rgb(var(--fp-warning-soft) / <alpha-value>)',
				'warning-strong': 'rgb(var(--fp-warning-strong) / <alpha-value>)',
				'warning-deep': 'rgb(var(--fp-warning-deep) / <alpha-value>)',
				'warning-muted': 'rgb(var(--fp-warning-muted) / <alpha-value>)',
				'warning-muted-strong': 'rgb(var(--fp-warning-muted-strong) / <alpha-value>)',
				'warning-line': 'rgb(var(--fp-warning-line) / <alpha-value>)',
				'warning-line-strong': 'rgb(var(--fp-warning-line-strong) / <alpha-value>)',
				'accent-orange': 'rgb(var(--fp-accent-orange) / <alpha-value>)',
				'accent-yellow': 'rgb(var(--fp-accent-yellow) / <alpha-value>)',

				/* Status — success (green / emerald). */
				success: 'rgb(var(--fp-success) / <alpha-value>)',
				'success-bright': 'rgb(var(--fp-success-bright) / <alpha-value>)',
				'success-soft': 'rgb(var(--fp-success-soft) / <alpha-value>)',
				'success-deep': 'rgb(var(--fp-success-deep) / <alpha-value>)',
				'success-muted': 'rgb(var(--fp-success-muted) / <alpha-value>)',
				'success-line': 'rgb(var(--fp-success-line) / <alpha-value>)',
				'accent-emerald': 'rgb(var(--fp-accent-emerald) / <alpha-value>)',
				'accent-emerald-strong': 'rgb(var(--fp-accent-emerald-strong) / <alpha-value>)',
				'accent-emerald-muted': 'rgb(var(--fp-accent-emerald-muted) / <alpha-value>)',

				/* Accents — indigo / purple / sky / violet. */
				'accent-indigo': 'rgb(var(--fp-accent-indigo) / <alpha-value>)',
				'accent-indigo-strong': 'rgb(var(--fp-accent-indigo-strong) / <alpha-value>)',
				'accent-indigo-muted': 'rgb(var(--fp-accent-indigo-muted) / <alpha-value>)',
				'accent-indigo-line': 'rgb(var(--fp-accent-indigo-line) / <alpha-value>)',
				'accent-purple': 'rgb(var(--fp-accent-purple) / <alpha-value>)',
				'accent-sky': 'rgb(var(--fp-accent-sky) / <alpha-value>)',
				'accent-violet': 'rgb(var(--fp-accent-violet) / <alpha-value>)',

				/* Brand blue — pre-existing literals from tailwind.config.js, now themable. Light unchanged. */
				'brand-blue': 'rgb(var(--fp-brand-blue) / <alpha-value>)',
				'brand-blue-light': 'rgb(var(--fp-brand-blue-light) / <alpha-value>)',

				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))',
					'text-accent-foreground': '#18181B',
				},
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0',
					},
					to: {
						height: 'var(--radix-accordion-content-height)',
					},
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)',
					},
					to: {
						height: '0',
					},
				},
				'spin-once': {
					'0%': { transform: 'rotate(0deg)' },
					'100%': { transform: 'rotate(360deg)' },
				},
				'command-palette-in': {
					from: { opacity: '0', transform: 'translateX(-50%) scale(0.92)' },
					to: { opacity: '1', transform: 'translateX(-50%) scale(1)' },
				},
				'command-palette-out': {
					from: { opacity: '1', transform: 'translateX(-50%) scale(1)' },
					to: { opacity: '0', transform: 'translateX(-50%) scale(0.92)' },
				},
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'spin-once': 'spin-once 0.6s ease-in-out',
				'command-palette-in': 'command-palette-in 0.22s ease-in both',
				'command-palette-out': 'command-palette-out 0.18s ease-in both',
			},
		},
	},
	plugins: [animatePlugin],
};
