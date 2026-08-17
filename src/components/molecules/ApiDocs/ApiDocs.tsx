import { FC, useEffect, useState } from 'react';
import DocsDrawer from '../DocsDrawer/DocsDrawer';
import { useApiDocsStore, ApiDocsSnippet } from '@/store/useApiDocsStore';
import { useDocs } from '@/context/DocsContext';
import { Button, HugeIcon } from '@/components/atoms';
import { SourceCodeIcon } from '@hugeicons/core-free-icons';
import { fetchAndExtractSnippetsByTags } from './fetch_api_docs';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

const OPENAPI_URLS = [
	'https://docs.flexprice.io/api-reference/openapi.json',
	'https://raw.githubusercontent.com/flexprice/flexprice-docs/main/api-reference/openapi.json',
];

const ApiDocs: FC = () => {
	const [isDocsOpen, setIsDocsOpen] = useState(false);
	const snippets = useApiDocsStore((state) => state.snippets);
	const isLoading = useApiDocsStore((state) => state.consumerCount > 0 && state.snippets.length === 0);

	return (
		<DocsDrawer
			isOpen={isDocsOpen}
			onOpenChange={setIsDocsOpen}
			snippets={snippets}
			isLoading={isLoading}
			trigger={
				<Button variant='outline' className='outline-none text-sm flex items-center gap-2' size='sm'>
					<HugeIcon icon={SourceCodeIcon} size={16} />
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

export const fetchApidocsJson = async (): Promise<any> => {
	let lastError: unknown;

	for (const url of OPENAPI_URLS) {
		try {
			const { data } = await axios.get(url);
			return data;
		} catch (error) {
			lastError = error;
		}
	}

	throw lastError ?? new Error('Failed to fetch OpenAPI spec');
};

export const ApiDocsContent = ({ tags, snippets: snippetsProp }: ApiDocsContentProps) => {
	const { setPageDocs, registerPageDocsConsumer, unregisterPageDocsConsumer } = useDocs();
	const [snippets, setSnippets] = useState<ApiDocsSnippet[]>(snippetsProp ?? []);
	const [hasResolvedSnippets, setHasResolvedSnippets] = useState(snippetsProp !== undefined);

	const { data: docs, isError } = useQuery({
		queryKey: ['openapi-json', 'docs-flexprice-io'],
		queryFn: fetchApidocsJson,
		staleTime: 1000 * 60 * 60 * 24,
		gcTime: 1000 * 60 * 60 * 24,
		retry: 2,
		enabled: !snippetsProp && !!tags?.length,
	});

	useEffect(() => {
		registerPageDocsConsumer();
		return unregisterPageDocsConsumer;
	}, [registerPageDocsConsumer, unregisterPageDocsConsumer]);

	useEffect(() => {
		if (snippetsProp !== undefined) {
			setSnippets(snippetsProp);
			setHasResolvedSnippets(true);
			return;
		}

		if (!tags?.length) {
			return;
		}

		if (isError) {
			setSnippets([]);
			setHasResolvedSnippets(true);
			return;
		}

		if (!docs) {
			return;
		}

		let cancelled = false;

		const loadSnippets = async () => {
			const fetchedSnippets = await fetchAndExtractSnippetsByTags(tags, docs);
			if (cancelled) return;
			setSnippets(fetchedSnippets);
			setHasResolvedSnippets(true);
		};

		void loadSnippets();

		return () => {
			cancelled = true;
		};
	}, [tags, docs, snippetsProp, isError]);

	useEffect(() => {
		if (!hasResolvedSnippets) return;
		setPageDocs(snippets);
	}, [hasResolvedSnippets, snippets, setPageDocs]);

	return null;
};

export default ApiDocs;
