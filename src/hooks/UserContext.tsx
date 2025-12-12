import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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

	return <UserContext.Provider value={{ user, setUser }}>{children}</UserContext.Provider>;
};

export const useUser = () => useContext(UserContext);
