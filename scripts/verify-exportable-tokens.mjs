#!/usr/bin/env node
/**
 * Guards the exportable widget package against shipping undefined CSS variables.
 *
 * `@flexprice/flexprice-ui` bundles PricingCard plus shared ui/atoms, and its Tailwind config
 * spreads the app's — so tokenizing those components emits `rgb(var(--fp-…))` into the shipped
 * stylesheet. But the package ships its OWN stylesheet, scoped under `.flexprice-ui`, which is a
 * separate file from src/index.css. If the tokens are not mirrored there, every one of those
 * declarations is invalid in a consumer's page and the widget renders unstyled.
 *
 * That is exactly what happened: 22 distinct `--fp-*` variables were referenced and none defined.
 * Nothing in the app build catches it, because the app has its own copy of the tokens.
 *
 * Checks that every `--fp-*` the exportable stylesheet could need is actually declared in it.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const stripComments = (s) => s.replace(/\/\*[\s\S]*?\*\//g, ' ');

const app = stripComments(readFileSync(join(root, 'src/index.css'), 'utf8'));
// Keep the raw text: the region markers are themselves CSS comments, so stripping first
// would delete the very delimiters we search for.
const libRaw = readFileSync(join(root, 'src/exportable/styles.css'), 'utf8');

const declared = (src) => new Set([...src.matchAll(/--fp-([a-z0-9-]+)\s*:/g)].map((m) => m[1]));
const appTokens = declared(app);

/**
 * Check each scope separately. Checking the file as a whole is not enough: a token declared only in
 * `.flexprice-ui.dark` still satisfies a whole-file name check while being undefined in light mode.
 */
const region = (src, name) => {
	const begin = src.indexOf(`fp-tokens:begin ${name}`);
	const end = src.indexOf(`fp-tokens:end ${name}`);
	return begin === -1 || end === -1 ? '' : src.slice(begin, end);
};
const libLight = declared(region(libRaw, 'lib-light'));
const libDark = declared(region(libRaw, 'lib-dark'));
const libTokens = new Set([...libLight, ...libDark]);

const missingLight = [...appTokens].filter((t) => !libLight.has(t));
const missingDark = [...appTokens].filter((t) => !libDark.has(t));
const missing = [...new Set([...missingLight, ...missingDark])];

// If the package has been built, verify the emitted CSS directly — the strongest check available.
let built = null;
try {
	const css = readFileSync(join(root, 'packages/flexprice-ui/dist/style.css'), 'utf8');
	const referenced = new Set([...css.matchAll(/var\(--fp-([a-z0-9-]+)\)/g)].map((m) => m[1]));
	const definedInBuild = new Set([...css.matchAll(/--fp-([a-z0-9-]+)\s*:/g)].map((m) => m[1]));
	built = { referenced: referenced.size, undefinedInBuild: [...referenced].filter((t) => !definedInBuild.has(t)) };
} catch {
	/* not built — the source check above still applies */
}

const problems = [];
if (missingLight.length) problems.push(`${missingLight.length} token(s) missing from the .flexprice-ui (light) scope`);
if (missingDark.length) problems.push(`${missingDark.length} token(s) missing from the .flexprice-ui.dark scope`);
if (built?.undefinedInBuild.length) problems.push(`${built.undefinedInBuild.length} token(s) referenced by the built widget CSS but never defined in it`);

if (problems.length) {
	console.error('\n✗ exportable widget would ship undefined CSS variables:\n');
	for (const p of problems) console.error(`  • ${p}`);
	if (missing.length) console.error(`\n  missing from the lib stylesheet: ${missing.slice(0, 12).join(', ')}${missing.length > 12 ? ' …' : ''}`);
	if (built?.undefinedInBuild.length) console.error(`  undefined in the build:          ${built.undefinedInBuild.slice(0, 12).join(', ')}`);
	console.error('\nRegenerate so all three files stay in step:');
	console.error('  node scripts/generate-theme-tokens.mjs\n');
	process.exit(1);
}

console.log(`✓ exportable widget tokens complete — ${appTokens.size} app tokens present in BOTH the light and dark scopes (${libTokens.size} names).`);
if (built) console.log(`  built stylesheet references ${built.referenced} tokens, all defined.`);
