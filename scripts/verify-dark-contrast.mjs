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
import { walkColorPairs, walkVariantPairs, ROOT_SURFACES } from './lib/jsx-color-pairs.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const showAll = process.argv.includes('--all');

const hslToRgb = (h, s, l) => {
	s /= 100;
	l /= 100;
	const k = (n) => (n + h / 30) % 12;
	const a = s * Math.min(l, 1 - l);
	const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
	return [f(0), f(8), f(4)].map((v) => Math.round(v * 255));
};

/**
 * The shadcn semantic layer (`--primary`, `--destructive`, …) is NOT part of the `--fp-*` table but
 * carries the most-used pairings in the app — every filled button is `bg-primary` over
 * `text-primary-foreground`. It is stored as bare HSL channels rather than RGB, so it needs its own
 * parse.
 *
 * Three light values are malformed on `main` and reproduced here byte-for-byte: `--background` and
 * `--accent-foreground` hold a hex where `hsl()` expects channels, and `--muted-foreground` holds a
 * QUOTED hex. Those are skipped rather than guessed at — see MALFORMED below.
 */
function readShadcn(scopeBody) {
	const map = new Map();
	const malformed = [];
	for (const m of scopeBody.matchAll(/--([\w-]+):\s*([^;]+);/g)) {
		const [, name, raw] = m;
		if (name.startsWith('fp-') || /^(font|radius)/.test(name)) continue;

		const value = raw.replace(/\/\*[\s\S]*?\*\//g, '').trim();
		const hsl = value.match(/^([\d.]+)\s+([\d.]+)%\s+([\d.]+)%$/);
		if (hsl) map.set(name, hslToRgb(Number(hsl[1]), Number(hsl[2]), Number(hsl[3])));
		else if (/^['"]?#[0-9a-fA-F]{6}['"]?$/.test(value)) malformed.push(name);
	}
	return { map, malformed };
}

/** Pull `--fp-name: r g b` out of one marked region of index.css, plus the shadcn layer around it. */
function readTokens(mode) {
	const css = readFileSync(join(root, 'src/index.css'), 'utf8');
	const region = css.match(new RegExp(`fp-tokens:begin ${mode}([\\s\\S]*?)fp-tokens:end ${mode}`));
	if (!region) throw new Error(`no ${mode} token region in src/index.css`);

	const map = new Map();
	for (const m of region[1].matchAll(/--fp-([\w-]+):\s*(\d+)\s+(\d+)\s+(\d+)/g)) {
		map.set(m[1], [Number(m[2]), Number(m[3]), Number(m[4])]);
	}

	// The shadcn block sits in the same rule, outside the generated markers.
	const scopeStart = css.lastIndexOf(mode === 'light' ? ':root' : '.dark', css.indexOf(region[0]));
	const { map: shadcn, malformed } = readShadcn(css.slice(scopeStart, css.indexOf(region[0])));
	for (const [k, v] of shadcn) if (!map.has(k)) map.set(k, v);

	return { map, malformed };
}
const { map: lightTokens, malformed: MALFORMED } = readTokens('light');
const { map: darkTokens } = readTokens('dark');

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

	const src = readFileSync(abs, 'utf8');
	walkColorPairs(src, abs, ({ fg, bg }) => {
		// No ancestor background in this file means the element lands on the page itself.
		for (const surface of bg ? [bg] : ROOT_SURFACES) record(fg, surface, rel);
	});
	walkVariantPairs(src, abs, ({ fg, bg }) => record(fg, bg, rel));
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
if (MALFORMED.length) {
	console.log(`  note: ${MALFORMED.length} light shadcn var(s) hold a hex where hsl() expects channels, so they are`);
	console.log(`  skipped here: ${MALFORMED.map((n) => `--${n}`).join(', ')}. Pre-existing on main, reproduced byte-for-byte.`);
}
if (belowAA.length) {
	console.log(`  ${belowAA.length} still below AA in BOTH themes (pre-existing light design, not this migration's to fix):`);
	for (const p of belowAA) console.log(`    light ${p.light.toFixed(2)}:1 / dark ${p.dark.toFixed(2)}:1  text-${p.fg} on bg-${p.bg}`);
}
