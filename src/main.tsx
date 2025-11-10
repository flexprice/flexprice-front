import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import PosthogProvider from './core/services/posthog/PosthogProvider.tsx';
import SentryProvider from './core/services/sentry/SentryProvider.tsx';
import VercelSpeedInsights from './core/services/vercel/vercel.tsx';
import { NODE_ENV, NodeEnv } from './types/index.ts';

const isProd = NODE_ENV === NodeEnv.PROD;

ReactDOM.createRoot(document.getElementById('root')!).render(
	<div>
		{isProd ? (
			<SentryProvider>
				<PosthogProvider>
					<App />
					<VercelSpeedInsights />
				</PosthogProvider>
			</SentryProvider>
		) : (
			<App />
		)}
	</div>,
);
