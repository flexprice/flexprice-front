import { Card, CardContent, CardHeader, CardTitle, CardDescription, Skeleton } from '@/components/ui';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { getTypographyClass } from '@/lib/typography';
import { CalendarClock, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
const PIE_CHART_HEIGHT = 140;

interface SubscriptionsByPlan {
	count: number;
	plan_name: string;
	plan_id: string;
}

interface RecentSubscriptionsCardProps {
	subscriptionsCount: number;
	subscriptionsByPlan: SubscriptionsByPlan[];
	isLoading: boolean;
	error?: Error | null;
}

export const RecentSubscriptionsCard: React.FC<RecentSubscriptionsCardProps> = ({
	subscriptionsCount,
	subscriptionsByPlan,
	isLoading,
	error,
}) => {
	const { t } = useTranslation('common');

	return (
		<Card className='shadow-sm'>
			<CardHeader className='pb-8'>
				<div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
					<div>
						<CardTitle className={getTypographyClass('section-title', 'font-medium')}>
							{t('dashboardHome.recentSubscriptionsTitle')}
						</CardTitle>
						<CardDescription className={getTypographyClass('helper-text', 'mt-1')}>
							{t('dashboardHome.recentSubscriptionsSubtitle')}
						</CardDescription>
					</div>
				</div>
			</CardHeader>
			<CardContent className='pt-0'>
				{isLoading ? (
					<div className='space-y-6 py-4'>
						<div className='space-y-2'>
							<Skeleton className='h-10 w-24' />
							<Skeleton className='h-4 w-32' />
						</div>
						<div className='space-y-3'>
							<Skeleton className='h-[140px] w-full rounded-lg' />
							<div className='mt-4 grid grid-cols-2 gap-x-4 gap-y-2'>
								<Skeleton className='h-4 w-full' />
								<Skeleton className='h-4 w-full' />
								<Skeleton className='h-4 w-full' />
								<Skeleton className='h-4 w-full' />
							</div>
						</div>
					</div>
				) : error ? (
					<div className='flex flex-col items-center justify-center py-8'>
						<AlertCircle className='h-8 w-8 text-danger-bright mb-3' />
						<p className={getTypographyClass('body-small', 'text-center text-content-zinc-tertiary')}>
							{t('dashboardHome.recentSubscriptionsLoadError')}
						</p>
					</div>
				) : (
					<>
						<div className='mb-8'>
							<p className='text-4xl font-bold text-content-zinc-bold'>{subscriptionsCount}</p>
							<p className={getTypographyClass('body-small', 'text-content-zinc-tertiary mt-2')}>{t('dashboardHome.newSubscriptions')}</p>
						</div>
						{subscriptionsByPlan.length > 0 ? (
							<div>
								<ResponsiveContainer width='100%' height={PIE_CHART_HEIGHT}>
									<PieChart>
										<Pie
											data={subscriptionsByPlan.map((item) => ({
												name: item.plan_name,
												value: item.count,
												fullName: item.plan_name,
											}))}
											cx='50%'
											cy='50%'
											innerRadius={40}
											outerRadius={70}
											paddingAngle={2}
											dataKey='value'>
											{subscriptionsByPlan.map((_, idx) => (
												<Cell key={`cell-${idx}`} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
											))}
										</Pie>
										<Tooltip
											contentStyle={{
												backgroundColor: 'white',
												border: '1px solid #e5e7eb',
												borderRadius: '6px',
												padding: '8px 12px',
											}}
											formatter={(value: any, _name: any, props: any) => [
												t('dashboardHome.subscriptionsChartTooltip', { count: Number(value) }),
												props.payload.fullName,
											]}
										/>
									</PieChart>
								</ResponsiveContainer>
								<div className='mt-4 grid grid-cols-2 gap-x-4 gap-y-2'>
									{subscriptionsByPlan.map((item, idx) => (
										<div key={item.plan_id} className='flex min-w-0 items-center gap-2'>
											<span
												className='h-2 w-2 shrink-0 rounded-full'
												style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }}
											/>
											<span
												className={getTypographyClass('helper-text', 'min-w-0 truncate text-content-zinc-tertiary')}
												title={item.plan_name}>
												{item.plan_name}
											</span>
										</div>
									))}
								</div>
							</div>
						) : (
							<div className='flex flex-col items-center py-6'>
								<CalendarClock className='w-8 h-8 text-content-zinc-disabled mb-3' />
								<p className={getTypographyClass('body-small', 'text-center text-content-zinc-subtle')}>
									{t('dashboardHome.noSubscriptionsLast24Hours')}
								</p>
							</div>
						)}
					</>
				)}
			</CardContent>
		</Card>
	);
};

export default RecentSubscriptionsCard;
