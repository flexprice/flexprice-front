#!/usr/bin/env node
/**
 * Regenerates the `--fp-*` token blocks in src/index.css and tailwind.config.js from the table in
 * scripts/theme-tokens.mjs.
 *
 * The migration adds tokens step by step, so this has to be re-runnable. It rewrites only the
 * regions between the `fp-tokens:begin` / `fp-tokens:end` markers and leaves everything else —
 * including every pre-existing `:root` value — untouched.
 *
 * Run: node scripts/generate-theme-tokens.mjs && npx prettier --write src/index.css tailwind.config.js src/exportable/styles.css
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import palette from 'tailwindcss/colors.js';
import { TOKEN_GROUPS, hexToChannels, resolveLight } from './theme-tokens.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

/** Replace the text between `<marker>:begin[ name]` and `<marker>:end[ name]`, keeping the markers. */
function replaceRegion(source, name, body, file) {
	const begin = new RegExp(`([ \\t]*/\\* fp-tokens:begin${name ? ` ${name}` : ''}[^\\n]*\\*/\\n)`);
	const end = new RegExp(`([ \\t]*/\\* fp-tokens:end${name ? ` ${name}` : ''} \\*/)`);
	const bm = begin.exec(source);
	const em = end.exec(source);
	if (!bm || !em) throw new Error(`fp-tokens markers${name ? ` (${name})` : ''} not found in ${file}`);
	const start = bm.index + bm[0].length;
	if (em.index < start) throw new Error(`fp-tokens markers out of order in ${file}`);
	return source.slice(0, start) + body + source.slice(em.index);
}

const cssHeader = (variant) =>
	variant === 'light'
		? `\t\t/* ------------------------------------------------------------------
\t\t * Dark-theme token layer (--fp-*). ADDITIVE ONLY.
\t\t *
\t\t * Every light value below is byte-identical to the Tailwind palette color it replaces,
\t\t * so migrating a component from e.g. \`text-gray-500\` to \`text-content-muted\` cannot
\t\t * change light mode. Enforced by scripts/verify-theme-tokens.mjs.
\t\t *
\t\t * Channels are space-separated RGB, consumed as \`rgb(var(--fp-x) / <alpha-value>)\` so
\t\t * Tailwind opacity modifiers (\`/50\`) keep working. Do not convert these to hex or HSL.
\t\t *
\t\t * Source of truth: scripts/theme-tokens.mjs. Regenerate with
\t\t * \`node scripts/generate-theme-tokens.mjs\`.
\t\t * ------------------------------------------------------------------ */\n`
		: `\t\t/* ------------------------------------------------------------------
\t\t * Dark-theme token layer — Linear "Midnight" values.
\t\t * Source of truth: scripts/theme-tokens.mjs.
\t\t * ------------------------------------------------------------------ */\n`;

let light = cssHeader('light');
let dark = cssHeader('dark');
// The exportable widget ships its own stylesheet with tokens scoped under `.flexprice-ui`, so it
// needs the same `--fp-*` values. Without them its utilities reference undefined variables and the
// widget renders unstyled in a consumer's page.
let libLight = '';
let libDark = '';
let tw = `\t\t\t\t/* ------------------------------------------------------------------
\t\t\t\t * Dark-theme token layer. Light values are byte-identical to the Tailwind
\t\t\t\t * palette colors they replace — see scripts/theme-tokens.mjs and the guard
\t\t\t\t * at scripts/verify-theme-tokens.mjs.
\t\t\t\t * ------------------------------------------------------------------ */\n`;

for (const { group, tokens } of TOKEN_GROUPS) {
	light += `\n\t\t/* ${group} */\n`;
	dark += `\n\t\t/* ${group} */\n`;
	tw += `\n\t\t\t\t/* ${group} */\n`;
	for (const { name, light: l, dark: d, note } of tokens) {
		const hex = resolveLight(l, palette);
		light += `\t\t--fp-${name}: ${hexToChannels(hex)}; /* ${hex}${note ? ` — ${note}` : ''} */\n`;
		dark += `\t\t--fp-${name}: ${hexToChannels(d)}; /* ${d} */\n`;
		// Quote every key so the emitted config is stable regardless of hyphens; Prettier
		// strips the quotes where they are unnecessary.
		tw += `\t\t\t\t'${name}': 'rgb(var(--fp-${name}) / <alpha-value>)',\n`;
		libLight += `\t--fp-${name}: ${hexToChannels(hex)};\n`;
		libDark += `\t--fp-${name}: ${hexToChannels(d)};\n`;
	}
}

const cssPath = join(root, 'src/index.css');
let css = readFileSync(cssPath, 'utf8');
css = replaceRegion(css, 'light', light, 'src/index.css');
css = replaceRegion(css, 'dark', dark, 'src/index.css');
writeFileSync(cssPath, css);

const libPath = join(root, 'src/exportable/styles.css');
let libSrc = readFileSync(libPath, 'utf8');
libSrc = replaceRegion(libSrc, 'lib-light', libLight, 'src/exportable/styles.css');
libSrc = replaceRegion(libSrc, 'lib-dark', libDark, 'src/exportable/styles.css');
writeFileSync(libPath, libSrc);

const twPath = join(root, 'tailwind.config.js');
let twSrc = readFileSync(twPath, 'utf8');
twSrc = replaceRegion(twSrc, '', tw, 'tailwind.config.js');
writeFileSync(twPath, twSrc);

const count = TOKEN_GROUPS.reduce((n, g) => n + g.tokens.length, 0);
console.log(`✓ regenerated ${count} tokens into src/index.css, tailwind.config.js and src/exportable/styles.css`);
console.log('  next: npx prettier --write src/index.css tailwind.config.js src/exportable/styles.css');
