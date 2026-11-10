import { useState, useEffect, useCallback, ReactNode } from 'react';
import { logger } from '@/utils/common/Logger';
import { ContextUser, UserContext } from './useUserContext';

interface UserProviderProps {
	children: ReactNode;
}

export const UserProvider = ({ children }: UserProviderProps) => {
	const [user, setUserState] = useState<ContextUser | null>({});

	const setUser = useCallback((next: ContextUser | null) => {
		setUserState(next);
		try {
			if (next == null) {
				localStorage.removeItem('user');
			} else {
				localStorage.setItem('user', JSON.stringify(next));
			}
		} catch (error) {
			logger.error(error);
		}
	}, []);

	useEffect(() => {
		try {
			const userData = localStorage.getItem('user');
			if (userData) {
				const parsed: ContextUser | null = JSON.parse(userData);
				setUserState(parsed);
			}
		} catch (error) {
			logger.error(error);
			// Clear invalid user data but don't trigger logout to prevent infinite redirects
			localStorage.removeItem('user');
			setUserState(null);
		}
	}, []);

	return <UserContext.Provider value={{ user, setUser }}>{children}</UserContext.Provider>;
};
