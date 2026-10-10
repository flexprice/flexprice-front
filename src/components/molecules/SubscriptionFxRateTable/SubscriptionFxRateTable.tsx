import { uniqueId } from 'lodash';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActionButton, AddButton, Chip, FormHeader } from '@/components/atoms';
import FlexpriceTable, { type ColumnData } from '@/components/molecules/Table';
import ForexRateModal, { type ForexRateFormValues } from '@/components/molecules/ForexRateModal';
import type { FxRate } from '@/models/FxRate';
import type { SubscriptionFxRateRow } from '@/types/dto/Subscription';
import { formatDateTimeWithSecondsAndTimezone } from '@/utils/common/format_date';
import { formatFxPair, formatFxRate } from '@/utils/fx/formatFxRate';
import { getOverrideStatus, type OverrideStatus } from '@/utils/fx/overrideStatus';

const STATUS_VARIANT: Record<OverrideStatus, 'success' | 'info' | 'default'> = {
	active: 'success',
	scheduled: 'info',
	expired: 'default',
};

interface SubscriptionFxRateTableProps {
	data: SubscriptionFxRateRow[];
	onChange: (rows: SubscriptionFxRateRow[]) => void;
	disabled?: boolean;
	chargeCurrency: string;
	billingCurrency: string;
	/** undefined = not loaded yet, null = no global rate configured. */
	tenantRate?: FxRate | null;
}

const SubscriptionFxRateTable = ({
	data,
	onChange,
	disabled = false,
	chargeCurrency,
	billingCurrency,
	tenantRate,
}: SubscriptionFxRateTableProps) => {
	const { t } = useTranslation(['customers', 'common']);
	const [isOpen, setIsOpen] = useState(false);
	const [editingId, setEditingId] = useState<string | null>(null);

	const editingValues = useMemo<ForexRateFormValues | undefined>(() => {
		const row = data.find((candidate) => candidate.id === editingId);
		if (!row) return undefined;
		return {
			from_currency: chargeCurrency,
			to_currency: billingCurrency,
			rate: row.rate,
			start_date: row.start_date,
			end_date: row.end_date,
		};
	}, [data, editingId, chargeCurrency, billingCurrency]);

	const otherWindows = useMemo(
		() => data.filter((row) => row.id !== editingId).map(({ start_date, end_date }) => ({ start_date, end_date })),
		[data, editingId],
	);

	const open = (id: string | null) => {
		setEditingId(id);
		setIsOpen(true);
	};

	const handleSave = (values: ForexRateFormValues) => {
		const row: SubscriptionFxRateRow = {
			id: editingId ?? uniqueId('fx_rate_row_'),
			rate: values.rate,
			...(values.start_date ? { start_date: values.start_date } : {}),
			...(values.end_date ? { end_date: values.end_date } : {}),
		};
		onChange(editingId ? data.map((existing) => (existing.id === editingId ? row : existing)) : [...data, row]);
		setIsOpen(false);
	};

	const pair = formatFxPair(chargeCurrency, billingCurrency);

	const columns: ColumnData<SubscriptionFxRateRow>[] = [
		{
			title: t('organisms.subscriptionForm.fxOverrides.columns.rate'),
			render: (row) => formatFxRate(chargeCurrency, billingCurrency, row.rate),
		},
		{
			title: t('organisms.subscriptionForm.fxOverrides.columns.validFrom'),
			render: (row) =>
				row.start_date ? formatDateTimeWithSecondsAndTimezone(row.start_date) : t('organisms.subscriptionForm.fxOverrides.always'),
		},
		{
			title: t('organisms.subscriptionForm.fxOverrides.columns.validUntil'),
			render: (row) =>
				row.end_date ? formatDateTimeWithSecondsAndTimezone(row.end_date) : t('organisms.subscriptionForm.fxOverrides.noEnd'),
		},
		{
			title: t('tabPanels.information.fxOverrides.columns.status'),
			render: (row) => {
				const status = getOverrideStatus(row.start_date, row.end_date);
				return <Chip variant={STATUS_VARIANT[status]} label={t(`tabPanels.information.fxOverrides.status.${status}`)} />;
			},
		},
		{
			fieldVariant: 'interactive',
			hideOnEmpty: true,
			render: (row) => (
				<ActionButton
					id={row.id}
					entityName={t('organisms.subscriptionForm.fxOverrides.entityName')}
					deleteMutationFn={async (id) => onChange(data.filter((existing) => existing.id !== id))}
					refetchQueryKey='subscription-fx-rate-rows'
					disableToast
					edit={{ enabled: !disabled, onClick: () => open(row.id) }}
					archive={{ enabled: !disabled, text: t('organisms.subscriptionForm.fxOverrides.remove') }}
				/>
			),
		},
	];

	return (
		<div className='space-y-4'>
			<div className='flex items-center justify-between'>
				<FormHeader className='mb-0' title={t('organisms.subscriptionForm.fxOverrides.title')} variant='sub-header' />
				<AddButton onClick={() => open(null)} disabled={disabled} />
			</div>
			<div className='rounded-[6px] border border-line-strong'>
				<FlexpriceTable data={data} columns={columns} showEmptyRow />
			</div>
			{!disabled && tenantRate === null ? (
				<p className='text-sm text-destructive'>{t('organisms.subscriptionForm.fxOverrides.noGlobalRate', { pair })}</p>
			) : null}
			{!disabled && tenantRate ? (
				<p className='text-xs text-content-zinc-subtle'>
					{t('organisms.subscriptionForm.fxOverrides.hintWithRate', {
						rate: formatFxRate(tenantRate.from_currency, tenantRate.to_currency, tenantRate.rate),
					})}{' '}
					{t('organisms.subscriptionForm.fxOverrides.hintCheckout')}
				</p>
			) : null}
			<ForexRateModal
				isOpen={isOpen}
				onOpenChange={setIsOpen}
				data={editingValues}
				lockedFrom={chargeCurrency}
				lockedTo={billingCurrency}
				showWindow
				allowClearDates
				existingWindows={otherWindows}
				onSave={handleSave}
			/>
		</div>
	);
};

export default SubscriptionFxRateTable;
