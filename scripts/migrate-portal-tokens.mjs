#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORTAL_DIRS = [
	path.join(__dirname, '..', 'src', 'components', 'customer-portal'),
	path.join(__dirname, '..', 'src', 'pages', 'customer-portal'),
];

const REPLACEMENTS = [
	[/var\(--portal-surface,\s*white\)/g, 'var(--portal-surface)'],
	[/var\(--portal-surface,\s*#f9fafb\)/g, 'var(--portal-surface)'],
	[/var\(--portal-border,\s*#E9E9E9\)/g, 'var(--portal-border)'],
	[/var\(--portal-border,\s*#e5e7eb\)/g, 'var(--portal-border)'],
	[/var\(--portal-border,\s*#E5E7EB\)/g, 'var(--portal-border)'],
	[/var\(--portal-text-primary,\s*#09090b\)/g, 'var(--portal-text-primary)'],
	[/var\(--portal-text-primary,\s*#374151\)/g, 'var(--portal-text-primary)'],
	[/var\(--portal-text-primary,\s*#111827\)/g, 'var(--portal-text-primary)'],
	[/var\(--portal-text-primary,\s*#2563eb\)/g, 'var(--portal-text-primary)'],
	[/var\(--portal-text-secondary,\s*#71717a\)/g, 'var(--portal-text-secondary)'],
	[/var\(--portal-text-secondary,\s*#6b7280\)/g, 'var(--portal-text-secondary)'],
	[/var\(--portal-text-secondary,\s*#9ca3af\)/g, 'var(--portal-text-secondary)'],
	[/var\(--portal-text-secondary,\s*#a1a1aa\)/g, 'var(--portal-text-secondary)'],
	[/var\(--portal-primary,\s*#eff6ff\)/g, 'var(--portal-primary)'],
	[/var\(--portal-primary,\s*#6167d9\)/g, 'var(--portal-primary)'],
	[/backgroundColor:\s*'white'/g, "backgroundColor: 'var(--portal-surface)'"],
	[/border:\s*'1px solid #E9E9E9'/g, "border: '1px solid var(--portal-border)'"],
	[/#E9E9E9/g, 'var(--portal-border)'],
	[/hasTheme \? 'var\(--portal-border\)' : 'var\(--portal-border\)'/g, "'var(--portal-border)'"],
];

function walk(dir, files = []) {
	if (!fs.existsSync(dir)) return files;
	for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
		const full = path.join(dir, entry.name);
		if (entry.isDirectory()) walk(full, files);
		else if (/\.tsx?$/.test(entry.name)) files.push(full);
	}
	return files;
}

let changed = 0;
for (const dir of PORTAL_DIRS) {
	for (const file of walk(dir)) {
		let content = fs.readFileSync(file, 'utf8');
		const original = content;
		for (const [pattern, replacement] of REPLACEMENTS) {
			content = content.replace(pattern, replacement);
		}
		if (content !== original) {
			fs.writeFileSync(file, content);
			changed++;
			console.log(path.relative(path.join(__dirname, '..'), file));
		}
	}
}
console.log(`Portal migration: ${changed} files updated`);
