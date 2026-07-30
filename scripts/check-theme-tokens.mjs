#!/usr/bin/env node
/**
 * CI guard: fail if hardcoded light-theme Tailwind classes are reintroduced.
 * Run: node scripts/check-theme-tokens.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(__dirname, '..', 'src');

const FORBIDDEN = [
	/\bbg-white\b/,
	/\btext-gray-\d+/,
	/\bborder-gray-\d+/,
	/\bbg-\[#092E44\]/i,
];

// EmptyPage.tsx is intentionally kept at main's exact light-theme markup for now;
// it will be re-tokenized for dark mode in a later iteration.
const ALLOWLIST = new Set(['index.css', 'EmptyPage.tsx']);

function walk(dir, files = []) {
	for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
		const full = path.join(dir, entry.name);
		if (entry.isDirectory()) {
			if (entry.name === 'node_modules') continue;
			walk(full, files);
		} else if (/\.(tsx?|css)$/.test(entry.name)) {
			files.push(full);
		}
	}
	return files;
}

const violations = [];

for (const file of walk(SRC)) {
	if (ALLOWLIST.has(path.basename(file))) continue;
	const content = fs.readFileSync(file, 'utf8');
	const lines = content.split('\n');
	lines.forEach((line, i) => {
		for (const pattern of FORBIDDEN) {
			if (pattern.test(line)) {
				violations.push(`${path.relative(path.join(__dirname, '..'), file)}:${i + 1}: ${line.trim()}`);
			}
		}
	});
}

if (violations.length) {
	console.error('Theme token violations found:\n');
	violations.forEach((v) => console.error(v));
	process.exit(1);
}

console.log('Theme token check passed.');
