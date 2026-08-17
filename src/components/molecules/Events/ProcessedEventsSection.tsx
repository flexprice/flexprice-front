import { FC, ReactNode } from 'react';
import { EventProcessedEvent } from '@/types/dto';
import { formatDateTimeWithSecondsAndTimezone } from '@/utils/common/format_date';
import { RouteNames } from '@/core/routes/Routes';
import RedirectCell from '@/components/molecules/Table/RedirectCell';
import { CheckCircle2, Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

interface ProcessedEventsSectionProps {
	events: EventProcessedEvent[];
	onOpenSubscription?: (subscriptionId: string) => void;
	customerNames?: Record<string, string>;
	featureNames?: Record<string, string>;
}

const labelClass = 'w-0 whitespace-nowrap py-1.5 pr-6 text-xs font-medium text-content-slate-tertiary align-top';
const valueClass = 'py-1.5 text-xs align-top break-all';

const DetailRow: FC<{ label: string; valueClassName?: string; children: ReactNode }> = ({ label, valueClassName, children }) => (
	<tr className='align-top'>
		<th scope='row' className={labelClass}>
			{label}
		</th>
		<td className={cn(valueClass, valueClassName)}>{children}</td>
	</tr>
);

const ProcessedEventsSection: FC<ProcessedEventsSectionProps> = ({ events, onOpenSubscription, customerNames = {}, featureNames = {} }) => {
	const { t } = useTranslation(['developers', 'common']);

	return (
		<div className='space-y-4'>
			{events.map((pe, idx) => {
				const processedAt = pe.processed_at ? formatDateTimeWithSecondsAndTimezone(pe.processed_at) : null;

				return (
					<div
						key={`${pe.subscription_id}-${pe.sub_line_item_id}-${idx}`}
						className='group relative rounded-xl border border-line bg-gradient-to-br from-surface to-surface-subtle/50 p-6 shadow-sm transition-all duration-200 hover:shadow-md hover:border-line-strong'>
						<div className='flex items-center justify-between mb-5 pb-4 border-b border-line-subtle'>
							<div className='flex items-center gap-2.5'>
								<div className='flex items-center justify-center w-7 h-7 rounded-full bg-accent-emerald-muted'>
									<CheckCircle2 className='w-4 h-4 text-accent-emerald-strong' />
								</div>
								<span className='text-xs font-semibold text-content-slate-strong'>{t('events.processed.eventNumber', { n: idx + 1 })}</span>
							</div>
							{processedAt && (
								<div className='flex items-center gap-1.5 text-xs text-content-slate-muted'>
									<Clock className='w-3.5 h-3.5' />
									<span>{processedAt}</span>
								</div>
							)}
						</div>

						<table className='w-full border-collapse'>
							<tbody>
								<DetailRow label={t('labels.customer')}>
									{pe.customer_id ? (
										<RedirectCell redirectUrl={`${RouteNames.customers}/${pe.customer_id}`}>
											{customerNames[pe.customer_id] || pe.customer_id}
										</RedirectCell>
									) : (
										<span className='text-content-slate-subtle'>{t('labels.missingValue')}</span>
									)}
								</DetailRow>

								<DetailRow label={t('labels.subscription')} valueClassName='font-mono text-content-slate'>
									{pe.customer_id ? (
										<RedirectCell redirectUrl={`${RouteNames.customers}/${pe.customer_id}/subscription/${pe.subscription_id}`}>
											{pe.subscription_id}
										</RedirectCell>
									) : (
										<button
											type='button'
											onClick={() => onOpenSubscription?.(pe.subscription_id)}
											className='text-info hover:text-info-strong hover:underline text-start text-xs transition-colors'>
											{pe.subscription_id}
										</button>
									)}
								</DetailRow>

								<DetailRow label={t('labels.feature')}>
									<RedirectCell redirectUrl={`${RouteNames.featureDetails}/${pe.feature_id}`}>
										{featureNames[pe.feature_id] || pe.feature_id}
									</RedirectCell>
								</DetailRow>

								<DetailRow label={t('labels.lineItem')} valueClassName='font-mono text-content-slate'>
									{pe.sub_line_item_id}
								</DetailRow>

								<DetailRow label={t('labels.meter')} valueClassName='font-mono text-content-slate'>
									{pe.meter_id}
								</DetailRow>

								<DetailRow label={t('labels.price')} valueClassName='font-mono text-content-slate'>
									{pe.price_id}
								</DetailRow>

								<DetailRow label={t('labels.qty')} valueClassName='font-mono font-semibold text-content-slate'>
									{pe.qty_total}
								</DetailRow>
							</tbody>
						</table>
					</div>
				);
			})}
		</div>
	);
};

export default ProcessedEventsSection;
