import { createContext, useContext } from 'react';
import type { ApiDocsSnippet } from '@/store/useApiDocsStore';

export interface DocsContextProps {
	setPageDocs: (snippets: ApiDocsSnippet[]) => void;
	clearPageDocs: () => void;
}

export const DocsContext = createContext<DocsContextProps | undefined>(undefined);

export const useDocs = () => {
	const context = useContext(DocsContext);
	if (!context) {
		throw new Error('useDocs must be used within a DocsProvider');
	}
	return context;
};
