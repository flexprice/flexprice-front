import { Card, CardHeader, NoDataCard, Chip, Tooltip } from '@/components/atoms';
import { useTranslation } from 'react-i18next';
import { TFunction } from 'i18next';
import type { SubscriptionCommitmentInfo } from '@/models/Subscription';
import {
	ChargeValueCell,
	ColumnData,
	FlexpriceTable,
	TerminateLineItemModal,
	DropdownMenu,
	AlertSettingsDialog,
} from '@/components/molecules';
import { PriceTooltip } from '@/components/molecules/PriceTooltip';
import { LineItem, SUBSCRIPTION_LINE_ITEM_ENTITY_TYPE } from '@/models/Subscription';
import { ALERT_ENTITY_TYPE } from '@/models/AlertSetting';
import { FC, useState, useCallback, useMemo } from 'react';
import { Trash2, Pencil, Info, Eye, Tag, TicketX, Copy, Bell } from 'lucide-react';
import { ENTITY_STATUS } from '@/models/base';
import {
	copyToClipboard,
	formatBillingPeriodForDisplay,
	getBucketSizeLabel,
	getCurrencySymbol,
	getPriceTypeLabel,
} from '@/utils/common/helper_functions';
import { resolveBucketSize } from '@/utils/common/commitment_helpers';
import { PRICE_ENTITY_TYPE, PRICE_STATUS, PRICE_TYPE } from '@/models/Price';
import { formatDateTimeWithSecondsAndTimezone } from '@/utils/common/format_date';
import LineItemWindowCommitmentViewDialog from '@/components/molecules/Subscription/LineItemWindowCommitmentViewDialog';
import { lineItemHasCommitment } from '@/utils/subscription/subscription_line_item_commitment_helpers';
interface Props {
	data: LineItem[];
	onEdit?: (lineItem: LineItem) => void;
	onTerminate?: (lineItemId: string, endDate?: string) => void;
	isLoading?: boolean;
	hideCardWrapper?: boolean;
	commitmentInfo?: SubscriptionCommitmentInfo;
	/** When true, edit/terminate actions are disabled (e.g. inherited subscription). */
	readOnly?: boolean;
	/** Optional map `subscription_phase_id` → label (enables Phase column). */
	phaseLabelsById?: Record<string, string>;
	/** When false, empty data does not render the built-in NoDataCard (parent handles empty UX). */
	showNoDataCard?: boolean;
	/** Subtitle when `showNoDataCard` renders (e.g. filtered empty vs no rows). */
	noDataSubtitle?: string;
	/** Show per-line-item window commitment buckets (details + edit pages). */
	showCommitmentColumn?: boolean;
	onApplyCoupon?: (lineItem: LineItem) => void;
	onRemoveCoupon?: (lineItem: LineItem) => void;
	/** Set of line item IDs that have an active coupon association — used to conditionally show "Remove coupon" */
	lineItemIdsWithCoupon?: Set<string>;
}

/**
 * Quantity is only meaningful for FIXED charges — USAGE charges are billed
 * from metered consumption, so their quantity column shows "--" instead.
 */
export function getQuantityDisplayForLineItem(row: Pick<LineItem, 'price_type' | 'quantity'>): string {
	if (row.price_type !== PRICE_TYPE.FIXED) return '--';
	return String(row.quantity);
}

interface LineItemWithStatus extends LineItem {
	precomputedStatus: PRICE_STATUS;
	statusVariant: 'info' | 'default' | 'success';
	statusLabel: string;
	tooltipContent: React.ReactNode;
}

interface ViewCommitmentDropdownProps {
	row: LineItem;
	onView: (lineItem: LineItem) => void;
}

const ViewCommitmentDropdown: FC<ViewCommitmentDropdownProps> = ({ row, onView }) => {
	const { t } = useTranslation('billing');
	const [isOpen, setIsOpen] = useState(false);

	if (!lineItemHasCommitment(row)) {
		return null;
	}

	const handleClick = (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setIsOpen(!isOpen);
	};

	return (
		<div data-interactive='true' onClick={handleClick}>
			<DropdownMenu
				isOpen={isOpen}
				onOpenChange={setIsOpen}
				options={[
					{
						label: t('commitmentConfig.viewCommitment', { defaultValue: 'View commitment' }),
						icon: <Eye />,
						onSelect: (e: Event) => {
							e.preventDefault();
							setIsOpen(false);
							onView(row);
						},
					},
				]}
			/>
		</div>
	);
};

interface LineItemDropdownProps {
	row: LineItem;
	isEditDisabled: boolean;
	isTerminateDisabled: boolean;
	onEdit: (lineItem: LineItem) => void;
	onTerminate: (lineItem: LineItem) => void;
	onViewCommitment?: (lineItem: LineItem) => void;
	onApplyCoupon?: (lineItem: LineItem) => void;
	onRemoveCoupon?: (lineItem: LineItem) => void;
	hasLinkedCoupon?: boolean;
}

const LineItemDropdown: FC<LineItemDropdownProps> = ({
	row,
	isEditDisabled,
	isTerminateDisabled,
	onEdit,
	onTerminate,
	onViewCommitment,
	onApplyCoupon,
	onRemoveCoupon,
	hasLinkedCoupon,
}) => {
	const { t } = useTranslation('billing');
	const { t: tCommon } = useTranslation('common');
	const [isOpen, setIsOpen] = useState(false);
	const [showAlertDialog, setShowAlertDialog] = useState(false);
	const showViewCommitment = !!onViewCommitment && lineItemHasCommitment(row);

	const handleClick = (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setIsOpen(!isOpen);
	};

	return (
		<>
			<div data-interactive='true' onClick={handleClick}>
				<DropdownMenu
					isOpen={isOpen}
					onOpenChange={setIsOpen}
					options={[
						{
							label: tCommon('copyId.lineItemId'),
							icon: <Copy />,
							onSelect: (e: Event) => {
								e.preventDefault();
								setIsOpen(false);
								void copyToClipboard(row.id, tCommon('copyId.toastWithType', { type: tCommon('copyId.entityTypes.lineItem') }));
							},
						},
						{
							label: tCommon('copyId.priceId'),
							icon: <Copy />,
							onSelect: (e: Event) => {
								e.preventDefault();
								setIsOpen(false);
								void copyToClipboard(row.price_id, tCommon('copyId.toastWithType', { type: tCommon('copyId.entityTypes.price') }));
							},
							disabled: !row.price_id,
						},
						...(showViewCommitment
							? [
									{
										label: t('commitmentConfig.viewCommitment', { defaultValue: 'View commitment' }),
										icon: <Eye />,
										onSelect: (e: Event) => {
											e.preventDefault();
											setIsOpen(false);
											onViewCommitment?.(row);
										},
									},
								]
							: []),
						{
							label: 'Edit',
							icon: <Pencil />,
							onSelect: (e: Event) => {
								e.preventDefault();
								setIsOpen(false);
								onEdit(row);
							},
							disabled: isEditDisabled,
						},
						{
							label: 'Alert Settings',
							icon: <Bell />,
							onSelect: (e: Event) => {
								e.preventDefault();
								setIsOpen(false);
								setShowAlertDialog(true);
							},
						},
						{
							label: 'Terminate',
							icon: <Trash2 />,
							onSelect: (e: Event) => {
								e.preventDefault();
								setIsOpen(false);
								onTerminate(row);
							},
							disabled: isTerminateDisabled,
						},
						...(onApplyCoupon && !hasLinkedCoupon
							? [
									{
										label: 'Apply coupon',
										icon: <Tag />,
										onSelect: (e: Event) => {
											e.preventDefault();
											setIsOpen(false);
											onApplyCoupon(row);
										},
									},
								]
							: []),
						...(onRemoveCoupon && hasLinkedCoupon
							? [
									{
										label: 'Remove coupon',
										icon: <TicketX />,
										onSelect: (e: Event) => {
											e.preventDefault();
											setIsOpen(false);
											onRemoveCoupon(row);
										},
									},
								]
							: []),
					]}
				/>
			</div>
			<AlertSettingsDialog
				open={showAlertDialog}
				onClose={() => setShowAlertDialog(false)}
				entityType={ALERT_ENTITY_TYPE.SUBSCRIPTION_LINE_ITEM}
				entityId={row.id}
				parentEntityId={row.subscription_id}
			/>
		</>
	);
};

const getLineItemStatus = (lineItem: LineItem): PRICE_STATUS => {
	const now = new Date();
	const defaultEndDate = '0001-01-01T00:00:00Z';

	if (lineItem.start_date && lineItem.start_date.trim() !== '') {
		const startDate = new Date(lineItem.start_date);
		if (!isNaN(startDate.getTime()) && startDate > now) {
			return PRICE_STATUS.UPCOMING;
		}
	}

	if (lineItem.end_date && lineItem.end_date.trim() !== '' && lineItem.end_date !== defaultEndDate) {
		const endDate = new Date(lineItem.end_date);
		if (!isNaN(endDate.getTime()) && endDate < now) {
			return PRICE_STATUS.INACTIVE;
		}
	}

	return PRICE_STATUS.ACTIVE;
};

const getEntityLabel = (entityType?: string): string => {
	if (!entityType) return '--';
	switch (entityType.toLowerCase()) {
		case SUBSCRIPTION_LINE_ITEM_ENTITY_TYPE.PLAN:
			return 'Plan';
		case SUBSCRIPTION_LINE_ITEM_ENTITY_TYPE.ADDON:
			return 'Addon';
		case SUBSCRIPTION_LINE_ITEM_ENTITY_TYPE.SUBSCRIPTION:
			return 'Subscription';
		default:
			return entityType;
	}
};

type EntityChipVariant = 'default' | 'info' | 'success' | 'warning';

const getEntityChipVariant = (entityType?: string): EntityChipVariant => {
	if (!entityType) return 'default';
	switch (entityType.toLowerCase()) {
		case SUBSCRIPTION_LINE_ITEM_ENTITY_TYPE.PLAN:
			return 'info';
		case SUBSCRIPTION_LINE_ITEM_ENTITY_TYPE.SUBSCRIPTION:
			return 'success';
		case SUBSCRIPTION_LINE_ITEM_ENTITY_TYPE.ADDON:
			return 'warning';
		default:
			return 'default';
	}
};

const getStatusChipVariant = (status: PRICE_STATUS): 'info' | 'default' | 'success' => {
	switch (status) {
		case PRICE_STATUS.UPCOMING:
			return 'info';
		case PRICE_STATUS.INACTIVE:
			return 'default';
		case PRICE_STATUS.ACTIVE:
			return 'success';
		default:
			return 'success';
	}
};

const formatLineItemDateTooltip = (lineItem: LineItem, t: TFunction): React.ReactNode => {
	const dateItems: React.ReactNode[] = [];
	const defaultEndDate = '0001-01-01T00:00:00Z';

	if (lineItem.start_date && lineItem.start_date.trim() !== '') {
		try {
			const startDate = new Date(lineItem.start_date);
			if (!isNaN(startDate.getTime())) {
				dateItems.push(
					<div key='start' className='flex items-center gap-2'>
						<span className='text-xs font-medium text-content-muted'>{t('labels.start')}</span>
						<span className='text-sm font-medium'>{formatDateTimeWithSecondsAndTimezone(startDate)}</span>
					</div>,
				);
			}
		} catch {
			// Ignore invalid dates
		}
	}

	if (lineItem.end_date && lineItem.end_date.trim() !== '' && lineItem.end_date !== defaultEndDate) {
		try {
			const endDate = new Date(lineItem.end_date);
			if (!isNaN(endDate.getTime())) {
				dateItems.push(
					<div key='end' className='flex items-center gap-2'>
						<span className='text-xs font-medium text-content-muted'>{t('labels.end')}</span>
						<span className='text-sm font-medium'>{formatDateTimeWithSecondsAndTimezone(endDate)}</span>
					</div>,
				);
			}
		} catch {
			// Ignore invalid dates
		}
	}

	if (dateItems.length === 0) {
		return <span className='text-sm'>{t('labels.noDateInformation')}</span>;
	}

	return <div className='flex flex-col gap-2'>{dateItems}</div>;
};

// Show icon only on USAGE line items when subscription has enable_true_up = true
const shouldShowCommitmentIcon = (lineItem: LineItem, commitmentInfo?: SubscriptionCommitmentInfo): boolean => {
	return commitmentInfo?.enable_true_up === true && lineItem.price_type?.toUpperCase() === 'USAGE';
};

const formatCommitmentTooltip = (info: SubscriptionCommitmentInfo, t: TFunction): React.ReactNode => {
	const rows: React.ReactNode[] = [];

	if (info.commitment_amount != null) {
		rows.push(
			<div key='amount' className='flex items-center gap-2'>
				{t('labels.commitmentAmount')}
				<span className='text-sm font-medium'>{`${getCurrencySymbol(info.currency ?? '')}${info.commitment_amount}`}</span>
			</div>,
		);
	}
	if (info.overage_factor != null) {
		rows.push(
			<div key='overage' className='flex items-center gap-2'>
				{t('labels.overageFactor')}
				<span className='text-sm font-medium'>{info.overage_factor}×</span>
			</div>,
		);
	}
	if (info.enable_true_up != null) {
		rows.push(
			<div key='trueup' className='flex items-center gap-2'>
				{t('labels.trueUp')}
				<span className='text-sm font-medium'>{info.enable_true_up ? t('labels.enabled') : t('labels.disabled')}</span>
			</div>,
		);
	}
	if (info.commitment_duration) {
		rows.push(
			<div key='duration' className='flex items-center gap-2'>
				{t('labels.duration')}
				<span className='text-sm font-medium capitalize'>{info.commitment_duration.toLowerCase()}</span>
			</div>,
		);
	}

	return <div className='flex flex-col gap-2'>{rows}</div>;
};

const SubscriptionLineItemTable: FC<Props> = ({
	data,
	onEdit,
	onTerminate,
	isLoading,
	hideCardWrapper = false,
	commitmentInfo,
	readOnly = false,
	phaseLabelsById,
	showNoDataCard = true,
	noDataSubtitle,
	showCommitmentColumn = false,
	onApplyCoupon,
	onRemoveCoupon,
	lineItemIdsWithCoupon,
}) => {
	const { t } = useTranslation('common');
	const [showTerminateModal, setShowTerminateModal] = useState(false);
	const [selectedLineItem, setSelectedLineItem] = useState<LineItem | null>(null);
	const [viewCommitmentLineItem, setViewCommitmentLineItem] = useState<LineItem | null>(null);

	const handleEditClick = useCallback(
		(lineItem: LineItem) => {
			onEdit?.(lineItem);
		},
		[onEdit],
	);

	const handleTerminateClick = useCallback((lineItem: LineItem) => {
		setSelectedLineItem(lineItem);
		setShowTerminateModal(true);
	}, []);

	const handleTerminateConfirm = (endDate: string | undefined) => {
		if (selectedLineItem) onTerminate?.(selectedLineItem.id, endDate);
		setShowTerminateModal(false);
		setSelectedLineItem(null);
	};

	const handleTerminateCancel = () => {
		setShowTerminateModal(false);
		setSelectedLineItem(null);
	};

	const handleDialogChange = (open: boolean) => {
		if (!open) {
			setShowTerminateModal(false);
			setSelectedLineItem(null);
		}
	};

	const processedLineItems = useMemo<LineItemWithStatus[]>(() => {
		if (!data || data.length === 0) return [];

		const lineItemsWithStatus: LineItemWithStatus[] = data.map((lineItem) => {
			const status = getLineItemStatus(lineItem);
			return {
				...lineItem,
				precomputedStatus: status,
				statusVariant: getStatusChipVariant(status),
				statusLabel: status.charAt(0).toUpperCase() + status.slice(1),
				tooltipContent: formatLineItemDateTooltip(lineItem, t),
			};
		});

		const statusOrder: Record<PRICE_STATUS, number> = {
			[PRICE_STATUS.ACTIVE]: 0,
			[PRICE_STATUS.UPCOMING]: 1,
			[PRICE_STATUS.INACTIVE]: 2,
		};

		return lineItemsWithStatus.sort((a, b) => statusOrder[a.precomputedStatus] - statusOrder[b.precomputedStatus]);
	}, [data, t]);

	const hasMultipleEntityTypes = useMemo(() => {
		if (!data?.length) return false;
		const types = new Set(data.map((item) => (item.entity_type ?? '').toLowerCase()).filter(Boolean));
		return types.size > 1;
	}, [data]);

	const columns: ColumnData<LineItemWithStatus>[] = useMemo(
		() => [
			{
				title: 'Display Name',
				render: (row: LineItemWithStatus) => {
					const displayName = row.display_name?.trim() || '--';
					return (
						<div className='flex min-w-0 max-w-[240px] items-center gap-1'>
							{displayName === '--' ? (
								<span className='truncate'>{displayName}</span>
							) : (
								<Tooltip
									content={displayName}
									delayDuration={0}
									sideOffset={5}
									className='bg-surface border border-line shadow-lg text-sm text-content px-4 py-3 rounded-[6px] max-w-[320px]'>
									<span className='block min-w-0 truncate'>{displayName}</span>
								</Tooltip>
							)}
							{shouldShowCommitmentIcon(row, commitmentInfo) && (
								<Tooltip
									content={formatCommitmentTooltip(commitmentInfo!, t)}
									delayDuration={0}
									sideOffset={5}
									className='bg-surface border border-line shadow-lg text-sm text-content px-4 py-3 rounded-[6px] max-w-[320px]'>
									<button
										type='button'
										data-interactive='true'
										className='inline-flex items-center rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-info-bright'>
										<Info className='h-4 w-4 text-info-bright flex-shrink-0' />
									</button>
								</Tooltip>
							)}
						</div>
					);
				},
			},
			...(phaseLabelsById && Object.keys(phaseLabelsById).length > 0
				? [
						{
							title: 'Phase',
							render: (row: LineItemWithStatus) => (
								<span className='text-sm text-content-secondary'>
									{(row.subscription_phase_id && phaseLabelsById[row.subscription_phase_id]) ?? '—'}
								</span>
							),
						},
					]
				: []),
			{
				title: 'Price Type',
				render: (row) => <span>{getPriceTypeLabel(row.price_type)}</span>,
			},
			{
				title: 'Billing Period',
				render: (row) => formatBillingPeriodForDisplay(row.billing_period),
			},
			{
				title: 'Bucket Size',
				render: (row) => {
					const label = getBucketSizeLabel(resolveBucketSize(row.price));
					return label ? <Chip label={label} variant='default' /> : <span className='text-content-muted'>{t('labels.na')}</span>;
				},
			},
			...(hasMultipleEntityTypes
				? [
						{
							title: 'Source',
							render: (row: LineItemWithStatus) => (
								<Chip label={getEntityLabel(row.entity_type)} variant={getEntityChipVariant(row.entity_type)} />
							),
						},
					]
				: []),
			{
				title: 'Status',
				render(rowData) {
					return (
						<Tooltip
							content={rowData.tooltipContent}
							delayDuration={0}
							sideOffset={5}
							className='bg-surface border border-line shadow-lg text-sm text-content px-4 py-3 rounded-[6px] max-w-[320px]'>
							<span>
								<Chip label={rowData.statusLabel} variant={rowData.statusVariant} />
							</span>
						</Tooltip>
					);
				},
			},
			{
				title: 'Quantity',
				render: (row) => <span>{getQuantityDisplayForLineItem(row)}</span>,
			},
			{
				title: 'Charge',
				render: (row) => {
					if (!row.price) return '--';
					const isSubscriptionOverride =
						row.price.entity_type === PRICE_ENTITY_TYPE.SUBSCRIPTION && row.entity_type === SUBSCRIPTION_LINE_ITEM_ENTITY_TYPE.PLAN;
					return (
						<div className='flex items-center gap-2'>
							<ChargeValueCell data={row.price} />
							{isSubscriptionOverride && <PriceTooltip data={row.price} isSubscriptionOverride={true} />}
						</div>
					);
				},
			},
			...(readOnly
				? [
						{
							fieldVariant: 'interactive' as const,
							width: '48px',
							hideOnEmpty: true,
							render: (row: LineItemWithStatus) => {
								return <ViewCommitmentDropdown row={row} onView={setViewCommitmentLineItem} />;
							},
						},
					]
				: [
						{
							fieldVariant: 'interactive' as const,
							width: '48px',
							hideOnEmpty: true,
							render: (row: LineItemWithStatus) => {
								const isArchived = row.status === ENTITY_STATUS.ARCHIVED;
								const defaultEndDate = '0001-01-01T00:00:00Z';
								const hasEndDate = !!(row.end_date && row.end_date.trim() !== '' && row.end_date !== defaultEndDate);
								const isTerminateDisabled = isArchived || hasEndDate;
								const isEditDisabled = isArchived || hasEndDate;

								return (
									<LineItemDropdown
										row={row}
										isEditDisabled={isEditDisabled}
										isTerminateDisabled={isTerminateDisabled}
										onEdit={handleEditClick}
										onTerminate={handleTerminateClick}
										onViewCommitment={setViewCommitmentLineItem}
										onApplyCoupon={onApplyCoupon}
										onRemoveCoupon={onRemoveCoupon}
										hasLinkedCoupon={lineItemIdsWithCoupon?.has(row.id)}
									/>
								);
							},
						},
					]),
		],
		[
			hasMultipleEntityTypes,
			commitmentInfo,
			handleEditClick,
			handleTerminateClick,
			readOnly,
			phaseLabelsById,
			showCommitmentColumn,
			t,
			onApplyCoupon,
			onRemoveCoupon,
			lineItemIdsWithCoupon,
		],
	);

	if (isLoading) {
		if (hideCardWrapper) {
			return (
				<div className='p-4'>
					<div className='animate-pulse space-y-4'>
						<div className='h-4 bg-surface-strong rounded w-3/4'></div>
						<div className='h-4 bg-surface-strong rounded w-1/2'></div>
						<div className='h-4 bg-surface-strong rounded w-5/6'></div>
					</div>
				</div>
			);
		}
		return (
			<Card variant='notched'>
				<CardHeader title={t('labels.subscriptionLineItems')} />
				<div className='p-4'>
					<div className='animate-pulse space-y-4'>
						<div className='h-4 bg-surface-strong rounded w-3/4'></div>
						<div className='h-4 bg-surface-strong rounded w-1/2'></div>
						<div className='h-4 bg-surface-strong rounded w-5/6'></div>
					</div>
				</div>
			</Card>
		);
	}

	if ((!processedLineItems || processedLineItems.length === 0) && showNoDataCard) {
		return <NoDataCard title={t('labels.charges')} subtitle={noDataSubtitle ?? t('labels.noChargesFound')} />;
	}

	const isEmpty = !processedLineItems || processedLineItems.length === 0;

	return (
		<>
			{selectedLineItem && (
				<TerminateLineItemModal
					isOpen={showTerminateModal}
					onOpenChange={handleDialogChange}
					onCancel={handleTerminateCancel}
					onConfirm={handleTerminateConfirm}
					isLoading={isLoading}
				/>
			)}

			{viewCommitmentLineItem && (
				<LineItemWindowCommitmentViewDialog
					isOpen={!!viewCommitmentLineItem}
					onOpenChange={(open) => !open && setViewCommitmentLineItem(null)}
					lineItem={viewCommitmentLineItem}
				/>
			)}

			{hideCardWrapper ? (
				<FlexpriceTable
					showEmptyRow={isEmpty}
					data={processedLineItems ?? []}
					columns={columns}
					variant='no-bordered'
					tableClassName='table-fixed'
				/>
			) : (
				<Card variant='notched'>
					<CardHeader title={t('labels.charges')} />
					<FlexpriceTable
						showEmptyRow={isEmpty}
						data={processedLineItems ?? []}
						columns={columns}
						variant='no-bordered'
						tableClassName='table-fixed'
					/>
				</Card>
			)}
		</>
	);
};

export default SubscriptionLineItemTable;
