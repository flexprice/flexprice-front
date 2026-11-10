import { FC, ReactNode } from 'react';
import { useApiDocsStore } from '@/store/useApiDocsStore';
import { DocsContext } from './useDocs';

interface DocsProviderProps {
	children: ReactNode;
}

export const DocsProvider: FC<DocsProviderProps> = ({ children }) => {
	const { setDocs, clearDocs } = useApiDocsStore();

	const value = {
		setPageDocs: setDocs,
		clearPageDocs: clearDocs,
	};

	return <DocsContext.Provider value={value}>{children}</DocsContext.Provider>;
};
