import { FC, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Trash2 } from 'lucide-react';
import { AddButton, FormHeader } from '@/components/atoms';
import FlexpriceTable, { ColumnData } from '../Table';
import SubscriptionGrantDialog from './SubscriptionGrantDialog';
import { ENTITLEMENT_AGGREGATION_MODE, ENTITLEMENT_GRANT_DURATION_UNIT } from '@/models/Entitlement';
import type { SubscriptionGrantDraft } from '@/types/dto/Entitlement';
import { getCurrencySymbol } from '@/constants/common';

interface SubscriptionGrantDraftTableProps {
	data: SubscriptionGrantDraft[];
	onChange: (data: SubscriptionGrantDraft[]) => void;
	currency: string;
	disabled?: boolean;
}

type Row = SubscriptionGrantDraft & { index: number };

/** Subscription entitlements to create with a new subscription; nothing is saved until the subscription is. */
const SubscriptionGrantDraftTable: FC<SubscriptionGrantDraftTableProps> = ({ data, onChange, currency, disabled }) => {
	const { t } = useTranslation('catalog');
	const { t: tc } = useTranslation('common');
	const [isOpen, setIsOpen] = useState(false);

	const resetsLabel = (row: SubscriptionGrantDraft) => {
		const unitLabel: Record<string, string> = {
			[ENTITLEMENT_GRANT_DURATION_UNIT.HOUR]: t('entitlements.subscriptionGrants.windowHour'),
			[ENTITLEMENT_GRANT_DURATION_UNIT.DAY]: t('entitlements.subscriptionGrants.windowDay'),
			[ENTITLEMENT_GRANT_DURATION_UNIT.WEEK]: t('entitlements.subscriptionGrants.windowWeek'),
		};
		if (row.grant_duration_unit === ENTITLEMENT_GRANT_DURATION_UNIT.SUBSCRIPTION_PERIOD) {
			return t('entitlements.subscriptionGrants.windowPeriod');
		}
		const label = unitLabel[row.grant_duration_unit] ?? row.grant_duration_unit;
		return (row.grant_duration_value ?? 1) > 1 ? `${label} × ${row.grant_duration_value}` : label;
	};

	const columns: ColumnData<Row>[] = [
		{
			title: t('entitlements.subscriptionGrants.amountColumn'),
			render: (row) => `${getCurrencySymbol(currency)}${row.grant_quota}`,
		},
		{
			title: t('entitlements.subscriptionGrants.windowLabel'),
			render: resetsLabel,
		},
		{
			title: t('entitlements.addDrawer.stackingLabel'),
			render: (row) =>
				row.aggregation_mode === ENTITLEMENT_AGGREGATION_MODE.PARALLEL
					? t('entitlements.addDrawer.stackingParallel')
					: t('entitlements.addDrawer.stackingAdditive'),
		},
		{
			fieldVariant: 'interactive',
			hideOnEmpty: true,
			render: (row) => (
				<button
					type='button'
					aria-label={tc('form.remove')}
					disabled={disabled}
					onClick={() => onChange(data.filter((_, i) => i !== row.index))}
					className='w-8 h-7 flex items-center justify-center rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50'>
					<Trash2 className='size-3.5' />
				</button>
			),
		},
	];

	return (
		<>
			{isOpen && (
				<SubscriptionGrantDialog
					isOpen={isOpen}
					onOpenChange={setIsOpen}
					currency={currency}
					onDraft={(draft) => onChange([...data, draft])}
				/>
			)}
			<div className='space-y-4'>
				<div className='flex items-center justify-between'>
					<FormHeader className='mb-0' title={t('entitlements.subscriptionGrants.sectionTitle')} variant='sub-header' />
					<AddButton onClick={() => setIsOpen(true)} disabled={disabled} />
				</div>
				<div className='rounded-[6px] border border-line-strong'>
					<FlexpriceTable data={data.map((d, index) => ({ ...d, index }))} columns={columns} showEmptyRow />
				</div>
			</div>
		</>
	);
};

export default SubscriptionGrantDraftTable;
