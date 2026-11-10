import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			staleTime: 0,
			refetchOnWindowFocus: false,
			refetchOnMount: false,
			refetchOnReconnect: false,
			refetchInterval: false,
			refetchIntervalInBackground: false,
			gcTime: 0,
		},
		mutations: {
			retry: false,
		},
	},
});

export const refetchQueries = async (queryKeys?: string | string[]) => {
	const keys = typeof queryKeys === 'string' ? [queryKeys] : (queryKeys ?? []);
	await queryClient.invalidateQueries({ queryKey: keys, exact: false });
	await queryClient.refetchQueries({ queryKey: keys, exact: false });
};
