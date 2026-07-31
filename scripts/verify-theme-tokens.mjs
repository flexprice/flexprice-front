#!/usr/bin/env node
/**
 * Byte-identity guard for the dark-theme token layer.
 *
 * The whole rebuild rests on one invariant: swapping a hardcoded Tailwind class for an `--fp-*`
 * token must not change a single rendered byte in light mode. PR #984 was reverted precisely
 * because that invariant was assumed rather than checked.
 *
 * This asserts, for every token in scripts/theme-tokens.mjs:
 *   1. `:root` declares it, and its value equals the RGB channels of the Tailwind color it claims
 *      to replace.
 *   2. `.dark` declares it, and the value differs from light (a token that never changes is dead
 *      weight — except the scrim, which is deliberately black in both).
 *   3. tailwind.config.js exposes it as `rgb(var(--fp-<name>) / <alpha-value>)`.
 *
 * Run: node scripts/verify-theme-tokens.mjs
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import palette from 'tailwindcss/colors.js';
import { ALL_TOKENS, hexToChannels, resolveLight } from './theme-tokens.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const css = readFileSync(join(root, 'src/index.css'), 'utf8');
const twConfig = readFileSync(join(root, 'tailwind.config.js'), 'utf8');

/** Extract the body of a top-level block (`:root { … }`) from the CSS, brace-balanced. */
function blockBody(source, selector) {
	const start = source.indexOf(selector);
	if (start === -1) throw new Error(`Selector not found in src/index.css: ${selector}`);
	const open = source.indexOf('{', start);
	let depth = 0;
	for (let i = open; i < source.length; i++) {
		if (source[i] === '{') depth++;
		else if (source[i] === '}' && --depth === 0) return source.slice(open + 1, i);
	}
	throw new Error(`Unbalanced braces after ${selector}`);
}

const declarations = (body, pattern = /(--fp-[a-z0-9-]+)\s*:\s*([^;]+);/g) => {
	const map = new Map();
	for (const m of body.matchAll(pattern)) map.set(m[1], m[2].trim());
	return map;
};

const rootBody = blockBody(css, ':root');
const lightVars = declarations(rootBody);
const darkVars = declarations(blockBody(css, '.dark'));

const errors = [];

/*
 * Frozen baseline of the pre-existing :root declarations, captured from main.
 *
 * These are the variables the light UI actually renders through. #984 was reverted because it
 * re-valued them — that is the single change this whole rebuild exists to avoid, so it is pinned
 * here rather than left to reviewer diligence. Adding a NEW variable to :root is fine; changing or
 * removing one of these is not.
 *
 * Two of these are already broken on main and are deliberately preserved as-is: `--background` is a
 * hex fed to `hsl()`, and `--muted-foreground` is a quoted string. Fixing either would change light
 * mode, so they stay wrong until someone decides to fix them in their own PR.
 */
const ROOT_BASELINE = {
	'--font-sans': "'Geist', sans-serif",
	'--background': '#f8fafc',
	'--foreground': '0 0% 3.9%',
	'--card': '0 0% 100%',
	'--card-foreground': '0 0% 3.9%',
	'--popover': '0 0% 100%',
	'--popover-foreground': '0 0% 3.9%',
	'--primary': '0 0% 9%',
	'--primary-foreground': '0 0% 98%',
	'--secondary': '0 0% 96.1%',
	'--secondary-foreground': '0 0% 9%',
	'--muted': '0 0% 96.1%',
	'--muted-foreground': "'#64748B'",
	'--accent': '0 0% 96.1%',
	'--accent-foreground': '#f4f4f5',
	'--destructive': '0 84.2% 60.2%',
	'--destructive-foreground': '0 0% 98%',
	'--border': '0 0% 89.8%',
	'--input': '0 0% 89.8%',
	'--ring': '0 0% 3.9%',
	'--chart-1': '12 76% 61%',
	'--chart-2': '173 58% 39%',
	'--chart-3': '197 37% 24%',
	'--chart-4': '43 74% 66%',
	'--chart-5': '27 87% 67%',
	'--radius': '6px',
};

const legacyRoot = declarations(rootBody, /(--(?!fp-)[a-z0-9-]+)\s*:\s*([^;]+);/g);
for (const [name, expected] of Object.entries(ROOT_BASELINE)) {
	const actual = legacyRoot.get(name);
	if (actual === undefined) {
		errors.push(`${name}: removed from :root — light mode would change`);
	} else if (actual !== expected) {
		errors.push(`${name}: :root value changed from "${expected}" to "${actual}" — light mode would change`);
	}
}
const SCRIM = new Set(['surface-scrim']); // intentionally identical across themes

for (const { name, light, dark } of ALL_TOKENS) {
	const cssVar = `--fp-${name}`;
	const expected = hexToChannels(resolveLight(light, palette));

	const actualLight = lightVars.get(cssVar);
	if (!actualLight) {
		errors.push(`${cssVar}: missing from :root`);
	} else if (actualLight !== expected) {
		errors.push(
			`${cssVar}: LIGHT DRIFT — :root has "${actualLight}" but ${light} is "${expected}" ` +
				`(${resolveLight(light, palette)}). Light mode would change.`,
		);
	}

	const actualDark = darkVars.get(cssVar);
	const expectedDark = hexToChannels(dark);
	if (!actualDark) {
		errors.push(`${cssVar}: missing from .dark`);
	} else if (actualDark !== expectedDark) {
		errors.push(`${cssVar}: .dark has "${actualDark}" but the table says "${expectedDark}" (${dark})`);
	} else if (actualDark === expected && !SCRIM.has(name)) {
		errors.push(`${cssVar}: dark value is identical to light — token does nothing`);
	}

	if (!twConfig.includes(`rgb(var(${cssVar}) / <alpha-value>)`)) {
		errors.push(`${cssVar}: not wired into tailwind.config.js as rgb(var(${cssVar}) / <alpha-value>)`);
	}
}

// Catch tokens declared in CSS but absent from the table — those bypass the guard entirely.
const known = new Set(ALL_TOKENS.map((t) => `--fp-${t.name}`));
for (const declared of lightVars.keys()) {
	if (!known.has(declared)) errors.push(`${declared}: declared in :root but absent from scripts/theme-tokens.mjs`);
}

if (errors.length) {
	console.error(`\n✗ theme token check failed (${errors.length} problem${errors.length === 1 ? '' : 's'}):\n`);
	for (const e of errors) console.error(`  • ${e}`);
	console.error('');
	process.exit(1);
}

console.log(`✓ ${ALL_TOKENS.length} theme tokens verified — every light value is byte-identical to its Tailwind source.`);
