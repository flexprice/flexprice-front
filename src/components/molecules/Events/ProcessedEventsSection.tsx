import { FC } from 'react';
import { EventProcessedEvent } from '@/types/dto';
import { formatDateTimeWithSecondsAndTimezone } from '@/utils/common/format_date';
import { RouteNames } from '@/core/routes/Routes';
import RedirectCell from '@/components/molecules/Table/RedirectCell';
import { CheckCircle2, Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ProcessedEventsSectionProps {
	events: EventProcessedEvent[];
	onOpenSubscription?: (subscriptionId: string) => void;
	customerNames?: Record<string, string>;
	featureNames?: Record<string, string>;
}

const ProcessedEventsSection: FC<ProcessedEventsSectionProps> = ({ events, onOpenSubscription, customerNames = {}, featureNames = {} }) => {
	const { t } = useTranslation(['developers', 'common']);

	return (
		<div className='space-y-4'>
			{events.map((pe, idx) => {
				const processedAt = pe.processed_at ? formatDateTimeWithSecondsAndTimezone(pe.processed_at) : null;

				return (
					<div
						key={`${pe.subscription_id}-${pe.sub_line_item_id}-${idx}`}
						className='group relative rounded-xl border border-gray-200 bg-gradient-to-br from-white to-gray-50/50 p-6 shadow-sm transition-all duration-200 hover:shadow-md hover:border-gray-300'>
						<div className='flex items-center justify-between mb-5 pb-4 border-b border-gray-100'>
							<div className='flex items-center gap-2.5'>
								<div className='flex items-center justify-center w-7 h-7 rounded-full bg-emerald-100'>
									<CheckCircle2 className='w-4 h-4 text-emerald-600' />
								</div>
								<span className='text-xs font-semibold text-slate-800'>{t('events.processed.eventNumber', { n: idx + 1 })}</span>
							</div>
							{processedAt && (
								<div className='flex items-center gap-1.5 text-xs text-slate-500'>
									<Clock className='w-3.5 h-3.5' />
									<span>{processedAt}</span>
								</div>
							)}
						</div>

						<div className='grid grid-cols-12 gap-x-8 gap-y-3.5'>
							<dt className='col-span-3 text-xs font-medium text-slate-600 flex items-start pt-0.5'>{t('labels.customer')}</dt>
							<dd className='col-span-9 text-xs break-all'>
								{pe.customer_id ? (
									<RedirectCell redirectUrl={`${RouteNames.customers}/${pe.customer_id}`}>
										{customerNames[pe.customer_id] || pe.customer_id}
									</RedirectCell>
								) : (
									<span className='text-slate-400'>{t('labels.missingValue')}</span>
								)}
							</dd>

							<dt className='col-span-3 text-xs font-medium text-slate-600 flex items-start pt-0.5'>{t('labels.subscription')}</dt>
							<dd className='col-span-9 text-xs font-mono text-slate-900 break-all'>
								{pe.customer_id ? (
									<RedirectCell redirectUrl={`${RouteNames.customers}/${pe.customer_id}/subscription/${pe.subscription_id}`}>
										{pe.subscription_id}
									</RedirectCell>
								) : (
									<button
										type='button'
										onClick={() => onOpenSubscription?.(pe.subscription_id)}
										className='text-blue-600 hover:text-blue-700 hover:underline text-start text-xs transition-colors'>
										{pe.subscription_id}
									</button>
								)}
							</dd>

							<dt className='col-span-3 text-xs font-medium text-slate-600 flex items-start pt-0.5'>{t('labels.feature')}</dt>
							<dd className='col-span-9 text-xs break-all'>
								<RedirectCell redirectUrl={`${RouteNames.featureDetails}/${pe.feature_id}`}>
									{featureNames[pe.feature_id] || pe.feature_id}
								</RedirectCell>
							</dd>

							<dt className='col-span-3 text-xs font-medium text-slate-600 flex items-start pt-0.5'>{t('labels.lineItem')}</dt>
							<dd className='col-span-9 text-xs font-mono text-slate-900 break-all'>{pe.sub_line_item_id}</dd>

							<dt className='col-span-3 text-xs font-medium text-slate-600 flex items-start pt-0.5'>{t('labels.meter')}</dt>
							<dd className='col-span-9 text-xs font-mono text-slate-900 break-all'>{pe.meter_id}</dd>

							<dt className='col-span-3 text-xs font-medium text-slate-600 flex items-start pt-0.5'>{t('labels.price')}</dt>
							<dd className='col-span-9 text-xs font-mono text-slate-900 break-all'>{pe.price_id}</dd>

							<dt className='col-span-3 text-xs font-medium text-slate-600 flex items-start pt-0.5'>{t('labels.qty')}</dt>
							<dd className='col-span-9 text-xs font-mono text-slate-900 font-semibold'>{pe.qty_total}</dd>
						</div>
					</div>
				);
			})}
		</div>
	);
};

export default ProcessedEventsSection;
