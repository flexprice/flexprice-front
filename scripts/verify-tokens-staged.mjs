#!/usr/bin/env node
/**
 * Guards against committing half the token layer.
 *
 * `generate-theme-tokens.mjs` writes two files: the CSS variables in src/index.css and the matching
 * colour keys in tailwind.config.js. A token needs BOTH — the variable alone produces a class that
 * Tailwind never emits, so the element renders unstyled in light and dark alike.
 *
 * That is exactly what happened in Step 13: a commit staged `src/` but not `tailwind.config.js`,
 * shipping five tokens whose classes resolved to nothing. verify-theme-tokens.mjs did not catch it
 * because it reads the working tree, where both files were correct — only the *commit* was partial.
 *
 * This compares the two files as they will exist in the commit (staged content, falling back to
 * HEAD for unstaged files) and fails if their token sets disagree.
 */
import { execSync } from 'node:child_process';

const sh = (cmd) => {
	try {
		return execSync(cmd, { stdio: ['pipe', 'pipe', 'ignore'], maxBuffer: 1 << 28 }).toString();
	} catch {
		return '';
	}
};

/** Content a path will have in the commit: staged version if staged, else HEAD, else working tree. */
function committedContent(path) {
	const staged = sh(`git show :${path}`);
	if (staged) return staged;
	const head = sh(`git show HEAD:${path}`);
	if (head) return head;
	return sh(`cat ${path}`);
}

/** Both files document the token contract in comments that name placeholder vars like `--fp-x`. */
const stripComments = (src) => src.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:])\/\/[^\n]*/g, '$1 ');

const css = stripComments(committedContent('src/index.css'));
const tw = stripComments(committedContent('tailwind.config.js'));

const cssTokens = new Set([...css.matchAll(/--fp-([a-z0-9-]+)\s*:/g)].map((m) => m[1]));
const twTokens = new Set([...tw.matchAll(/var\(--fp-([a-z0-9-]+)\)/g)].map((m) => m[1]));

const missingInTailwind = [...cssTokens].filter((t) => !twTokens.has(t));
const missingInCss = [...twTokens].filter((t) => !cssTokens.has(t));

if (missingInTailwind.length || missingInCss.length) {
	console.error('\n✗ token layer would be committed in an inconsistent state:\n');
	for (const t of missingInTailwind) {
		console.error(`  --fp-${t}: declared in src/index.css but no colour key in tailwind.config.js`);
		console.error('      → the utility class is never emitted; the element renders unstyled');
	}
	for (const t of missingInCss) {
		console.error(`  --fp-${t}: referenced by tailwind.config.js but not declared in src/index.css`);
		console.error('      → the class resolves to an undefined variable');
	}
	console.error('\nStage both generated files together:');
	console.error('  git add src/index.css tailwind.config.js\n');
	process.exit(1);
}

console.log(`✓ token layer consistent — ${cssTokens.size} tokens present in both src/index.css and tailwind.config.js.`);
