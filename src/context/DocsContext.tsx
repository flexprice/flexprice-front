import { createContext, useContext, FC, ReactNode, useMemo } from 'react';
import { useApiDocsStore, ApiDocsSnippet } from '@/store/useApiDocsStore';

interface DocsContextProps {
	setPageDocs: (snippets: ApiDocsSnippet[]) => void;
	clearPageDocs: () => void;
}

const DocsContext = createContext<DocsContextProps | undefined>(undefined);

interface DocsProviderProps {
	children: ReactNode;
}

export const DocsProvider: FC<DocsProviderProps> = ({ children }) => {
	const { setDocs, clearDocs } = useApiDocsStore();

	// Memoize context value to prevent unnecessary re-renders (Fast-Refresh optimization)
	const value = useMemo(
		() => ({
			setPageDocs: setDocs,
			clearPageDocs: clearDocs,
		}),
		[setDocs, clearDocs],
	);

	return <DocsContext.Provider value={value}>{children}</DocsContext.Provider>;
};

export const useDocs = () => {
	const context = useContext(DocsContext);
	if (!context) {
		throw new Error('useDocs must be used within a DocsProvider');
	}
	return context;
};
