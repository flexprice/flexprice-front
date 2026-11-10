import { QueryClientProvider } from '@tanstack/react-query';
import { PropsWithChildren, useState } from 'react';
import { queryClient } from './queryClient';
import { LoadingContext } from './useGlobalLoading';

const ReactQueryProvider = ({ children }: PropsWithChildren) => {
	const [isLoading, setLoading] = useState(false);

	return (
		<LoadingContext.Provider value={{ isLoading, setLoading }}>
			<QueryClientProvider client={queryClient}>
				{children}
				{/* <ReactQueryDevtools buttonPosition='bottom-right' initialIsOpen={false} /> */}
			</QueryClientProvider>
		</LoadingContext.Provider>
	);
};

export default ReactQueryProvider;
