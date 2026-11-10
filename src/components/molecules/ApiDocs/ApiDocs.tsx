import { FC, useEffect, useState } from 'react';
import DocsDrawer from '../DocsDrawer/DocsDrawer';
import { useApiDocsStore, ApiDocsSnippet } from '@/store/useApiDocsStore';
import { useDocs } from '@/context/useDocs';
import { Button } from '@/components/atoms';
import { Code2 } from 'lucide-react';
import { fetchAndExtractSnippetsByTags, OpenApiDocument } from './fetch_api_docs';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

const ApiDocs: FC = () => {
	const [isDocsOpen, setIsDocsOpen] = useState(false);
	const { snippets } = useApiDocsStore();

	return (
		<DocsDrawer
			isOpen={isDocsOpen}
			onOpenChange={setIsDocsOpen}
			snippets={snippets}
			trigger={
				<Button variant='outline' className='outline-none text-sm flex items-center gap-2' size='sm'>
					<Code2 className='w-4 h-4' />
					Api
				</Button>
			}
		/>
	);
};

interface ApiDocsContentProps {
	tags?: string[];
	snippets?: ApiDocsSnippet[];
}

const fetchApidocsJson = async (): Promise<OpenApiDocument> => {
	const { data } = await axios.get<OpenApiDocument>(
		'https://raw.githubusercontent.com/flexprice/flexprice-docs/main/api-reference/openapi.json',
	);
	return data;
};

export const ApiDocsContent = ({ tags, snippets: snippetsProp }: ApiDocsContentProps) => {
	const { setPageDocs, clearPageDocs } = useDocs();
	const [snippets, setSnippets] = useState<ApiDocsSnippet[]>(snippetsProp || []);

	const { data: docs } = useQuery({
		queryKey: ['openapi-json'],
		queryFn: fetchApidocsJson,
		staleTime: 1000 * 60 * 60 * 24,
		gcTime: 1000 * 60 * 60 * 24,
		enabled: !snippetsProp && !!tags,
	});

	useEffect(() => {
		const fetchSnippets = async (tags: string[]) => {
			if (!snippetsProp && tags && docs) {
				const fetchedSnippets = await fetchAndExtractSnippetsByTags(tags, docs);
				setSnippets(fetchedSnippets);
			}
		};

		if (tags && !snippetsProp) {
			fetchSnippets(tags);
		}
	}, [tags, docs, snippetsProp]);

	useEffect(() => {
		setPageDocs(snippets);
		return () => clearPageDocs();
	}, [snippets, setPageDocs, clearPageDocs]);

	return null;
};

export default ApiDocs;
