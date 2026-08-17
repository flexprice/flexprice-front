import { beforeEach, describe, expect, it } from 'vitest';
import { useApiDocsStore } from './useApiDocsStore';

const sampleSnippet = {
	label: 'List subscriptions',
	description: 'Search subscriptions',
	curl: 'curl ...',
};

describe('useApiDocsStore', () => {
	beforeEach(() => {
		useApiDocsStore.setState({ snippets: [], consumerCount: 0 });
	});

	it('keeps snippets while any ApiDocsContent consumer is mounted', () => {
		const { registerConsumer, unregisterConsumer, setDocs } = useApiDocsStore.getState();

		registerConsumer();
		registerConsumer();
		setDocs([sampleSnippet]);

		unregisterConsumer();
		expect(useApiDocsStore.getState().snippets).toEqual([sampleSnippet]);
		expect(useApiDocsStore.getState().consumerCount).toBe(1);

		unregisterConsumer();
		expect(useApiDocsStore.getState().snippets).toEqual([]);
		expect(useApiDocsStore.getState().consumerCount).toBe(0);
	});
});
