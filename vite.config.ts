// vite.config.ts
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';

export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, process.cwd(), '');
	const isProduction = mode === 'production';
	const meta = JSON.parse(fs.readFileSync('./public/meta.json', 'utf8'));

	return {
		plugins: [
			// React plugin with Fast-Refresh enabled (default)
			react({
				// Optimize Fast-Refresh boundaries
				// Exclude large files or files with side effects from Fast-Refresh
				exclude: /node_modules/,
			}),
		],
		define: {
			__APP_VERSION__: JSON.stringify(meta.versionId),
			__APP_ENV__: JSON.stringify(mode),
		},
		resolve: {
			alias: { '@': path.resolve(__dirname, './src') },
		},
		server: {
			cors: mode === 'development' && {
				origin: 'http://localhost:3000',
				methods: ['GET', 'POST'],
			},
			host: 'localhost',
			// Optimize HMR for better Fast-Refresh performance
			hmr: {
				overlay: true, // Show errors in browser overlay
			},
		},
		build: {
			sourcemap: env.GENERATE_SOURCEMAP === 'true',
			manifest: true,
			outDir: 'dist',
			assetsDir: 'assets',
			minify: 'terser',
			terserOptions: {
				compress: {
					drop_console: isProduction,
					drop_debugger: isProduction,
				},
			},
		},
		// Optimize dependency pre-bundling for faster dev startup
		optimizeDeps: {
			include: ['react', 'react-dom', 'react-router', '@tanstack/react-query', 'axios'],
			// Exclude large dependencies that don't need pre-bundling
			exclude: ['@tanstack/react-query-devtools'],
		},
	};
});
