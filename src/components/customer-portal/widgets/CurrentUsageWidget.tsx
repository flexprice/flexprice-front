import { Card, Progress } from '@/components/atoms';
import { CustomerUsage } from '@/models';
import { FEATURE_TYPE } from '@/models/Feature';
import { formatAmount } from '@/components/atoms/Input/Input';
import { useTranslation } from 'react-i18next';

interface CurrentUsageWidgetProps {
	usageData: CustomerUsage[];
	label?: string;
}

const CurrentUsageWidget = ({ usageData, label }: CurrentUsageWidgetProps) => {
	const { t } = useTranslation('customer-portal');
	const meteredUsage = usageData?.filter((item) => item.feature?.type === FEATURE_TYPE.METERED) || [];

	// Return null if no data — no empty container shown
	if (meteredUsage.length === 0) return null;

	return (
		<Card
			className='rounded-xl overflow-hidden'
			style={{ backgroundColor: 'var(--portal-surface, white)', border: '1px solid var(--portal-border, #E9E9E9)' }}>
			<div className='p-6' style={{ borderBottom: '1px solid var(--portal-border, #E9E9E9)' }}>
				<h3 className='text-base font-medium' style={{ color: 'var(--portal-text-primary, #09090b)' }}>
					{label || t('usage.quotaTitle')}
				</h3>
			</div>
			<div className='p-6 space-y-4'>
				{meteredUsage.map((item, index) => {
					const usage = Number(item.current_usage || 0);
					const limit = item.is_unlimited ? null : item.total_limit ? Number(item.total_limit) : null;
					const percentage = limit ? Math.min(Math.ceil((usage / limit) * 100), 100) : 0;
					const isOverLimit = limit && usage > limit;

					return (
						<div key={item.feature?.id || index} className='space-y-2'>
							<div className='flex items-center justify-between'>
								<span className='text-sm' style={{ color: 'var(--portal-text-primary, #09090b)' }}>
									{item.feature?.name || t('usage.unknownFeature')}
								</span>
								<span className='text-sm' style={{ color: 'var(--portal-text-secondary, #71717a)' }}>
									{formatAmount(usage.toString())}
									{limit ? ` / ${formatAmount(limit.toString())}` : ` / ${t('usage.unlimited')}`}
								</span>
							</div>
							<Progress
								value={item.is_unlimited ? 0 : percentage}
								className='h-2'
								indicatorColor={isOverLimit ? 'bg-gradient-to-r from-red-600 to-red-400' : 'bg-[var(--portal-primary,#6167d9)]'}
								backgroundColor={isOverLimit ? 'bg-red-50' : 'bg-zinc-100'}
							/>
						</div>
					);
				})}
			</div>
		</Card>
	);
};

export default CurrentUsageWidget;
