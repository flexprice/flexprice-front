import path from 'path';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import { defineConfig } from 'vite';

const meta = JSON.parse(fs.readFileSync('./public/meta.json', 'utf8'));

export default defineConfig({
	plugins: [react()],
	define: {
		__APP_VERSION__: JSON.stringify(meta.versionId),
		// Vercel auto-injects VERCEL=1 into every build it runs, regardless of project/environment -
		// no manual env config needed. Used to gate @vercel/speed-insights: it defaults to loading
		// its script from the relative path /_vercel/speed-insights/script.js, which only exists on
		// Vercel's own edge network. On any other host that path falls through to the SPA's catch-all
		// route and returns index.html instead of JS, which the browser then fails to parse as a
		// script with an uncaught "SyntaxError: Unexpected token '<'".
		__IS_VERCEL__: JSON.stringify(!!process.env.VERCEL),
	},
	resolve: {
		alias: {
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
