import { FC } from 'react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { useTranslation } from 'react-i18next';

// TODO(webhooks): svix-react has no "all attempts across app" hook — only per-endpoint
// (useEndpointMessageAttempts) or per-message (useMessageAttempts). Once the self-hosted
// API exposes an app-level activity endpoint, wire real data in here.
const EMPTY_ACTIVITY_POINTS: { timestamp: string; successful: number; failed: number }[] = [];

const ActivityOverview: FC = () => {
	const { t } = useTranslation('developers');
	const successfulAttempts = 0;
	const failedAttempts = 0;

	return (
		<div className='flex flex-col gap-6'>
			<div>
				<h3 className='text-lg font-medium'>{t('webhooks.activity.heading')}</h3>
				<p className='text-sm text-gray-500'>{t('webhooks.activity.subheading')}</p>
			</div>

			<div className='grid grid-cols-2 gap-6'>
				<div>
					<p className='text-sm text-gray-500'>{t('webhooks.activity.successfulAttempts')}</p>
					<p className='text-2xl font-medium'>{successfulAttempts}</p>
				</div>
				<div>
					<p className='text-sm text-gray-500'>{t('webhooks.activity.failedAttempts')}</p>
					<p className='text-2xl font-medium'>{failedAttempts}</p>
				</div>
			</div>

			<Card>
				<CardHeader>
					<CardTitle className='text-sm font-medium'>{t('webhooks.activity.recentActivity')}</CardTitle>
				</CardHeader>
				<CardContent>
					{EMPTY_ACTIVITY_POINTS.length === 0 ? (
						<div className='flex h-64 items-center justify-center text-sm text-gray-400'>{t('webhooks.activity.noActivity')}</div>
					) : (
						<ResponsiveContainer width='100%' height={300}>
							<AreaChart data={EMPTY_ACTIVITY_POINTS}>
								<CartesianGrid strokeDasharray='3 3' vertical={false} />
								<XAxis dataKey='timestamp' />
								<YAxis />
								<Tooltip />
								<Area type='monotone' dataKey='successful' stroke='#22c55e' fill='#22c55e33' />
								<Area type='monotone' dataKey='failed' stroke='#ef4444' fill='#ef444433' />
							</AreaChart>
						</ResponsiveContainer>
					)}
				</CardContent>
			</Card>
		</div>
	);
};

export default ActivityOverview;
