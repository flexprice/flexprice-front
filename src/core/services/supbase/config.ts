import { config, APP_ENV } from '@/config/config';
import { createClient } from '@supabase/supabase-js';

const isSelfHosted = config.app.env === APP_ENV.SelfHosted;

/**
 * Stands in for the real Supabase client when auth isn't configured for local development
 * (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY unset). Every method mirrors the real SDK's
 * response *shape* (e.g. `{ data: { session: null } }`, not `{ data: null }`) so callers that
 * destructure nested fields (AuthService.getAcessToken's `data.session?.access_token`, etc.)
 * don't crash — they just see "nobody's signed in" instead.
 */
const createMockClient = () => {
	const notConfiguredError = { message: 'Authentication is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.' };
	return {
		auth: {
			signIn: async () => ({ data: { user: null, session: null }, error: notConfiguredError }),
			signInWithPassword: async () => ({ data: { user: null, session: null }, error: notConfiguredError }),
			signOut: async () => ({ error: null }),
			onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } }, error: null }),
			getSession: async () => ({ data: { session: null }, error: null }),
			getUser: async () => ({ data: { user: null }, error: null }),
		},
		from: () => ({
			select: async () => [],
			insert: async () => ({ data: null, error: null }),
			update: async () => ({ data: null, error: null }),
			delete: async () => ({ data: null, error: null }),
		}),
	};
};

const supabase =
	isSelfHosted || !config.auth.url || !config.auth.anonKey
		? (createMockClient() as any)
		: createClient(config.auth.url, config.auth.anonKey);

export default supabase;
