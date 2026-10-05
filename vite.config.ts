import path from 'path';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import { defineConfig } from 'vite';
import { brandPack, resolveBrandDir } from './scripts/vite-brand.mjs';

const meta = JSON.parse(fs.readFileSync('./public/meta.json', 'utf8'));

export default defineConfig({
	plugins: [brandPack(), react()],
	define: {
		__APP_VERSION__: JSON.stringify(meta.versionId),
	},
	resolve: {
		alias: {
			// Before '@': the active brand pack (see scripts/vite-brand.mjs).
			'@brand': resolveBrandDir(),
			'@': path.resolve(__dirname, './src'),
		},
	},
	server: {
		cors: {
			origin: 'http://localhost:3000',
			methods: ['GET', 'POST'],
		},
		host: 'localhost',
	},
});
