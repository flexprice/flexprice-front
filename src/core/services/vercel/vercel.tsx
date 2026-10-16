import { SpeedInsights } from '@vercel/speed-insights/react';

const VercelSpeedInsights = () => {
	// Without a dsn, SpeedInsights loads its script from the relative path
	// /_vercel/speed-insights/script.js, which only resolves on Vercel's own edge network. On any
	// other host (self-hosted, non-Vercel cloud deploys) that path falls through to the SPA's
	// catch-all route and returns index.html instead of JS, which throws an uncaught
	// "SyntaxError: Unexpected token '<'" trying to parse it as a script.
	if (!__IS_VERCEL__) return null;
	return <SpeedInsights />;
};

export default VercelSpeedInsights;
