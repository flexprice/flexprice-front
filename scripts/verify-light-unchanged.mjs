#!/usr/bin/env node
/**
 * Light-mode regression audit for the dark-theme migration.
 *
 * `verify-theme-tokens.mjs` proves each TOKEN's light value matches its Tailwind source. It cannot
 * catch a class mapped to the wrong token — `text-gray-500` -> `text-content-heading` passes that
 * guard and still changes light mode. This closes that hole.
 *
 * For every file changed since the pre-migration baseline, it resolves every colour-producing class
 * in the old version and in the working-tree version to a concrete light RGB, then compares the two
 * multisets. Any difference is a light-mode change.
 *
 * Handles: Tailwind palette classes, arbitrary values (`bg-[#092E44]`), `--fp-*` tokens, and the
 * semantic keys in tailwind.config.js. Skips `dark:`-prefixed classes, which are dark-only by design.
 *
 *   node scripts/verify-light-unchanged.mjs            # working tree vs baseline
 *   node scripts/verify-light-unchanged.mjs <base> <ref>
 */
import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import palette from 'tailwindcss/colors.js';

/** Commit immediately before the dark-theme rebuild started (the #984 revert). */
const BASE = process.argv[2] || '002ff4b2';
/** Omit to audit the working tree. */
const REF = process.argv[3] || null;

const sh = (cmd) => execSync(cmd, { maxBuffer: 1 << 28 }).toString();
const readRef = (path) => (REF ? sh(`git show ${REF}:${path}`) : readFileSync(path, 'utf8'));
const hex3 = (h) => {
	const s = h.replace('#', '');
	return [0, 2, 4].map((i) => parseInt(s.slice(i, i + 2), 16)).join(',');
};

/** `--fp-*` light values, read from whichever revision we are auditing. */
function fpTokens(css) {
	const i = css.indexOf(':root');
	const open = css.indexOf('{', i);
	let d = 0;
	let body = '';
	for (let j = open; j < css.length; j++) {
		if (css[j] === '{') d++;
		else if (css[j] === '}' && --d === 0) {
			body = css.slice(open + 1, j);
			break;
		}
	}
	const out = new Map();
	for (const m of body.matchAll(/(--fp-[a-z0-9-]+)\s*:\s*([^;]+);/g)) {
		out.set(m[1].replace('--fp-', ''), m[2].trim().split(/\s+/).join(','));
	}
	return out;
}

/** Colour keys in tailwind.config.js that are not plain palette lookups. */
function configKeys(src, fp) {
	const out = new Map();
	const blue = /blue:\s*\{\s*DEFAULT:\s*'([^']+)'\s*,\s*light:\s*'([^']+)'/.exec(src);
	if (blue) {
		out.set('blue', hex3(blue[1]));
		out.set('blue-light', hex3(blue[2]));
	}
	const mf = /muted:\s*\{[^}]*?foreground:\s*'([^']+)'/s.exec(src);
	if (mf) {
		const v = mf[1];
		if (v.startsWith('#')) out.set('muted-foreground', hex3(v));
		else {
			const t = /var\(--fp-([a-z0-9-]+)\)/.exec(v);
			if (t) out.set('muted-foreground', fp.get(t[1]));
		}
	}
	return out;
}

const FP_NEW = fpTokens(readRef('src/index.css'));
const FP_OLD = fpTokens(sh(`git show ${BASE}:src/index.css`));
const CFG_NEW = configKeys(readRef('tailwind.config.js'), FP_NEW);
const CFG_OLD = configKeys(sh(`git show ${BASE}:tailwind.config.js`), FP_OLD);

const FAMILIES = new Set(Object.keys(palette).filter((k) => palette[k] && typeof palette[k] === 'object'));
const PREFIX = 'bg|text|border|ring|divide|fill|stroke|from|to|via|placeholder|decoration|shadow|outline|caret|accent|ring-offset';

function resolve(cls, fp, cfg) {
	const m = new RegExp(`^(?:.*:)?(?:${PREFIX})-(\\[#[0-9a-fA-F]{3,8}\\]|.+?)(?:/[0-9.\\[\\]]+)?$`).exec(cls);
	if (!m) return null;
	const name = m[1];

	const arb = /^\[#([0-9a-fA-F]{3,8})\]$/.exec(name);
	if (arb) {
		let h = arb[1];
		if (h.length === 3) h = [...h].map((c) => c + c).join('');
		return hex3('#' + h.slice(0, 6).toLowerCase());
	}
	if (name === 'white') return '255,255,255';
	if (name === 'black') return '0,0,0';
	if (['transparent', 'current', 'inherit'].includes(name)) return null;
	if (fp.has(name)) return fp.get(name);
	if (cfg.has(name)) return cfg.get(name);

	const parts = name.split('-');
	const step = parts.pop();
	const fam = parts.join('-');
	if (FAMILIES.has(fam) && palette[fam]?.[step]) return hex3(palette[fam][step].toLowerCase());
	return null; // bare family (dead class) or a non-colour utility
}

const CLASS_RE = new RegExp(`\\b(?:[a-z-]+:)*(?:${PREFIX})-(?:\\[#[0-9a-fA-F]{3,8}\\]|[a-zA-Z0-9/.-]+)`, 'g');

/**
 * Strip comments before scanning. Several migrated files carry comments that explain a decision by
 * naming the classes involved ("`content-inverse` is #ffffff, byte-identical to the `bg-white` it
 * replaces"). Those are prose, not styling, and counting them produces false positives.
 */
function stripComments(src) {
	return src
		.replace(/\/\*[\s\S]*?\*\//g, ' ') // block comments, incl. the {/* … */} JSX form
		.replace(/(^|[^:])\/\/[^\n]*/g, '$1 '); // line comments, without eating `https://`
}

function colours(src, fp, cfg) {
	const out = [];
	for (const m of stripComments(src).matchAll(CLASS_RE)) {
		if (/(?:^|:)dark:/.test(m[0])) continue;
		const c = resolve(m[0], fp, cfg);
		if (c) out.push(c);
	}
	return out.sort();
}

const changed = sh(`git diff --name-only ${BASE} ${REF || ''} -- 'src/**/*.tsx' 'src/**/*.ts'`)
	.split('\n')
	.filter(Boolean);

let identical = 0;
let skipped = 0;
const problems = [];

for (const f of changed) {
	let oldSrc;
	try {
		oldSrc = sh(`git show ${BASE}:${f}`);
	} catch {
		skipped++;
		continue; // file did not exist at the baseline
	}
	if (!REF && !existsSync(f)) {
		skipped++;
		continue;
	}
	let newSrc;
	try {
		newSrc = readRef(f);
	} catch {
		skipped++;
		continue;
	}

	const a = colours(oldSrc, FP_OLD, CFG_OLD);
	const b = colours(newSrc, FP_NEW, CFG_NEW);
	if (a.join('|') === b.join('|')) {
		identical++;
		continue;
	}

	const ca = {};
	const cb = {};
	for (const x of a) ca[x] = (ca[x] || 0) + 1;
	for (const x of b) cb[x] = (cb[x] || 0) + 1;
	const delta = [];
	for (const k of new Set([...Object.keys(ca), ...Object.keys(cb)])) {
		const before = ca[k] || 0;
		const after = cb[k] || 0;
		if (before !== after) delta.push(`rgb(${k}): ${before} -> ${after}`);
	}
	problems.push({ file: f, delta });
}

console.log(`baseline ${BASE} -> ${REF || 'working tree'}`);
console.log(`  files changed:        ${changed.length}`);
console.log(`  new/removed, skipped: ${skipped}`);
console.log(`  light-identical:      ${identical}`);
console.log(`  light CHANGED:        ${problems.length}`);

if (problems.length) {
	console.error('\n✗ light mode would change in these files:\n');
	for (const p of problems) {
		console.error(`  ${p.file}`);
		for (const d of p.delta) console.error(`      ${d}`);
	}
	console.error('\nEach line is a light colour whose usage count changed — i.e. a class mapped to the wrong token.');
	process.exit(1);
}

console.log(`\n✓ light mode unchanged across all ${identical} audited files.`);
