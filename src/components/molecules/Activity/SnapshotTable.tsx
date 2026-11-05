import { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { FormattedValue } from './formatters';
import { snapshotRows } from './snapshot';

interface Props {
	rows: ReturnType<typeof snapshotRows>;
	siblings?: Record<string, unknown>;
	customerId?: string;
}

/** The created-record counterpart of ChangesTable: same look, one value column instead of before/after. */
const SnapshotTable: FC<Props> = ({ rows, siblings, customerId }) => {
	const { t } = useTranslation('activity');
	return (
		<div className='rounded-md border border-line overflow-hidden text-sm'>
			<div className='grid grid-cols-[1.1fr_2fr] bg-surface-faint text-content-muted text-xs font-medium px-3 py-2'>
				<span>{t('sheet.field')}</span>
				<span>{t('sheet.value')}</span>
			</div>
			{rows.map((r) => (
				<div key={r.key} className='grid grid-cols-[1.1fr_2fr] gap-2 px-3 py-2 border-t border-line items-center'>
					<span>{r.label}</span>
					{r.format === 'redacted' ? (
						<span className='italic text-content-muted'>{t('sheet.redacted')}</span>
					) : (
						<span className='break-all'>
							<FormattedValue value={r.value} format={r.format} siblings={siblings} customerId={customerId} />
						</span>
					)}
				</div>
			))}
		</div>
	);
};

export default SnapshotTable;
