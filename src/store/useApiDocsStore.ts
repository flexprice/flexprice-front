import { create } from 'zustand';

export interface ApiDocsSnippet {
	label: string;
	description: string;
	curl: string;
	Python?: string;
	JavaScript?: string;
	PHP?: string;
	Java?: string;
	Go?: string;
	'C#'?: string;
	Ruby?: string;
	Swift?: string;
}

interface ApiDocsState {
	snippets: ApiDocsSnippet[];
	consumerCount: number;
	setDocs: (snippets: ApiDocsSnippet[]) => void;
	registerConsumer: () => void;
	unregisterConsumer: () => void;
}

export const useApiDocsStore = create<ApiDocsState>((set) => ({
	snippets: [],
	consumerCount: 0,
	setDocs: (snippets) => set({ snippets }),
	registerConsumer: () => set((state) => ({ consumerCount: state.consumerCount + 1 })),
	unregisterConsumer: () =>
		set((state) => {
			const consumerCount = Math.max(0, state.consumerCount - 1);
			return consumerCount === 0 ? { consumerCount: 0, snippets: [] } : { consumerCount };
		}),
}));
