import { NODE_ENV, NodeEnv } from '@/types';
import { createClient } from '@supabase/supabase-js';

const isSelfHosted = NODE_ENV === NodeEnv.SELF_HOSTED;
// Create a mock client for self-hosted mode
const createMockClient = () => {
	return {
		auth: {
			signIn: async () => ({ user: null, error: null }),
			signInWithPassword: async () => ({ data: { user: null, session: null }, error: null }),
			signInWithOAuth: async () => ({ data: { provider: null, url: null }, error: null }),
			signUp: async () => ({ data: { user: null, session: null }, error: null }),
			signOut: async () => ({ error: null }),
			onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => undefined } }, error: null }),
			getSession: async () => ({ data: null, error: null }),
			getUser: async () => ({ data: { user: null }, error: null }),
			resetPasswordForEmail: async () => ({ data: null, error: null }),
			updateUser: async () => ({ data: { user: null }, error: null }),
		},
		from: () => ({
			select: async () => [],
			insert: async () => ({ data: null, error: null }),
			update: async () => ({ data: null, error: null }),
			delete: async () => ({ data: null, error: null }),
		}),
	};
};

const supabaseUrl = isSelfHosted ? '' : import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = isSelfHosted ? '' : import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const hasSupabaseCredentials = Boolean(supabaseUrl && supabaseKey);
const canUseMockSupabase = isSelfHosted || import.meta.env.MODE === 'test' || Boolean(import.meta.env.STORYBOOK);

const supabase = !hasSupabaseCredentials && canUseMockSupabase ? (createMockClient() as any) : createClient(supabaseUrl, supabaseKey);

export default supabase;
