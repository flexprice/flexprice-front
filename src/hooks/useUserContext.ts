import { createContext, useContext } from 'react';
import type { User } from '@/models/User';
import type { Tenant } from '@/models/Tenant';

/**
 * What the context holds. AuthProvider stores the Flexprice user once it loads, but LoginForm and
 * SignupConfirmation seed it with the Supabase auth user first, and it starts out as `{}` — so every
 * field is optional. The tenant also carries its `metadata` (see `Tenant`), which `User` does not declare.
 */
export type ContextUser = Omit<Partial<User>, 'tenant'> & {
	tenant?: Partial<User['tenant']> & Partial<Pick<Tenant, 'metadata'>>;
};

export interface UserContextProp {
	user: ContextUser | null;
	setUser: (user: ContextUser | null) => void;
}
export const UserContext = createContext<UserContextProp>({} as UserContextProp);

export const useUser = () => useContext(UserContext);
