import React, { ReactNode, useEffect } from 'react';
import { Navigate } from 'react-router';
import { useUser } from '@/hooks/UserContext';
import { PageLoader } from '@/components/atoms';
import useUserhook from '@/hooks/useUser';

interface AuthMiddlewareProps {
	children: ReactNode;
}

/** Set when redirecting to /auth after the user lookup fails, so /auth doesn't bounce back to /. */
export interface UserLookupFailedState {
	userLookupFailed: true;
}

/** Authentication only — per-route permission gating lives in MainLayout (see useRouteAccess). */
const AuthMiddleware: React.FC<AuthMiddlewareProps> = ({ children }) => {
	const userContext = useUser();
	const { user, loading } = useUserhook();

	useEffect(() => {
		if (user) {
			userContext.setUser(user);
		}
	}, [user, userContext]);

	if (loading) {
		return <PageLoader />;
	}

	// useUser() polls every minute to keep RBAC roles fresh (see its own comment). A transient
	// failure on one of those background refetches sets `error` but leaves the previously-fetched
	// `user` in place — checking `error` here as well as `!user` would log an already-authenticated
	// user out on a one-off network blip. `!user` alone still covers "never authenticated": after
	// the query's retries exhaust with no successful fetch, `user` stays undefined.
	if (!user) {
		const state: UserLookupFailedState = { userLookupFailed: true };
		return <Navigate to='/auth' state={state} />;
	}

	return <div>{children}</div>;
};

export default AuthMiddleware;
