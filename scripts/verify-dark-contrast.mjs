#!/usr/bin/env node
/**
 * Contrast-checks token pairs that actually occur together in the source.
 *
 * The earlier AA pass checked each content token against the two page surfaces, which is the right
 * baseline but misses the case that actually bites: a `text-*` and a `bg-*` written on the SAME
 * element, where the pairing is deliberate and neither value is the page background. A chip whose
 * text and fill both moved to dark can end up legible in the abstract and unreadable in place.
 *
 * Only same-element pairs are checked. Text inheriting from an ancestor's background is not
 * resolvable statically, so a clean run here is not a claim about the whole app — it is a claim
 * about every pair the source states explicitly.
 *
 * Run: node scripts/verify-dark-contrast.mjs [--light] [--all]
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const showAll = process.argv.includes('--all');

/** Pull `--fp-name: r g b` out of one marked region of index.css. */
function readTokens(mode) {
	const css = readFileSync(join(root, 'src/index.css'), 'utf8');
	const region = css.match(new RegExp(`fp-tokens:begin ${mode}([\\s\\S]*?)fp-tokens:end ${mode}`));
	if (!region) throw new Error(`no ${mode} token region in src/index.css`);

	const map = new Map();
	for (const m of region[1].matchAll(/--fp-([\w-]+):\s*(\d+)\s+(\d+)\s+(\d+)/g)) {
		map.set(m[1], [Number(m[2]), Number(m[3]), Number(m[4])]);
	}
	return map;
}
const lightTokens = readTokens('light');
const darkTokens = readTokens('dark');

const luminance = ([r, g, b]) => {
	const [R, G, B] = [r, g, b].map((c) => {
		const s = c / 255;
		return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
	});
	return 0.2126 * R + 0.7152 * G + 0.0722 * B;
};
const contrast = (a, b) => {
	const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
	return (hi + 0.05) / (lo + 0.05);
};

/**
 * The bar is NOT absolute AA. Light mode is frozen byte-identical to `main`, and six of these pairs
 * already fail AA there — `text-content-subtle` on the sidebar reads 2.41:1 today. Fixing those is a
 * visible light-mode change and belongs in its own PR, so holding dark to a bar light does not meet
 * would mean either failing forever or quietly editing light.
 *
 * What this guard asserts instead is the invariant the migration can actually own: **dark never
 * breaks a pair that worked in light.** Concretely — light >= 4.5 but dark < 4.5 is a regression this
 * migration introduced; both below 4.5 is pre-existing design and is reported, not failed.
 *
 * Losing headroom above the threshold is deliberately ignored. Dark surfaces are darker than white,
 * so nearly every pair drops a few points — 21:1 to 16.65:1 is arithmetic, not a defect.
 */
const AA = 4.5;

const files = [];
(function walk(dir) {
	for (const entry of readdirSync(dir)) {
		const p = join(dir, entry);
		if (statSync(p).isDirectory()) walk(p);
		else if (/\.tsx$/.test(entry) && !/\.(test|spec|stories)\./.test(entry)) files.push(p);
	}
})(join(root, 'src'));

const stripComments = (src) => src.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:])\/\/[^\n]*/g, '$1 ');

// A className string is the unit of pairing — `text-x` and `bg-y` in one attribute are on one element.
const CLASSNAME_RE = /class(?:Name)?\s*=\s*(?:"([^"]*)"|'([^']*)'|\{`([^`]*)`\}|\{'([^']*)'\}|\{"([^"]*)"\})/g;
const seen = new Map();

for (const abs of files) {
	const rel = relative(root, abs);
	if (rel.startsWith('src/components/customer-portal') || rel.startsWith('src/pages/customer-portal') || rel.startsWith('src/pages/checkout')) continue;

	for (const m of stripComments(readFileSync(abs, 'utf8')).matchAll(CLASSNAME_RE)) {
		const value = m[1] ?? m[2] ?? m[3] ?? m[4] ?? m[5] ?? '';
		// `dark:` variants are a separate cascade; a bare pair is what renders in both themes.
		const words = value.split(/\s+/).filter((w) => w && !w.includes(':'));

		const fg = words.filter((w) => w.startsWith('text-')).map((w) => w.slice(5));
		const bg = words.filter((w) => w.startsWith('bg-')).map((w) => w.slice(3));

		for (const f of fg) {
			for (const b of bg) {
				if (!darkTokens.has(f) || !darkTokens.has(b) || !lightTokens.has(f) || !lightTokens.has(b)) continue;
				const key = `${f}|${b}`;
				if (!seen.has(key)) {
					seen.set(key, {
						fg: f,
						bg: b,
						light: contrast(lightTokens.get(f), lightTokens.get(b)),
						dark: contrast(darkTokens.get(f), darkTokens.get(b)),
						files: new Set(),
					});
				}
				seen.get(key).files.add(rel);
			}
		}
	}
}

const pairs = [...seen.values()].sort((a, b) => a.dark - b.dark);
const regressions = pairs.filter((p) => p.light >= AA && p.dark < AA);

const fmt = (p) =>
	`  light ${p.light.toFixed(2).padStart(5)}:1 -> dark ${p.dark.toFixed(2).padStart(5)}:1   text-${p.fg} on bg-${p.bg}\n` +
	`      ${[...p.files].slice(0, 3).join(', ')}${p.files.size > 3 ? ` (+${p.files.size - 3} more)` : ''}`;

if (showAll) {
	console.log(`\nAll ${pairs.length} same-element token pairs, worst dark first:\n`);
	for (const p of pairs) console.log(fmt(p));
	console.log('');
}

if (regressions.length) {
	console.error(`\n✗ ${regressions.length} same-element pair(s) pass AA in light but FAIL in dark:\n`);
	for (const p of regressions) console.error(fmt(p));
	console.error('\nLift the dark value in scripts/theme-tokens.mjs. Light is frozen, so the fix is');
	console.error('always on the dark side — never by editing the light value to close the gap.\n');
	process.exit(1);
}

const belowAA = pairs.filter((p) => p.dark < AA);
console.log(`✓ dark contrast — ${pairs.length} same-element token pairs, none broken by dark that worked in light.`);
if (belowAA.length) {
	console.log(`  ${belowAA.length} still below AA in BOTH themes (pre-existing light design, not this migration's to fix):`);
	for (const p of belowAA) console.log(`    light ${p.light.toFixed(2)}:1 / dark ${p.dark.toFixed(2)}:1  text-${p.fg} on bg-${p.bg}`);
}
