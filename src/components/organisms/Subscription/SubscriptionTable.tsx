import { FC, useMemo, type ReactElement } from 'react';
import { Subscription, SUBSCRIPTION_HIERARCHY_DISPLAY_KIND, SUBSCRIPTION_STATUS, SUBSCRIPTION_TYPE } from '@/models/Subscription';
import { ColumnData, FlexpriceTable } from '@/components/molecules';
import { StatusChip, Tooltip } from '@/components/atoms';
import { formatBillingPeriodForDisplay } from '@/utils/common/helper_functions';
import formatDate from '@/utils/common/format_date';
import SubscriptionActionButton from './SubscriptionActionButton';
import { Info } from 'lucide-react';
import type { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';

export interface SubscriptionTableProps {
	data: Subscription[];
	onRowClick?: (row: Subscription) => void;
	allowRedirect?: boolean;
	subscriptionOverrides?: Map<string, boolean>;
}

function subscriptionHierarchyKind(row: Subscription): SUBSCRIPTION_HIERARCHY_DISPLAY_KIND | null {
	const subType = row.subscription_type?.toLowerCase();
	if (subType === SUBSCRIPTION_TYPE.INHERITED) return SUBSCRIPTION_HIERARCHY_DISPLAY_KIND.INHERITED;
	if (subType === SUBSCRIPTION_TYPE.PARENT) return SUBSCRIPTION_HIERARCHY_DISPLAY_KIND.PARENT;
	if (subType === SUBSCRIPTION_TYPE.GROUPED_INVOICING) return SUBSCRIPTION_HIERARCHY_DISPLAY_KIND.GROUPED_INVOICING;
	if (subType === SUBSCRIPTION_TYPE.DELEGATED_INVOICING) return SUBSCRIPTION_HIERARCHY_DISPLAY_KIND.DELEGATED_INVOICING;
	return null;
}

export const getSubscriptionStatus = (status: string, t: TFunction) => {
	switch (status) {
		case SUBSCRIPTION_STATUS.ACTIVE:
			return <StatusChip status='Active' label={t('common:status.active')} />;
		case SUBSCRIPTION_STATUS.CANCELLED:
			return <StatusChip status='Cancelled' label={t('common:status.cancelled')} />;
		case SUBSCRIPTION_STATUS.INCOMPLETE:
			return <StatusChip status='Pending' label={t('common:status.incomplete')} />;
		case SUBSCRIPTION_STATUS.TRIALING:
			return <StatusChip status='Trial' label={t('common:status.trialing')} />;
		case SUBSCRIPTION_STATUS.DRAFT:
			return <StatusChip status='Draft' label={t('common:status.draft')} />;
		default:
			return <StatusChip status='Inactive' label={t('common:status.inactive')} />;
	}
};

export const formatSubscriptionStatus = (status: string, t: TFunction) => {
	switch (status) {
		case SUBSCRIPTION_STATUS.ACTIVE:
			return t('common:status.active');
		case SUBSCRIPTION_STATUS.CANCELLED:
			return t('common:status.cancelled');
		case SUBSCRIPTION_STATUS.INCOMPLETE:
			return t('common:status.incomplete');
		case SUBSCRIPTION_STATUS.TRIALING:
			return t('common:status.trialing');
		case SUBSCRIPTION_STATUS.DRAFT:
			return t('common:status.draft');
		default:
			return t('common:status.inactive');
	}
};

const SubscriptionTable: FC<SubscriptionTableProps> = ({ data, onRowClick, allowRedirect = true, subscriptionOverrides }): ReactElement => {
	const { t } = useTranslation(['common', 'customers']);
	const showHierarchyColumn = data.some((row) => subscriptionHierarchyKind(row) !== null);

	const columns: ColumnData<Subscription>[] = useMemo(() => {
		const hierarchyColumn: ColumnData<Subscription> = {
			title: t('customers:organisms.subscriptionTable.hierarchyColumn'),
			render: (row) => {
				const kind = subscriptionHierarchyKind(row);
				if (kind === SUBSCRIPTION_HIERARCHY_DISPLAY_KIND.INHERITED) {
					const chip = <StatusChip tone='info' label={t('customers:organisms.subscriptionTable.chipInherited')} />;
					return (
						<Tooltip
							delayDuration={0}
							className='max-w-[20rem] whitespace-normal text-start leading-relaxed'
							content={
								<div className='space-y-1'>
									<div className='font-semibold'>{t('customers:organisms.subscriptionTable.inheritedTitle')}</div>
									<div className='text-sm font-normal opacity-90'>{t('customers:organisms.subscriptionTable.inheritedBody')}</div>
								</div>
							}>
							<span className='inline-flex cursor-default'>{chip}</span>
						</Tooltip>
					);
				}
				if (kind === SUBSCRIPTION_HIERARCHY_DISPLAY_KIND.PARENT) {
					return (
						<Tooltip
							className='max-w-[20rem] whitespace-normal text-start leading-relaxed'
							content={
								<div className='space-y-1'>
									<div className='font-semibold'>{t('customers:organisms.subscriptionTable.parentTitle')}</div>
									<div className='text-sm font-normal opacity-90'>{t('customers:organisms.subscriptionTable.parentBody')}</div>
								</div>
							}
							delayDuration={0}>
							<span className='inline-flex cursor-default'>
								<StatusChip tone='success' label={t('customers:organisms.subscriptionTable.chipParent')} />
							</span>
						</Tooltip>
					);
				}
				if (kind === SUBSCRIPTION_HIERARCHY_DISPLAY_KIND.GROUPED_INVOICING) {
					return (
						<Tooltip
							delayDuration={0}
							className='max-w-[20rem] whitespace-normal text-start leading-relaxed'
							content={
								<div className='space-y-1'>
									<div className='font-semibold'>{t('customers:organisms.subscriptionTable.groupedInvoicingTitle')}</div>
									<div className='text-sm font-normal opacity-90'>{t('customers:organisms.subscriptionTable.groupedInvoicingBody')}</div>
								</div>
							}>
							<span className='inline-flex cursor-default'>
								<StatusChip tone='warning' label={t('customers:organisms.subscriptionTable.chipGrouped')} />
							</span>
						</Tooltip>
					);
				}
				if (kind === SUBSCRIPTION_HIERARCHY_DISPLAY_KIND.DELEGATED_INVOICING) {
					return (
						<Tooltip
							delayDuration={0}
							className='max-w-[20rem] whitespace-normal text-start leading-relaxed'
							content={
								<div className='space-y-1'>
									<div className='font-semibold'>{t('customers:organisms.subscriptionTable.delegatedInvoicingTitle')}</div>
									<div className='text-sm font-normal opacity-90'>{t('customers:organisms.subscriptionTable.delegatedInvoicingBody')}</div>
								</div>
							}>
							<span className='inline-flex cursor-default'>
								<StatusChip tone='info' label={t('customers:organisms.subscriptionTable.chipDelegated')} />
							</span>
						</Tooltip>
					);
				}
				return <span className='text-muted-foreground'>{t('common:labels.na')}</span>;
			},
		};

		return [
			{
				title: 'Plan Name',
				render: (row) => {
					const hasOverride = subscriptionOverrides?.get(row.id);
					const planName = row.plan?.name || row.plan_id || t('common:labels.na');

					return (
						<div className='flex items-center gap-1.5'>
							<span>{planName}</span>
							{hasOverride && (
								<Tooltip content={t('customers:organisms.subscriptionTable.planModifiedAria')} delayDuration={0}>
									<span
										tabIndex={0}
										role='img'
										aria-label={t('customers:organisms.subscriptionTable.planModifiedAria')}
										className='inline-flex cursor-default rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary'>
										<Info className='h-4 w-4 shrink-0 text-muted-foreground hover:text-foreground transition-colors' />
									</span>
								</Tooltip>
							)}
						</div>
					);
				},
			},
			...(showHierarchyColumn ? [hierarchyColumn] : []),
			{
				title: 'Billing Period',
				render: (row) => <span>{formatBillingPeriodForDisplay(row.billing_period)}</span>,
			},
			{
				title: 'Status',
				render: (row) => getSubscriptionStatus(row.subscription_status, t),
			},
			{
				title: 'Start Date',
				render: (row) => <span>{formatDate(row.start_date)}</span>,
			},
			{
				title: 'Renewal Date',
				render: (row) => <span>{formatDate(row.current_period_end)}</span>,
			},
			...(allowRedirect
				? [
						{
							width: '30px',
							fieldVariant: 'interactive' as const,
							hideOnEmpty: true,
							render: (row: Subscription) => <SubscriptionActionButton subscription={row} />,
						},
					]
				: []),
		];
	}, [allowRedirect, showHierarchyColumn, subscriptionOverrides, t]);

	return (
		<FlexpriceTable
			onRowClick={(row) => {
				onRowClick?.(row);
			}}
			columns={columns}
			showEmptyRow
			data={data}
			variant='no-bordered'
		/>
	);
};

export default SubscriptionTable;
