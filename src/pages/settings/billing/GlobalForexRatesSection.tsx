import { type ReactNode, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { ActionButton, AddButton, Card, CardHeader, Loader, ShortPagination, Tooltip } from '@/components/atoms';
import FlexpriceTable, { type ColumnData } from '@/components/molecules/Table';
import ForexRateModal, { type ForexRateFormValues } from '@/components/molecules/ForexRateModal';
import { useCurrentUserPermissions } from '@/hooks/useCurrentUserPermissions';
import usePagination, { PAGINATION_PREFIX } from '@/hooks/usePagination';
import type { FxRate } from '@/models/FxRate';
import { formatDateShort } from '@/utils/common/helper_functions';
import { formatFxPair, formatFxRate } from '@/utils/fx/formatFxRate';
import { FOREX_RATES_PAGE_SIZE } from '../constants';
import { useGlobalForexRates } from './useGlobalForexRates';

const GlobalForexRatesSection = () => {
	const { t } = useTranslation(['settings', 'common']);
	const { can } = useCurrentUserPermissions();
	const canWrite = can('fxrate', 'write');
	const { page, limit, offset } = usePagination({ initialLimit: FOREX_RATES_PAGE_SIZE, prefix: PAGINATION_PREFIX.FOREX_RATES });
	const { rates, total, isLoading, isError, createRate, updateRate } = useGlobalForexRates({ page, limit, offset });

	const [isOpen, setIsOpen] = useState(false);
	const [editing, setEditing] = useState<FxRate | null>(null);

	const editingValues = useMemo<ForexRateFormValues | undefined>(
		() => (editing ? { from_currency: editing.from_currency, to_currency: editing.to_currency, rate: editing.rate } : undefined),
		[editing],
	);

	const open = (rate: FxRate | null) => {
		setEditing(rate);
		setIsOpen(true);
	};

	const handleSave = (values: ForexRateFormValues) => {
		if (editing) {
			updateRate.mutate(
				{ id: editing.id, rate: values.rate },
				{
					onSuccess: () => {
						toast.success(t('billing.forexRates.toast.updated'));
						setIsOpen(false);
					},
					onError: (error) => toast.error(error.message),
				},
			);
			return;
		}
		createRate.mutate(values, {
			onSuccess: () => {
				toast.success(t('billing.forexRates.toast.created'));
				setIsOpen(false);
			},
			onError: (error) => toast.error(error.message),
		});
	};

	const writeGate = (node: ReactNode) =>
		canWrite ? (
			node
		) : (
			<Tooltip content={t('billing.forexRates.writeDeniedTooltip')}>
				<span tabIndex={0} className='inline-block'>
					{node}
				</span>
			</Tooltip>
		);

	const columns: ColumnData<FxRate>[] = [
		{ title: t('billing.forexRates.columns.rate'), render: (row) => formatFxRate(row.from_currency, row.to_currency, row.rate) },
		{ title: t('billing.forexRates.columns.updated'), render: (row) => formatDateShort(row.updated_at) },
		{
			fieldVariant: 'interactive',
			hideOnEmpty: true,
			render: (row) => (
				<ActionButton
					id={row.id}
					entityName={formatFxPair(row.from_currency, row.to_currency)}
					deleteMutationFn={async () => undefined}
					refetchQueryKey='settings'
					edit={{
						enabled: true,
						disabled: !canWrite,
						disabledReason: canWrite ? undefined : t('billing.forexRates.writeDeniedTooltip'),
						onClick: () => open(row),
					}}
					archive={{ enabled: false }}
				/>
			),
		},
	];

	return (
		<Card variant='default' className='rounded-xl border border-line bg-surface shadow-sm'>
			<CardHeader
				title={t('billing.forexRates.title')}
				subtitle={t('billing.forexRates.description')}
				titleClassName='text-lg font-medium text-content-zinc-strong'
				cta={writeGate(
					<AddButton variant='outline' label={t('billing.forexRates.addRate')} disabled={!canWrite} onClick={() => open(null)} />,
				)}
			/>
			{isLoading ? (
				<div className='flex min-h-[160px] items-center justify-center'>
					<Loader />
				</div>
			) : isError ? (
				<p className='text-sm text-destructive'>{t('billing.forexRates.loadError')}</p>
			) : rates.length === 0 ? (
				<p className='py-6 text-sm text-content-zinc-subtle'>{t('billing.forexRates.empty')}</p>
			) : (
				<div className='space-y-4'>
					<FlexpriceTable columns={columns} data={rates} variant='no-bordered' />
					<ShortPagination
						unit={t('billing.forexRates.paginationUnit')}
						totalItems={total}
						pageSize={limit}
						prefix={PAGINATION_PREFIX.FOREX_RATES}
					/>
				</div>
			)}
			<ForexRateModal
				isOpen={isOpen}
				onOpenChange={setIsOpen}
				data={editingValues}
				isSaving={createRate.isPending || updateRate.isPending}
				onSave={handleSave}
			/>
		</Card>
	);
};

export default GlobalForexRatesSection;
