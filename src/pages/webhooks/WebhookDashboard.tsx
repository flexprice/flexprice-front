import { Loader, Page } from '@/components/atoms';
import { ApiDocsContent } from '@/components/molecules/ApiDocs/ApiDocs';
import { API_DOCS_TAGS } from '@/constants/apiDocsTags';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { AppPortal as SvixHostedPortal, SvixProvider } from 'svix-react';
import 'svix-react/style.css';
import { EmptyPage, WebhooksPortal } from '@/components/organisms';
import useEnvironment from '@/hooks/useEnvironment';
import { config, WEBHOOK_PROVIDER } from '@/config/config';
import { PREFETCH_REGISTRY, PrefetchQueryKey } from '@/config/prefetch';
import { useTranslation } from 'react-i18next';

const WebhookDashboard = () => {
	const { t } = useTranslation(['developers', 'common']);
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

	const webhooksHeading = t('common:nav.webhooks');

	if (isLoading) {
		return (
			<Page className='h-full w-full' heading={webhooksHeading}>
				<ApiDocsContent tags={API_DOCS_TAGS.Webhooks} />
				<div className='flex items-center justify-center h-96'>
					<Loader />
				</div>
			</Page>
		);
	}

	if (isError) {
		toast.error(
			t('developers:webhooks.toastFetchError', {
				message: error?.message || t('developers:webhooks.unknownError'),
			}),
		);
		// EmptyPage renders its own Page + heading, so it must not be nested inside another Page.
		return (
			<EmptyPage
				heading={webhooksHeading}
				tags={API_DOCS_TAGS.Webhooks}
				emptyStateCard={{
					heading: t('developers:webhooks.emptyLoadFailed.heading'),
					description: t('developers:webhooks.emptyLoadFailed.description'),
				}}
			/>
		);
	}

	if (!data?.svix_enabled) {
		return (
			<EmptyPage
				heading={webhooksHeading}
				tags={API_DOCS_TAGS.Webhooks}
				emptyStateCard={{
					heading: t('developers:webhooks.disabled.heading'),
					description: t('developers:webhooks.disabled.description'),
				}}
			/>
		);
	}

	// Custom provider (Flexprice or self-hosted Svix): backend returns token/app_id and we
	// render our own portal. Hosted Svix (default): backend returns a hosted portal `url`.
	const isCustomProvider = config.webhooks.provider === WEBHOOK_PROVIDER.Custom;
	// svix-react/svix only fall back to the token's regional API when serverUrl is undefined —
	// an empty string is treated as a literal (relative) base URL and breaks region auto-detection.
	const serverUrl = config.webhooks.svixUrl || undefined;

	if (isCustomProvider && data?.token && data?.app_id) {
		return (
			<Page className='h-full w-full' heading={webhooksHeading}>
				<ApiDocsContent tags={API_DOCS_TAGS.Webhooks} />
				<SvixProvider token={data.token} appId={data.app_id} options={{ serverUrl }}>
					<WebhooksPortal />
				</SvixProvider>
			</Page>
		);
	}

	const hostedUrl = data?.url;
	const isHostedPortal = !isCustomProvider && !!hostedUrl;

	if (isHostedPortal) {
		return (
			<Page className='h-full w-full' heading={webhooksHeading}>
				<ApiDocsContent tags={API_DOCS_TAGS.Webhooks} />
				<SvixHostedPortal url={hostedUrl} style={{ width: '100%', height: '100%', border: 'none' }} primaryColor='#000000' />
			</Page>
		);
	}

	// Enabled but neither a usable hosted URL nor self-hosted token/app_id — treat as the disabled/empty state.
	return (
		<EmptyPage
			heading={webhooksHeading}
			tags={API_DOCS_TAGS.Webhooks}
			emptyStateCard={{
				heading: t('developers:webhooks.disabled.heading'),
				description: t('developers:webhooks.disabled.description'),
			}}
		/>
	);
};

export default WebhookDashboard;
