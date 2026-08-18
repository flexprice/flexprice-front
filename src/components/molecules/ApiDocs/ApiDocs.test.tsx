import { render, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ApiDocsContent } from './ApiDocs';
import { DocsProvider } from '@/context/DocsContext';
import { useApiDocsStore } from '@/store/useApiDocsStore';
import { fetchAndExtractSnippetsByTags } from './fetch_api_docs';

const sampleSnippet = {
	label: 'List plans',
	description: 'Search plans',
	curl: 'curl --request GET',
};

vi.mock('./fetch_api_docs', () => ({
	fetchAndExtractSnippetsByTags: vi.fn(async () => [sampleSnippet]),
}));

const renderApiDocsContent = () => {
	const queryClient = new QueryClient({
		defaultOptions: { queries: { retry: false } },
	});
	queryClient.setQueryData(['openapi-json', 'docs-flexprice-io'], {
		paths: {},
		components: { schemas: {} },
		servers: [{ url: 'https://api.example.com' }],
	});

	return render(
		<QueryClientProvider client={queryClient}>
			<DocsProvider>
				<ApiDocsContent tags={['Plans']} />
			</DocsProvider>
		</QueryClientProvider>,
	);
};

describe('ApiDocsContent', () => {
	beforeEach(() => {
		useApiDocsStore.setState({ snippets: [], consumerCount: 0 });
		vi.mocked(fetchAndExtractSnippetsByTags).mockClear();
	});

	it('publishes fetched snippets to the store after OpenAPI is available', async () => {
		renderApiDocsContent();

		await waitFor(() => {
			expect(fetchAndExtractSnippetsByTags).toHaveBeenCalled();
			expect(useApiDocsStore.getState().snippets).toEqual([sampleSnippet]);
		});
	});
});
