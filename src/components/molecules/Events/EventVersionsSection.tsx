import { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { Clock } from 'lucide-react';
import { EventLookupItem } from '@/types/dto';
import { formatDateTimeWithSecondsAndTimezone } from '@/utils/common/format_date';
import JsonCodeBlock from './JsonCodeBlock';

interface EventVersionsSectionProps {
	events: EventLookupItem[];
}

const EventVersionsSection: FC<EventVersionsSectionProps> = ({ events }) => {
	const { t } = useTranslation(['developers', 'common']);

	if (events.length === 0) {
		return null;
	}

	return (
		<div className='space-y-4'>
			<div className='space-y-1'>
				<p className='text-xs font-semibold text-content-slate-strong'>{t('events.debugger.ingestedVersionsTitle')}</p>
				{events.length > 1 && <p className='text-xs text-content-slate-muted'>{t('events.debugger.duplicateEventIdHint')}</p>}
			</div>

			{events.map((row, idx) => {
				const ingestedAt = row.ingested_at ? formatDateTimeWithSecondsAndTimezone(row.ingested_at) : null;
				const versionNumber = events.length - idx;

				return (
					<div
						key={`${row.id}-${row.ingested_at ?? row.timestamp}-${idx}`}
						className='rounded-xl border border-line bg-gradient-to-br from-surface to-surface-subtle/50 p-6 shadow-sm'>
						<div className='flex items-center justify-between gap-3 mb-4 pb-4 border-b border-line-subtle'>
							<span className='text-xs font-semibold text-content-slate-strong shrink-0'>
								{t('events.debugger.ingestedVersionNumber', { n: versionNumber })}
							</span>
							<div className='flex items-center gap-1.5 text-xs text-content-slate-muted min-w-0'>
								<Clock className='w-3.5 h-3.5 shrink-0' />
								<span className='truncate'>
									{ingestedAt ? (
										<>
											<span className='me-1.5 text-content-slate-tertiary'>{t('labels.ingestedAt')}</span>
											{ingestedAt}
										</>
									) : (
										t('labels.missingValue')
									)}
								</span>
							</div>
						</div>

						<JsonCodeBlock value={row.properties} title={t('labels.eventDetails')} />
					</div>
				);
			})}
		</div>
	);
};

export default EventVersionsSection;
