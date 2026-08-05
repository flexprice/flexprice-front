import { config, usesBackendAuth } from '@/config/config';
import { createClient } from '@supabase/supabase-js';

const isBackendAuth = usesBackendAuth(config.app.env, config.auth.provider);

const createMockClient = () => {
	return {
		auth: {
			signIn: async () => ({ user: null, error: null }),
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
	isBackendAuth || !config.auth.url || !config.auth.anonKey
		? (createMockClient() as any)
		: createClient(config.auth.url, config.auth.anonKey);

export default supabase;
