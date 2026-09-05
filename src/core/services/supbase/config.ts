import { config, APP_ENV } from '@/config/config';
import { createClient } from '@supabase/supabase-js';

const isSelfHosted = config.app.env === APP_ENV.SelfHosted;

const createMockClient = () => {
	return {
		auth: {
			// Matches supabase-js's real signInWithPassword shape ({ data, error }) so
			// LoginForm's destructuring works instead of throwing "not a function" when
			// this client is used (self-hosted, or Supabase env vars simply unset).
			signInWithPassword: async () => ({
				data: { user: null, session: null },
				error: new Error('Authentication is not configured for this deployment.'),
			}),
			signOut: async () => ({ error: null }),
			onAuthStateChange: () => ({ data: null, error: null }),
			getSession: async () => ({ data: null, error: null }),
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
