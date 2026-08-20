import { createContext, useContext, FC, ReactNode, useMemo } from 'react';
import { useApiDocsStore, ApiDocsSnippet } from '@/store/useApiDocsStore';

interface DocsContextProps {
	setPageDocs: (snippets: ApiDocsSnippet[]) => void;
	registerPageDocsConsumer: () => void;
	unregisterPageDocsConsumer: () => void;
}

const DocsContext = createContext<DocsContextProps | undefined>(undefined);

interface DocsProviderProps {
	children: ReactNode;
}

export const DocsProvider: FC<DocsProviderProps> = ({ children }) => {
	const value = useMemo(
		() => ({
			setPageDocs: (snippets: ApiDocsSnippet[]) => useApiDocsStore.getState().setDocs(snippets),
			registerPageDocsConsumer: () => useApiDocsStore.getState().registerConsumer(),
			unregisterPageDocsConsumer: () => useApiDocsStore.getState().unregisterConsumer(),
		}),
		[],
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
