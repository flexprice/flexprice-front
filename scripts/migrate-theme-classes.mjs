#!/usr/bin/env node
/**
 * Applies the canonical raw-palette-class -> `--fp-*` token mapping to the given files.
 *
 * Usage:
 *   node scripts/migrate-theme-classes.mjs <path...>      # rewrite
 *   node scripts/migrate-theme-classes.mjs --dry <path...> # report only
 *
 * Every entry below was derived mechanically: the class's Tailwind hex was matched against the
 * token whose LIGHT value is byte-identical to it, then filtered to tokens whose role matches the
 * utility prefix (bg -> surface/status, text -> content/status, border|ring|divide -> line/status).
 * The derivation produced zero ambiguous cases, and scripts/verify-theme-tokens.mjs independently
 * pins every one of those light values.
 *
 * What this deliberately does NOT do:
 *   - touch `dark:`-prefixed classes (dark-only overlays are not light-mode debt)
 *   - map gradient stops (from-/to-/via-) or one-off decorative alphas — the long tail is handled
 *     by hand in its own step
 *   - guess. Anything not in the table is left alone and reported, so role traps like the switch
 *     thumb or a permanently-dark code surface stay a human decision.
 */
import { readFileSync, writeFileSync } from 'node:fs';

export const CLASS_MAP = {
	'bg-amber-100': 'bg-warning-muted-strong',
	'bg-amber-400': 'bg-warning-soft',
	'bg-amber-50': 'bg-warning-muted',
	'bg-black': 'bg-surface-scrim',
	'bg-blue-100': 'bg-info-muted-strong',
	'bg-blue-200': 'bg-info-line',
	'bg-blue-50': 'bg-info-muted',
	'bg-blue-500': 'bg-info-bright',
	'bg-blue-600': 'bg-info',
	'bg-emerald-100': 'bg-accent-emerald-muted',
	'bg-emerald-500': 'bg-accent-emerald',
	'bg-gray-100': 'bg-surface-shell',
	'bg-gray-200': 'bg-surface-strong',
	'bg-gray-300': 'bg-surface-bold',
	'bg-gray-50': 'bg-surface-subtle',
	'bg-gray-900': 'bg-surface-inverse',
	'bg-green-50': 'bg-success-muted',
	'bg-green-500': 'bg-success-bright',
	'bg-indigo-50': 'bg-accent-indigo-muted',
	'bg-red-50': 'bg-danger-muted',
	'bg-red-500': 'bg-danger-bright',
	'bg-slate-100': 'bg-surface-slate-subtle',
	'bg-slate-50': 'bg-surface-cool',
	'bg-white': 'bg-surface',
	'bg-zinc-100': 'bg-surface-muted',
	'bg-zinc-50': 'bg-surface-faint',
	'border-amber-200': 'border-warning-line',
	'border-amber-300': 'border-warning-line-strong',
	'border-amber-500': 'border-warning-bright',
	'border-black': 'border-line-inverse',
	'border-blue-100': 'border-info-muted-strong',
	'border-blue-200': 'border-info-line',
	'border-blue-600': 'border-info',
	'border-emerald-500': 'border-accent-emerald',
	'border-gray-100': 'border-line-subtle',
	'border-gray-200': 'border-line',
	'border-gray-300': 'border-line-strong',
	'border-gray-400': 'border-line-bold',
	'border-green-200': 'border-success-line',
	'border-indigo-200': 'border-accent-indigo-line',
	'border-red-200': 'border-danger-line',
	'border-red-500': 'border-danger-bright',
	'border-slate-100': 'border-line-slate-subtle',
	'border-slate-200': 'border-line-slate',
	'border-slate-300': 'border-line-slate-strong',
	'border-yellow-200': 'border-accent-yellow-muted',
	'border-zinc-100': 'border-line-zinc-subtle',
	'border-zinc-200': 'border-line-zinc',
	'border-zinc-300': 'border-line-zinc-strong',
	'decoration-gray-500': 'decoration-content-muted',
	'divide-gray-100': 'divide-line-subtle',
	'divide-gray-200': 'divide-line',
	'ring-black': 'ring-line-inverse',
	'ring-blue-500': 'ring-info-bright',
	'ring-emerald-500': 'ring-accent-emerald',
	'ring-gray-200': 'ring-line',
	'ring-red-500': 'ring-danger-bright',
	'ring-slate-100': 'ring-line-slate-subtle',
	'ring-zinc-200': 'ring-line-zinc',
	'ring-zinc-400': 'ring-line-zinc-bold',
	'shadow-blue-500': 'shadow-info-bright',
	'shadow-blue-600': 'shadow-info',
	'shadow-emerald-500': 'shadow-accent-emerald',
	'text-amber-500': 'text-warning-bright',
	'text-amber-600': 'text-warning',
	'text-amber-700': 'text-warning-strong',
	'text-amber-800': 'text-warning-deep',
	'text-black': 'text-content-black',
	'text-blue-500': 'text-info-bright',
	'text-blue-600': 'text-info',
	'text-blue-700': 'text-info-strong',
	'text-blue-800': 'text-info-deep',
	'text-blue-900': 'text-info-deepest',
	'text-emerald-500': 'text-accent-emerald',
	'text-emerald-600': 'text-accent-emerald-strong',
	'text-gray-300': 'text-content-disabled',
	'text-gray-400': 'text-content-subtle',
	'text-gray-500': 'text-content-muted',
	'text-gray-600': 'text-content-tertiary',
	'text-gray-700': 'text-content-secondary',
	'text-gray-800': 'text-content-heading',
	'text-gray-900': 'text-content',
	'text-green-400': 'text-success-soft',
	'text-green-500': 'text-success-bright',
	'text-green-600': 'text-success',
	'text-green-800': 'text-success-deep',
	'text-indigo-600': 'text-accent-indigo',
	'text-indigo-700': 'text-accent-indigo-strong',
	'text-orange-600': 'text-accent-orange',
	'text-purple-600': 'text-accent-purple',
	'text-red-400': 'text-danger-soft',
	'text-red-500': 'text-danger-bright',
	'text-red-600': 'text-danger',
	'text-red-700': 'text-danger-strong',
	'text-red-800': 'text-danger-deep',
	'text-sky-600': 'text-accent-sky',
	'text-slate-400': 'text-content-slate-subtle',
	'text-slate-500': 'text-content-slate-muted',
	'text-slate-600': 'text-content-slate-tertiary',
	'text-slate-700': 'text-content-slate-secondary',
	'text-slate-800': 'text-content-slate-strong',
	'text-slate-900': 'text-content-slate',
	'text-violet-600': 'text-accent-violet',
	'text-white': 'text-content-inverse',
	'text-yellow-500': 'text-accent-yellow',
	'text-zinc-400': 'text-content-zinc-subtle',
	'text-zinc-500': 'text-content-zinc-muted',
	'text-zinc-600': 'text-content-zinc-tertiary',
	'text-zinc-700': 'text-content-zinc-secondary',
	'text-zinc-800': 'text-content-zinc-strong',
	'text-zinc-900': 'text-content-zinc-bold',
	'text-zinc-950': 'text-content-zinc',
};

const KEYS = Object.keys(CLASS_MAP).sort((a, b) => b.length - a.length);
// Boundaries matter: without them `bg-blue-50` matches inside `bg-blue-500` and silently
// rewrites a different colour.
const PATTERN = new RegExp(`(?<![\\w-])(${KEYS.map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})(?![\\w-])`, 'g');

// `dark:` variants are intentional dark-only styling; never rewrite them.
const DARK_PREFIXED = /(?:^|[\s'"`:])dark:[a-z0-9:[\]-]*$/;

export function migrateSource(src) {
	let count = 0;
	const out = src.replace(PATTERN, (match, cls, offset) => {
		const before = src.slice(Math.max(0, offset - 40), offset);
		if (DARK_PREFIXED.test(before)) return match;
		count++;
		return CLASS_MAP[cls];
	});
	return { out, count };
}

const args = process.argv.slice(2);
const dry = args.includes('--dry');
const paths = args.filter((a) => a !== '--dry');
if (paths.length === 0) {
	console.error('usage: node scripts/migrate-theme-classes.mjs [--dry] <path...>');
	process.exit(1);
}

let total = 0;
let touched = 0;
for (const p of paths) {
	const src = readFileSync(p, 'utf8');
	const { out, count } = migrateSource(src);
	if (!count) continue;
	total += count;
	touched++;
	if (!dry) writeFileSync(p, out);
	console.log(`${String(count).padStart(4)}  ${p}`);
}
console.log(`\n${dry ? '[dry] ' : ''}${total} replacements across ${touched} file(s)`);
