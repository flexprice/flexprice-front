import { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { logger } from '@/utils/common/Logger';

interface UserProviderProps {
	children: ReactNode;
}

interface UserContextProp {
	user: any;
	setUser: (user: any) => void;
}
const UserContext = createContext<UserContextProp>({} as UserContextProp);

export const UserProvider = ({ children }: UserProviderProps) => {
	const [user, setUser] = useState<any>({});

	useEffect(() => {
		try {
			const userData = localStorage.getItem('user');
			if (userData) {
				const user = JSON.parse(userData);
				setUser(user);
			}
		} catch (error) {
			logger.error(error);
			// Clear invalid user data but don't trigger logout to prevent infinite redirects
			localStorage.removeItem('user');
			setUser(null);
		}
	}, []);

	// Memoize context value to prevent unnecessary re-renders (Fast-Refresh optimization)
	const value = useMemo(() => ({ user, setUser }), [user]);

	return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export const useUser = () => useContext(UserContext);
