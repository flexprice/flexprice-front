#!/usr/bin/env node
/**
 * Contrast-checks token pairs that actually occur together in the rendered tree.
 *
 * The earlier AA pass checked each content token against the two page surfaces, which is the right
 * baseline but misses the case that actually bites: text whose background is neither the page nor
 * the default, where the pairing is deliberate. A chip whose text and fill both moved to dark can
 * end up legible in the abstract and unreadable in place.
 *
 * Pairs come from a real TypeScript parse of the JSX rather than a regex over className strings, so
 * text three levels inside a `bg-surface` card is paired with that card. See scripts/lib/
 * jsx-color-pairs.mjs for what that does and does not resolve.
 *
 * Run: node scripts/verify-dark-contrast.mjs [--all]
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative } from 'node:path';
import { walkColorPairs, ROOT_SURFACES } from './lib/jsx-color-pairs.mjs';

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
 * The bar is NOT absolute AA. Light mode is frozen byte-identical to `main` and already fails AA on
 * a number of these pairs — `text-content-subtle` on the sidebar reads 2.41:1 today. Fixing those is
 * a visible light-mode change and belongs in its own PR, so holding dark to a bar light does not
 * meet would mean either failing forever or quietly editing light.
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

const seen = new Map();

const record = (fg, bg, rel) => {
	if (!darkTokens.has(fg) || !darkTokens.has(bg) || !lightTokens.has(fg) || !lightTokens.has(bg)) return;
	const key = `${fg}|${bg}`;
	if (!seen.has(key)) {
		seen.set(key, {
			fg,
			bg,
			light: contrast(lightTokens.get(fg), lightTokens.get(bg)),
			dark: contrast(darkTokens.get(fg), darkTokens.get(bg)),
			files: new Set(),
		});
	}
	seen.get(key).files.add(rel);
};

for (const abs of files) {
	const rel = relative(root, abs);
	if (rel.startsWith('src/components/customer-portal') || rel.startsWith('src/pages/customer-portal') || rel.startsWith('src/pages/checkout')) continue;

	walkColorPairs(readFileSync(abs, 'utf8'), abs, ({ fg, bg }) => {
		// No ancestor background in this file means the element lands on the page itself.
		for (const surface of bg ? [bg] : ROOT_SURFACES) record(fg, surface, rel);
	});
}

const pairs = [...seen.values()].sort((a, b) => a.dark - b.dark);
const regressions = pairs.filter((p) => p.light >= AA && p.dark < AA);

const fmt = (p) =>
	`  light ${p.light.toFixed(2).padStart(5)}:1 -> dark ${p.dark.toFixed(2).padStart(5)}:1   text-${p.fg} on bg-${p.bg}\n` +
	`      ${[...p.files].slice(0, 3).join(', ')}${p.files.size > 3 ? ` (+${p.files.size - 3} more)` : ''}`;

if (showAll) {
	console.log(`\nAll ${pairs.length} token pairs, worst dark first:\n`);
	for (const p of pairs) console.log(fmt(p));
	console.log('');
}

if (regressions.length) {
	console.error(`\n✗ ${regressions.length} token pair(s) pass AA in light but FAIL in dark:\n`);
	for (const p of regressions) console.error(fmt(p));
	console.error('\nLift the dark value in scripts/theme-tokens.mjs. Light is frozen, so the fix is');
	console.error('always on the dark side — never by editing the light value to close the gap.\n');
	process.exit(1);
}

const belowAA = pairs.filter((p) => p.dark < AA);
console.log(`✓ dark contrast — ${pairs.length} token pairs, none broken by dark that worked in light.`);
if (belowAA.length) {
	console.log(`  ${belowAA.length} still below AA in BOTH themes (pre-existing light design, not this migration's to fix):`);
	for (const p of belowAA) console.log(`    light ${p.light.toFixed(2)}:1 / dark ${p.dark.toFixed(2)}:1  text-${p.fg} on bg-${p.bg}`);
}
