import { Card, Progress } from '@/components/atoms';
import { CustomerUsage } from '@/models';
import { FEATURE_TYPE } from '@/models/Feature';
import { formatAmount } from '@/components/atoms/Input/Input';
import { useTranslation } from 'react-i18next';

interface UsageSectionProps {
	usageData: CustomerUsage[];
	isLoading?: boolean;
}

const UsageSection = ({ usageData, isLoading }: UsageSectionProps) => {
	const { t } = useTranslation('customer-portal');
	if (isLoading) {
		return (
			<Card className='bg-white border border-[#E9E9E9] rounded-xl p-6'>
				<div className='animate-pulse space-y-4'>
					<div className='h-5 bg-zinc-100 rounded w-1/4'></div>
					<div className='space-y-3'>
						<div className='h-12 bg-zinc-100 rounded'></div>
						<div className='h-12 bg-zinc-100 rounded'></div>
					</div>
				</div>
			</Card>
		);
	}

	// Filter to only show metered features with usage
	const meteredUsage = usageData?.filter((item) => item.feature?.type === FEATURE_TYPE.METERED) || [];

	// Hide section if no usage data
	if (meteredUsage.length === 0) {
		return null;
	}

	return (
		<Card className='bg-white border border-[#E9E9E9] rounded-xl p-6'>
			<h3 className='text-base font-medium text-zinc-950 mb-4'>{t('usage.currentTitle')}</h3>
			<div className='space-y-4'>
				{meteredUsage.map((item, index) => {
					const usage = Number(item.current_usage || 0);
					const limit = item.is_unlimited ? null : item.total_limit ? Number(item.total_limit) : null;
					const percentage = limit ? Math.min(Math.ceil((usage / limit) * 100), 100) : 0;
					const isOverLimit = limit && usage > limit;

					return (
						<div key={item.feature?.id || index} className='space-y-2'>
							<div className='flex items-center justify-between'>
								<span className='text-sm text-zinc-700'>{item.feature?.name || t('usage.unknownFeature')}</span>
								<span className='text-sm text-zinc-500'>
									{formatAmount(usage.toString())}
									{limit ? ` / ${formatAmount(limit.toString())}` : ` / ${t('usage.unlimited')}`}
								</span>
							</div>
							<Progress
								value={item.is_unlimited ? 0 : percentage}
								className='h-2'
								indicatorColor={isOverLimit ? 'bg-gradient-to-r from-red-600 to-red-400' : 'bg-gradient-to-r from-[#6167d9] to-[#2563eb]'}
								backgroundColor={isOverLimit ? 'bg-red-50' : 'bg-blue-100'}
							/>
						</div>
					);
				})}
			</div>
		</Card>
	);
};

export default UsageSection;
