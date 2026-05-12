import { Loader, Page } from '@/components/atoms';
import { ApiDocsContent } from '@/components/molecules/ApiDocs/ApiDocs';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { AppPortal } from 'svix-react';
import 'svix-react/style.css';
import { EmptyPage } from '@/components/organisms';
import { useMemo } from 'react';
import useEnvironment from '@/hooks/useEnvironment';
import { PREFETCH_REGISTRY, PrefetchQueryKey } from '@/config/prefetch';

const WebhookDashboard = () => {
	const { activeEnvironment } = useEnvironment();
	const envId = activeEnvironment?.id;
	const prefetch = PREFETCH_REGISTRY[PrefetchQueryKey.WebhookDashboardUrl];

	const { data, isLoading, isError, error } = useQuery({
		queryKey: prefetch.queryKey(envId ?? ''),
		queryFn: prefetch.queryFn,
		staleTime: prefetch.staleTime,
		gcTime: prefetch.gcTime,
		enabled: !!envId,
	});

	// Memoize the AppPortal props to prevent unnecessary re-renders
	const appPortalProps = useMemo(
		() => ({
			primaryColor: '#000000',
			style: {
				width: '100%',
				height: '100%',
				color: '#000000',
				border: 'none',
				backgroundColor: '#000000',
			},
			url: data?.url ?? '',
		}),
		[data?.url],
	);

	if (isLoading) {
		return (
			<Page className='h-full w-full' heading='Webhooks'>
				<ApiDocsContent tags={['Webhooks']} />
				<div className='flex items-center justify-center h-96'>
					<Loader />
				</div>
			</Page>
		);
	}

	if (isError) {
		toast.error(`Error fetching webhook dashboard: ${error?.message || 'Unknown error'}`);
		return (
			<Page className='h-full w-full' heading='Webhooks'>
				<ApiDocsContent tags={['Webhooks']} />
				<EmptyPage
					heading='Webhooks'
					emptyStateCard={{
						heading: 'Unable to Load Webhooks',
						description: 'There was an error loading the webhook dashboard. Please try refreshing the page.',
					}}
				/>
			</Page>
		);
	}

	if (!data?.svix_enabled) {
		return (
			<Page className='h-full w-full' heading='Webhooks'>
				<ApiDocsContent tags={['Webhooks']} />
				<EmptyPage
					heading='Webhooks'
					emptyStateCard={{
						heading: 'Webhooks',
						description: 'Webhooks are not enabled. Please contact support to enable webhooks.',
					}}
				/>
			</Page>
		);
	}

	return (
		<Page className='h-full w-full' heading='Webhooks'>
			<ApiDocsContent tags={['Webhooks']} />
			<AppPortal {...appPortalProps} />
		</Page>
	);
};

export default WebhookDashboard;
