import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import PosthogProvider from './core/services/posthog/PosthogProvider.tsx';
import SentryProvider from './core/services/sentry/SentryProvider.tsx';
import VercelSpeedInsights from './core/services/vercel/vercel.tsx';
import { config } from './config/config.ts';
import { registerWebMCPTools } from './agent/webmcp.ts';
import { BrandProvider } from './context/BrandContext.tsx';
import { initI18n } from './i18n/index.ts';

registerWebMCPTools();

(async () => {
	await initI18n(config.i18n.locale, config.i18n.direction);

	ReactDOM.createRoot(document.getElementById('root')!).render(
		<BrandProvider>
			<div>
				{config.app.isProd ? (
					<SentryProvider>
						<PosthogProvider>
							<App />
							<VercelSpeedInsights />
						</PosthogProvider>
					</SentryProvider>
				) : (
					<App />
				)}
			</div>
		</BrandProvider>,
	);
})();
