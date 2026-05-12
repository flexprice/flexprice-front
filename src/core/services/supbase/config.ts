import { NODE_ENV, NodeEnv } from '@/types';
import { createClient } from '@supabase/supabase-js';

const isSelfHosted = NODE_ENV === NodeEnv.SELF_HOSTED;
// Create a mock client for self-hosted mode
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

// Use real Supabase client only if not in self-hosted mode
const supabaseUrl = isSelfHosted ? '' : import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = isSelfHosted ? '' : import.meta.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = isSelfHosted ? (createMockClient() as any) : createClient(supabaseUrl, supabaseKey);

export default supabase;
