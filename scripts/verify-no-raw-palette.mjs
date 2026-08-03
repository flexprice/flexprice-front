#!/usr/bin/env node
/**
 * Stops raw Tailwind palette classes creeping back into themed code.
 *
 * The migration replaced ~2,400 of them with `--fp-*` tokens. Without a guard the next feature
 * branch reintroduces `bg-white` and the dark theme quietly rots one component at a time.
 *
 * Deliberately NOT an ESLint rule: the exemptions below are per-file with reasons, and `dark:`
 * prefixes have to be understood rather than pattern-matched, which `no-restricted-syntax`
 * selectors handle badly.
 *
 * Run: node scripts/verify-no-raw-palette.mjs
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

/**
 * Whole trees that are intentionally untokenized.
 *
 * The customer portal and checkout are public, tenant-facing routes with their own `--portal-*`
 * theming, and dark mode is deliberately never applied there. See docs/dark-theme/AUDIT.md.
 */
const EXEMPT_TREES = ['src/components/customer-portal', 'src/pages/customer-portal', 'src/pages/checkout'];

/**
 * Individual files that keep literal colours, with the reason. Each sits on a surface that does not
 * change between themes, so tokenizing them would actively break the component.
 */
const EXEMPT_FILES = {
	'src/components/molecules/JsonEditor/JsonEditor.tsx': "editor chrome sits on Prism's nightOwl background, dark in both themes",
	'src/components/atoms/CodeBlock/CodeBlock.tsx': "copy button sits on Prism's nightOwl background, dark in both themes",
	'src/pages/onboarding/onboarding.tsx': 'close button sits on a scrim that is black in both themes',
	'src/pages/auth/templates/Template2/Template2.tsx': 'tagline sits on a background photo',
	'src/pages/product-catalog/groups/GroupHeader.tsx': 'avatar tile stays mid-grey; white beats content-inverse 7.5:1 to 2.4:1',
	'src/components/molecules/DebugMenu/DebugMenu.tsx': 'tooltip is black in both themes via surface-scrim',
	'src/components/molecules/Events/EventTrackerStep.tsx': 'step marker on a fixed brand circle',
	'src/pages/auth/templates/FlexpriceDefault/LandingSection.tsx': 'text sits on a fixed light background photo, identical in both themes',
};

const PREFIX = 'bg|text|border|ring|divide|fill|stroke|placeholder|from|to|via|shadow|outline|decoration|caret|accent|ring-offset';
const FAMILY =
	'white|black|gray|slate|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose';
// A class is only a violation when it is NOT reached through a `dark:` variant — those are
// dark-only overlays, which are legitimate styling rather than un-migrated light-mode colour.
const CLASS_RE = new RegExp(`(?<![\\w-])((?:[a-z-]+:)*)(?:${PREFIX})-(?:${FAMILY})(?:-\\d{2,3})?(?![\\w-])`, 'g');

const stripComments = (src) => src.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:])\/\/[^\n]*/g, '$1 ');

const files = [];
(function walk(dir) {
	for (const entry of readdirSync(dir)) {
		const p = join(dir, entry);
		if (statSync(p).isDirectory()) walk(p);
		else if (/\.(tsx|ts)$/.test(entry) && !/\.(test|spec|stories)\./.test(entry)) files.push(p);
	}
})(join(root, 'src'));

const violations = [];
for (const abs of files) {
	const rel = relative(root, abs);
	if (EXEMPT_TREES.some((t) => rel.startsWith(t)) || EXEMPT_FILES[rel]) continue;

	const src = stripComments(readFileSync(abs, 'utf8'));
	const found = [];
	for (const m of src.matchAll(CLASS_RE)) {
		const variants = m[1] || '';
		if (variants.split(':').includes('dark')) continue;
		found.push(m[0]);
	}
	if (found.length) violations.push({ file: rel, classes: [...new Set(found)] });
}

if (violations.length) {
	const total = violations.reduce((n, v) => n + v.classes.length, 0);
	console.error(`\n✗ ${total} raw palette class(es) in ${violations.length} file(s):\n`);
	for (const v of violations) console.error(`  ${v.file}\n      ${v.classes.join(', ')}`);
	console.error('\nUse a --fp-* token instead — see scripts/theme-tokens.mjs for the set.');
	console.error('If the colour genuinely must not change between themes (it sits on a surface that');
	console.error('never changes), add the file to EXEMPT_FILES here with the reason.\n');
	process.exit(1);
}

console.log(`✓ no raw palette classes — ${files.length} files scanned, ${Object.keys(EXEMPT_FILES).length} documented exemptions.`);
