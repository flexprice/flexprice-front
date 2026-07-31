import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import PosthogProvider from './core/services/posthog/PosthogProvider.tsx';
import VercelSpeedInsights from './core/services/vercel/vercel.tsx';
import { config, initTypography } from './config/config.ts';
import { initReo } from './core/services/reo/reo.ts';
import { registerWebMCPTools } from './agent/webmcp.ts';
import { initBranding } from './config/branding.ts';
import { initI18n } from './i18n/index.ts';
import { DirectionProvider } from '@radix-ui/react-direction';
import { useLocaleStore } from './store/useLocaleStore.ts';
import { initTheme } from './store/useThemeStore.ts';
import React from 'react';

// svix's browser bundle references the bare `process` identifier (not `typeof process`) inside
// getUserAgent(), which throws ReferenceError in any browser and breaks every webhook portal request
// before fetch() is even called. Polyfill just enough to satisfy that check.
if (typeof process === 'undefined') {
	(window as unknown as { process: { env: Record<string, string> } }).process = { env: {} };
}

registerWebMCPTools();

// Reads direction from Zustand store — subscribes so Radix primitives re-render on locale change
function DirectionWrapper({ children }: { children: React.ReactNode }) {
	const direction = useLocaleStore((s) => s.direction);
	return <DirectionProvider dir={direction}>{children}</DirectionProvider>;
}

(async () => {
	// First, and before any await: applies the persisted `.dark` class while the body is still
	// empty, so a dark-mode user never sees a flash of the light theme.
	initTheme();
	initBranding();
	initTypography();
	initReo();

	// Use persisted locale (from localStorage via Zustand) rather than the config default
	const { locale, direction } = useLocaleStore.getState();

	try {
		await initI18n(locale, direction);
	} catch (err) {
		console.error('[main] i18n initialization failed, rendering without translations:', err);
	}

	ReactDOM.createRoot(document.getElementById('root')!).render(
		<div>
			{config.app.isProd ? (
				<PosthogProvider>
					<DirectionWrapper>
						<App />
					</DirectionWrapper>
					<VercelSpeedInsights />
				</PosthogProvider>
			) : (
				<DirectionWrapper>
					<App />
				</DirectionWrapper>
			)}
		</div>,
	);
})();
