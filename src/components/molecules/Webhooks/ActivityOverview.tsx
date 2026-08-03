import { FC } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useEndpoints, useSvix } from 'svix-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { Loader } from '@/components/atoms';
import { useTranslation } from 'react-i18next';
import { fetchWebhookActivity } from '@/utils/webhooks/activityStats';

const ActivityOverview: FC = () => {
	const { t } = useTranslation('developers');
	const { svix, appId } = useSvix();
	const endpoints = useEndpoints({ limit: 100 });
	const endpointIds = (endpoints.data ?? []).map((endpoint) => endpoint.id);

	const activity = useQuery({
		queryKey: ['webhooks', 'activity', appId, endpointIds],
		queryFn: () => fetchWebhookActivity({ svix, appId, endpointIds }),
		enabled: !!appId && !endpoints.loading && !endpoints.error,
		staleTime: 60_000,
	});

	if (endpoints.loading || activity.isLoading) {
		return (
			<div className='flex h-64 items-center justify-center'>
				<Loader />
			</div>
		);
	}

	if (endpoints.error || activity.isError) {
		return <div className='p-4 text-sm text-destructive'>{t('webhooks.activity.loadFailed')}</div>;
	}

	const successfulAttempts = activity.data?.successfulAttempts ?? 0;
	const failedAttempts = activity.data?.failedAttempts ?? 0;
	const points = activity.data?.points ?? [];
	const hasActivity = successfulAttempts > 0 || failedAttempts > 0;

	return (
		<div className='flex flex-col gap-6'>
			<div>
				<h3 className='text-lg font-medium'>{t('webhooks.activity.heading')}</h3>
				<p className='text-sm text-muted-foreground'>{t('webhooks.activity.subheading')}</p>
			</div>

			<div className='grid grid-cols-2 gap-6'>
				<div>
					<p className='text-sm text-muted-foreground'>{t('webhooks.activity.successfulAttempts')}</p>
					<p className='text-2xl font-medium'>{successfulAttempts}</p>
				</div>
				<div>
					<p className='text-sm text-muted-foreground'>{t('webhooks.activity.failedAttempts')}</p>
					<p className='text-2xl font-medium'>{failedAttempts}</p>
				</div>
			</div>

			<Card>
				<CardHeader>
					<CardTitle className='text-sm font-medium'>{t('webhooks.activity.recentActivity')}</CardTitle>
				</CardHeader>
				<CardContent>
					{!hasActivity ? (
						<div className='flex h-64 items-center justify-center text-sm text-muted-foreground'>{t('webhooks.activity.noActivity')}</div>
					) : (
						<ResponsiveContainer width='100%' height={300}>
							<AreaChart data={points}>
								<CartesianGrid strokeDasharray='3 3' vertical={false} />
								<XAxis dataKey='timestamp' />
								<YAxis allowDecimals={false} />
								<Tooltip />
								<Area
									type='monotone'
									dataKey='successful'
									stroke='rgb(var(--fp-success-bright))'
									fill='rgb(var(--fp-success-bright) / 0.2)'
								/>
								<Area type='monotone' dataKey='failed' stroke='rgb(var(--fp-danger-bright))' fill='rgb(var(--fp-danger-bright) / 0.2)' />
							</AreaChart>
						</ResponsiveContainer>
					)}
				</CardContent>
			</Card>
		</div>
	);
};

export default ActivityOverview;
