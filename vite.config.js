var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
// vite.config.ts
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import { visualizer } from 'rollup-plugin-visualizer';
import checker from 'vite-plugin-checker';
export default defineConfig(function (_a) {
    var mode = _a.mode;
    var env = loadEnv(mode, process.cwd(), '');
    var isProduction = mode === 'production';
    var meta = JSON.parse(fs.readFileSync('./public/meta.json', 'utf8'));
    return {
        plugins: __spreadArray([
            // React plugin with Fast-Refresh enabled (default)
            react({
                // Optimize Fast-Refresh boundaries
                // Exclude large files or files with side effects from Fast-Refresh
                exclude: /node_modules/,
            }),
            // TypeScript + ESLint checker (dev only, zero cost in production)
            checker({
                typescript: {
                    tsconfigPath: './tsconfig.json',
                    root: './',
                },
                eslint: {
                    lintCommand: 'eslint "./src/**/*.{ts,tsx}"',
                    // Only check on save in dev mode for better performance
                    dev: {
                        logLevel: ['error', 'warning'],
                    },
                },
                // Only run in development to avoid build slowdown
                enableBuild: false,
            })
        ], (isProduction ? [
            visualizer({
                filename: './dist/stats.html',
                open: false, // Don't auto-open in CI/CD
                gzipSize: true,
                brotliSize: true,
                template: 'treemap', // 'treemap' | 'sunburst' | 'network'
            }),
        ] : []), true),
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
            // Use terser for better minification control (console removal, etc.)
            minify: 'terser',
            terserOptions: {
                compress: {
                    drop_console: isProduction, // Remove console.log in production
                    drop_debugger: isProduction, // Remove debugger statements
                    pure_funcs: isProduction ? ['console.log', 'console.info', 'console.debug'] : [],
                },
            },
            assetsDir: 'assets',
            // Enable brotli compression analysis
            brotliSize: true,
            // Optimize chunk splitting for better caching
            rollupOptions: {
                output: {
                    chunkFileNames: 'assets/[name]-[hash].js',
                    entryFileNames: 'assets/[name]-[hash].js',
                    assetFileNames: 'assets/[name]-[hash].[ext]',
                    // Manual chunk splitting for vendor libraries
                    manualChunks: function (id) {
                        // Split large vendor libraries into separate chunks
                        if (id.includes('node_modules')) {
                            if (id.includes('@radix-ui')) {
                                return 'vendor-radix';
                            }
                            if (id.includes('@tanstack')) {
                                return 'vendor-tanstack';
                            }
                            if (id.includes('react') || id.includes('react-dom')) {
                                return 'vendor-react';
                            }
                            if (id.includes('recharts')) {
                                return 'vendor-charts';
                            }
                            // Other node_modules
                            return 'vendor';
                        }
                    },
                },
            },
            // Optimize build performance
            chunkSizeWarningLimit: 1000, // Warn if chunk exceeds 1MB
        },
        // Optimize dependency pre-bundling for faster dev startup
        optimizeDeps: {
            include: [
                'react',
                'react-dom',
                'react-router',
                '@tanstack/react-query',
                'axios',
            ],
            // Exclude large dependencies that don't need pre-bundling
            exclude: ['@tanstack/react-query-devtools'],
        },
    };
});
