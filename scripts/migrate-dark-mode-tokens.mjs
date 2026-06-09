#!/usr/bin/env node
/**
 * Bulk-migrate hardcoded light-theme Tailwind classes to semantic tokens.
 * Run from repo root: node scripts/migrate-dark-mode-tokens.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(__dirname, '..', 'src');

const SKIP_FILES = new Set(['index.css']);

/** Order matters — compound patterns first */
const REPLACEMENTS = [
	// Compound dark: pairs → single token
	[/bg-white dark:bg-gray-950/g, 'bg-card'],
	[/bg-white dark:bg-gray-900/g, 'bg-card'],
	[/bg-white dark:bg-background/g, 'bg-card'],
	[/bg-gray-100 dark:bg-gray-950/g, 'bg-muted'],
	[/bg-gray-100 dark:bg-gray-900/g, 'bg-muted'],
	[/bg-gray-50 dark:bg-gray-900/g, 'bg-muted'],
	[/border-gray-200 dark:border-gray-800/g, 'border-border'],
	[/border-gray-300 dark:border-gray-800/g, 'border-border'],
	[/border-gray-200 dark:border-gray-700/g, 'border-border'],
	[/text-gray-900 dark:text-gray-100/g, 'text-foreground'],
	[/text-gray-800 dark:text-gray-200/g, 'text-foreground'],
	[/hover:bg-gray-50 dark:hover:bg-gray-800/g, 'hover:bg-accent'],
	[/hover:bg-gray-100 dark:hover:bg-gray-800/g, 'hover:bg-accent'],

	// Brand hex
	[/bg-\[#092E44\]/g, 'bg-brand'],
	[/border-\[#092E44\]/g, 'border-brand'],
	[/text-\[#092E44\]/g, 'text-brand'],

	// Common hex surfaces → tokens
	[/bg-\[#fafafa\]/gi, 'bg-muted'],
	[/bg-\[#FAFAFA\]/g, 'bg-muted'],
	[/bg-\[#f9f9f9\]/gi, 'bg-muted'],
	[/border-\[#E9E9E9\]/g, 'border-border'],
	[/border-\[#E2E8F0\]/g, 'border-border'],
	[/text-\[#020617\]/g, 'text-foreground'],
	[/text-\[#3F3F46\]/g, 'text-foreground'],
	[/text-\[#52525B\]/g, 'text-muted-foreground'],
	[/text-\[#64748B\]/g, 'text-muted-foreground'],
	[/text-\[#71717A\]/g, 'text-muted-foreground'],
	[/text-\[#18181B\]/g, 'text-foreground'],
	[/text-\[#09090B\]/g, 'text-foreground'],

	// Backgrounds
	[/\bbg-white\b/g, 'bg-card'],
	[/\bbg-gray-50\b/g, 'bg-muted'],
	[/\bbg-gray-100\b/g, 'bg-muted'],
	[/\bbg-zinc-50\b/g, 'bg-muted'],
	[/\bbg-zinc-100\b/g, 'bg-muted'],
	[/\bbg-slate-50\b/g, 'bg-muted'],
	[/\bbg-slate-100\b/g, 'bg-muted'],

	// Text
	[/\btext-black\b/g, 'text-foreground'],
	[/\btext-gray-900\b/g, 'text-foreground'],
	[/\btext-zinc-900\b/g, 'text-foreground'],
	[/\btext-zinc-950\b/g, 'text-foreground'],
	[/\btext-slate-900\b/g, 'text-foreground'],
	[/\btext-gray-800\b/g, 'text-foreground'],
	[/\btext-zinc-800\b/g, 'text-foreground'],
	[/\btext-slate-800\b/g, 'text-foreground'],
	[/\btext-gray-700\b/g, 'text-foreground'],
	[/\btext-zinc-700\b/g, 'text-foreground'],
	[/\btext-slate-700\b/g, 'text-foreground'],
	[/\btext-gray-600\b/g, 'text-muted-foreground'],
	[/\btext-zinc-600\b/g, 'text-muted-foreground'],
	[/\btext-slate-600\b/g, 'text-muted-foreground'],
	[/\btext-gray-500\b/g, 'text-muted-foreground'],
	[/\btext-zinc-500\b/g, 'text-muted-foreground'],
	[/\btext-slate-500\b/g, 'text-muted-foreground'],
	[/\btext-gray-400\b/g, 'text-muted-foreground'],
	[/\btext-zinc-400\b/g, 'text-muted-foreground'],
	[/\btext-slate-400\b/g, 'text-muted-foreground'],
	[/\btext-gray-300\b/g, 'text-muted-foreground/70'],

	// Borders
	[/\bborder-gray-100\b/g, 'border-border'],
	[/\bborder-gray-200\b/g, 'border-border'],
	[/\bborder-gray-300\b/g, 'border-border'],
	[/\bborder-gray-400\b/g, 'border-border'],
	[/\bborder-zinc-100\b/g, 'border-border'],
	[/\bborder-zinc-200\b/g, 'border-border'],
	[/\bborder-zinc-300\b/g, 'border-border'],
	[/\bborder-slate-100\b/g, 'border-border'],
	[/\bborder-slate-200\b/g, 'border-border'],
	[/\bborder-slate-300\b/g, 'border-border'],
	[/\bborder-black\b/g, 'border-border'],
	[/\bdivide-gray-100\b/g, 'divide-border'],
	[/\bdivide-gray-200\b/g, 'divide-border'],

	// Hover states
	[/\bhover:bg-gray-50\b/g, 'hover:bg-accent'],
	[/\bhover:bg-gray-100\b/g, 'hover:bg-accent'],
	[/\bhover:text-gray-800\b/g, 'hover:text-foreground'],
	[/\bhover:text-gray-900\b/g, 'hover:text-foreground'],
	[/\bhover:border-gray-200\b/g, 'hover:border-border'],
	[/\bhover:border-gray-300\b/g, 'hover:border-border'],

	// Remaining dark: variants that are now redundant (simple cases)
	[/ dark:bg-gray-950/g, ''],
	[/ dark:bg-gray-900/g, ''],
	[/ dark:bg-gray-800/g, ''],
	[/ dark:border-gray-800/g, ''],
	[/ dark:border-gray-700/g, ''],
	[/ dark:text-gray-100/g, ''],
	[/ dark:text-gray-200/g, ''],
	[/ dark:text-gray-300/g, ''],
	[/ dark:text-gray-400/g, ''],

	// Remaining hex patterns
	[/bg-\[#F4F4F5\]/gi, 'bg-muted'],
	[/bg-\[#f4f4f4\]/gi, 'bg-muted'],
	[/bg-\[#f5f5f5\]/gi, 'bg-muted'],
	[/bg-\[#fbfbfb\]/gi, 'bg-card'],
	[/bg-\[#F9FAFB\]/g, 'bg-muted'],
	[/bg-\[#F1F5F9\]/g, 'bg-muted'],
	[/bg-\[#EDEDED\]/g, 'bg-accent'],
	[/bg-\[#E4E4E7\]/g, 'bg-border'],
	[/hover:bg-\[#F4F4F5\]/g, 'hover:bg-accent'],
	[/hover:bg-\[#E4E4E7\]/g, 'hover:bg-accent'],
	[/active:bg-\[#F4F4F5\]/g, 'active:bg-accent'],
	[/data-\[active=true\]:bg-\[#EDEDED\]/g, 'data-[active=true]:bg-accent'],
	[/!bg-\[#fbfbfb\]/g, '!bg-card'],
	[/!border-\[#CFCFCF\]/g, '!border-border'],
	[/border-\[#EBEBEB\]/g, 'border-border'],
	[/border-gray-900/g, 'border-foreground'],
	[/text-\[#2A9D90\]/g, 'text-success'],
	[/text-\[#f5c50b\]/g, 'text-warning'],
	[/text-\[#DC2626\]/g, 'text-destructive'],
	[/text-\[#16A34A\]/g, 'text-success'],
	[/text-\[#4B5563\]/g, 'text-muted-foreground'],
	[/text-\[#111827\]/g, 'text-foreground'],
	[/text-\[#333333\]/g, 'text-foreground'],
	[/text-\[#999999\]/g, 'text-muted-foreground'],
	[/text-\[#5e5e5e\]/g, 'text-muted-foreground'],
	[/bg-\[#00000005\]/g, 'bg-muted'],
	[/bg-\[#FEF08A\]/g, 'bg-warning-muted'],
	[/text-\[#D97706\]/g, 'text-warning-muted-foreground'],
	[/text-\[#c58e20\]/g, 'text-warning-muted-foreground'],
	[/text-\[#ffbf76\]/g, 'text-warning-muted-foreground'],
	[/border-\[#E4E4E7\]/g, 'border-border'],
	[/border-\[#E5E7EB\]/g, 'border-border'],
	[/border-\[#BABABA\]/g, 'border-border'],
	[/border-\[#0F172A\]/g, 'border-foreground'],
	[/border-t-\[#092E44\]/g, 'border-t-brand'],
	[/bg-\[#FEE2E2\]\/30/g, 'bg-destructive/10'],
	[/bg-\[#dde1eb\]/g, 'bg-muted'],
	[/text-\[#0E5AC9\]/g, 'text-info'],
	[/border-\[#BFD0F5\]/g, 'border-info-muted'],
	[/text-\[#1F5ADA\]/g, 'text-info'],
	[/border-\[#333333\]/g, 'border-foreground'],
];

function walk(dir, files = []) {
	for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
		const full = path.join(dir, entry.name);
		if (entry.isDirectory()) {
			if (entry.name === 'node_modules' || entry.name === 'tests') continue;
			walk(full, files);
		} else if (/\.(tsx?|css)$/.test(entry.name)) {
			files.push(full);
		}
	}
	return files;
}

let changedFiles = 0;
let totalReplacements = 0;

for (const file of walk(SRC)) {
	const rel = path.relative(SRC, file);
	if (SKIP_FILES.has(path.basename(file))) continue;
	if (rel.includes('migrate-dark-mode')) continue;

	let content = fs.readFileSync(file, 'utf8');
	const original = content;
	let fileChanges = 0;

	for (const [pattern, replacement] of REPLACEMENTS) {
		const matches = content.match(pattern);
		if (matches) {
			fileChanges += matches.length;
			content = content.replace(pattern, replacement);
		}
	}

	if (content !== original) {
		fs.writeFileSync(file, content);
		changedFiles++;
		totalReplacements += fileChanges;
		console.log(`${rel}: ${fileChanges} replacements`);
	}
}

console.log(`\nDone: ${changedFiles} files, ~${totalReplacements} replacements`);
