import { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { AnnotatedChange } from '@/types/dto/ActivityLog';
import { FormattedValue } from './formatters';
import { isGatewayField } from './snapshot';

const PLAIN_FORMAT = 'text';

interface Props {
	changes: Record<string, AnnotatedChange>;
	siblings?: Record<string, unknown>;
	customerId?: string;
}

const ChangesTable: FC<Props> = ({ changes, siblings, customerId }) => {
	const { t } = useTranslation('activity');
	const rows = Object.entries(changes).sort(([a], [b]) => a.localeCompare(b));
	return (
		<div className='rounded-md border border-line overflow-hidden text-sm'>
			<div className='grid grid-cols-[1.1fr_1fr_1fr] bg-surface-faint text-content-muted text-xs font-medium px-3 py-2'>
				<span>{t('sheet.field')}</span>
				<span>{t('sheet.before')}</span>
				<span>{t('sheet.after')}</span>
			</div>
			{rows.map(([field, ch]) => {
				const format = isGatewayField(field) ? PLAIN_FORMAT : ch.format;
				return (
					<div key={field} className='grid grid-cols-[1.1fr_1fr_1fr] gap-2 px-3 py-2 border-t border-line items-center'>
						<span>{ch.label}</span>
						{ch.redacted ? (
							<span className='col-span-2 italic text-content-muted'>{t('sheet.redacted')}</span>
						) : (
							<>
								<span className={ch.from == null ? 'italic text-content-muted' : 'line-through text-red-700 dark:text-red-400'}>
									<FormattedValue value={ch.from} format={format} siblings={siblings} customerId={customerId} />
								</span>
								<span className='font-medium text-green-700 dark:text-green-400'>
									<FormattedValue value={ch.to} format={format} siblings={siblings} customerId={customerId} />
								</span>
							</>
						)}
					</div>
				);
			})}
		</div>
	);
};

export default ChangesTable;
