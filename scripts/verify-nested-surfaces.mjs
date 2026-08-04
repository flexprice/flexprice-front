#!/usr/bin/env node
/**
 * Finds backgrounds that are invisible in light and loud in dark.
 *
 * The empty-state description carried `bg-[#F9F9F9]` inside a `bg-[#fafafa]` card — one step apart
 * out of 255, so for years it read as a single flat surface and nobody noticed the inner background
 * was redundant. Tokenizing maps colours by ROLE, not by value, and roles diverge in dark: the card
 * became panel #1f1f22 while the description became sidebar chrome #0f0f10. Same markup, and now a
 * near-black rectangle sits behind the text.
 *
 * No existing guard could see it. verify:light passes because light is byte-identical.
 * verify:dark-contrast passes because the text is perfectly legible on either. The defect is not
 * contrast and not drift — it is a RELATIONSHIP between two surfaces that light hid.
 *
 * So the rule here is about the relationship: if a nested background is invisible against its parent
 * in light, it must stay invisible in dark.
 *
 * Run: node scripts/verify-nested-surfaces.mjs [--all]
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative } from 'node:path';
import { walkNestedBackgrounds } from './lib/jsx-color-pairs.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const showAll = process.argv.includes('--all');

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
const light = readTokens('light');
const dark = readTokens('dark');

/** Max per-channel difference — the plain question "can you see the edge between these two?". */
const delta = (a, b) => Math.max(Math.abs(a[0] - b[0]), Math.abs(a[1] - b[1]), Math.abs(a[2] - b[2]));

/**
 * INVISIBLE is deliberately tight. Two greys within 3/255 are the same surface to the eye; anything
 * more is a deliberate step someone chose to be able to see.
 *
 * VISIBLE is the level at which a dark edge reads as a distinct block rather than a subtle layer.
 * Between the two is a grey zone that is reported under --all but not failed.
 */
const INVISIBLE = 3;
const VISIBLE = 8;

const files = [];
(function walk(dir) {
	for (const entry of readdirSync(dir)) {
		const p = join(dir, entry);
		if (statSync(p).isDirectory()) walk(p);
		else if (/\.tsx$/.test(entry) && !/\.(test|spec|stories)\./.test(entry)) files.push(p);
	}
})(join(root, 'src'));

const seen = new Map();
for (const abs of files) {
	const rel = relative(root, abs);
	if (rel.startsWith('src/components/customer-portal') || rel.startsWith('src/pages/customer-portal') || rel.startsWith('src/pages/checkout')) continue;

	walkNestedBackgrounds(readFileSync(abs, 'utf8'), abs, ({ child, parent }) => {
		if (!light.has(child) || !light.has(parent) || !dark.has(child) || !dark.has(parent)) return;

		const key = `${child}|${parent}`;
		if (!seen.has(key)) {
			seen.set(key, {
				child,
				parent,
				light: delta(light.get(child), light.get(parent)),
				dark: delta(dark.get(child), dark.get(parent)),
				files: new Set(),
			});
		}
		seen.get(key).files.add(rel);
	});
}

const pairs = [...seen.values()].sort((a, b) => b.dark - b.light - (a.dark - a.light));
const offenders = pairs.filter((p) => p.light <= INVISIBLE && p.dark >= VISIBLE);

const fmt = (p) =>
	`  light Δ${String(p.light).padStart(3)}  ->  dark Δ${String(p.dark).padStart(3)}   bg-${p.child} inside bg-${p.parent}\n` +
	`      ${[...p.files].slice(0, 4).join(', ')}${p.files.size > 4 ? ` (+${p.files.size - 4} more)` : ''}`;

if (showAll) {
	console.log(`\nAll ${pairs.length} nested background pairs, biggest light->dark divergence first:\n`);
	for (const p of pairs) console.log(fmt(p));
	console.log('');
}

if (offenders.length) {
	console.error(`\n✗ ${offenders.length} nested background(s) invisible in light but visible in dark:\n`);
	for (const p of offenders) console.error(fmt(p));
	console.error('\nIn light these read as one flat surface, so the inner background is decoration nobody');
	console.error('has ever seen. In dark it becomes a distinct block. Either drop the inner background,');
	console.error('or point it at a token whose dark value matches its parent.\n');
	process.exit(1);
}

console.log(`✓ nested surfaces — ${pairs.length} parent/child background pairs, none that light hides and dark reveals.`);
