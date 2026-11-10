import { createContext, useContext } from 'react';

export interface LoadingContextType {
	isLoading: boolean;
	setLoading: (loading: boolean) => void;
}

export const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export const useGlobalLoading = () => {
	const context = useContext(LoadingContext);
	if (!context) throw new Error('useGlobalLoading must be used within ReactQueryProvider');
	return context;
};
