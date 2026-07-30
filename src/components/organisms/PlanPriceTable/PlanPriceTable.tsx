import React, { FC, useCallback, useState, useMemo, useEffect } from 'react';
import { Button, Card, CardHeader, Chip, Tooltip, Loader } from '@/components/atoms';
import {
	FlexpriceTable,
	ColumnData,
	DropdownMenu,
	TerminatePriceModal,
	UpdatePriceDialog,
	UpdatePriceDetailsDrawer,
	QueryBuilder,
} from '@/components/molecules';
import { Price, Plan, PRICE_STATUS, PRICE_ENTITY_TYPE, PRICE_TYPE, INVOICE_CADENCE } from '@/models';
import { PriceUnit } from '@/models/PriceUnit';
import { Plus, Trash2, Pencil, FileText, Copy } from 'lucide-react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { PriceApi } from '@/api/PriceApi';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router';
import { RouteNames } from '@/core/routes/Routes';
import { BILLING_PERIOD } from '@/constants/constants';
import { ChargeValueCell } from '@/components/molecules';
import { Dialog } from '@/components/ui';
import { DeletePriceRequest } from '@/types/dto';
import { formatDateTimeWithSecondsAndTimezone } from '@/utils/common/format_date';
import useFilterSorting from '@/hooks/useFilterSorting';
import { FilterField, FilterFieldType, FilterOperator, DataType, SortDirection, FilterCondition } from '@/types/common/QueryBuilder';
import { sanitizeFilterConditions, sanitizeSortConditions } from '@/types/formatters/QueryBuilder';
import usePagination, { PAGINATION_PREFIX } from '@/hooks/usePagination';
import { ShortPagination } from '@/components/atoms';
import type { SearchPricesResponse } from '@/types/dto';
import type { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';

// ===== FILTER FIELD NAMES (no hardcoded strings in logic) =====
const CHARGE_FILTER_FIELD = {
	DISPLAY_NAME: 'display_name',
	AMOUNT: 'amount',
	CHARGE_TYPE: 'charge_type',
	CURRENCY: 'currency',
	BILLING_PERIOD: 'billing_period',
} as const;

const PLAN_CHARGES_PAGE_SIZE = 10;

// ===== TYPES & CONSTANTS =====

interface PlanChargesTableProps {
	plan: Plan;
	onPriceUpdate?: () => void;
}

interface PriceDropdownProps {
	row: Price;
	hasEndDate: boolean;
	onEditPrice: (price: Price) => void;
	onEditDetails: (price: Price) => void;
	onTerminatePrice: (price: Price) => void;
}

const PriceDropdown: FC<PriceDropdownProps> = ({ row, hasEndDate, onEditPrice, onEditDetails, onTerminatePrice }) => {
	const [isOpen, setIsOpen] = useState(false);

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
						label: 'Copy Price ID',
						icon: <Copy />,
						onSelect: (e: Event) => {
							e.preventDefault();
							setIsOpen(false);
							navigator.clipboard.writeText(row.id);
							toast.success('Price ID copied to clipboard');
						},
					},
					{
						label: 'Update Price',
						icon: <Pencil />,
						onSelect: (e: Event) => {
							e.preventDefault();
							setIsOpen(false);
							onEditPrice(row);
						},
						disabled: hasEndDate,
					},
					{
						label: 'Edit Details',
						icon: <FileText />,
						onSelect: (e: Event) => {
							e.preventDefault();
							setIsOpen(false);
							onEditDetails(row);
						},
						disabled: hasEndDate,
					},
					{
						label: 'Terminate Price',
						icon: <Trash2 />,
						onSelect: (e: Event) => {
							e.preventDefault();
							setIsOpen(false);
							onTerminatePrice(row);
						},
						disabled: hasEndDate,
					},
				]}
			/>
		</div>
	);
};

const formatBillingPeriod = (billingPeriod: string) => {
	switch (billingPeriod.toUpperCase()) {
		case BILLING_PERIOD.DAILY:
			return 'Daily';
		case BILLING_PERIOD.WEEKLY:
			return 'Weekly';
		case BILLING_PERIOD.MONTHLY:
			return 'Monthly';
		case BILLING_PERIOD.ANNUAL:
			return 'Yearly';
		case BILLING_PERIOD.QUARTERLY:
			return 'Quarterly';
		case BILLING_PERIOD.HALF_YEARLY:
			return 'Half Yearly';
		case BILLING_PERIOD.ONETIME:
			return 'One-time';
		default:
			return '--';
	}
};

const getPriceStatus = (price: Price): PRICE_STATUS => {
	const now = new Date();

	// Check if start_date is in the future
	if (price.start_date && price.start_date.trim() !== '') {
		const startDate = new Date(price.start_date);
		// Check if date is valid (not NaN)
		if (!isNaN(startDate.getTime()) && startDate > now) {
			return PRICE_STATUS.UPCOMING;
		}
	}

	// Check if end_date is in the past
	if (price.end_date && price.end_date.trim() !== '') {
		const endDate = new Date(price.end_date);
		// Check if date is valid (not NaN)
		if (!isNaN(endDate.getTime()) && endDate < now) {
			return PRICE_STATUS.INACTIVE;
		}
	}

	// Default to active
	return PRICE_STATUS.ACTIVE;
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

const formatPriceDateTooltip = (price: Price & { start_date?: string; end_date?: string }, t: TFunction): React.ReactNode => {
	const dateItems: React.ReactNode[] = [];

	if (price.start_date && price.start_date.trim() !== '') {
		try {
			const startDate = new Date(price.start_date);
			if (!isNaN(startDate.getTime())) {
				dateItems.push(
					<div key='start' className='flex items-center gap-2'>
						<span className='text-xs font-medium text-gray-500'>{t('catalog:plans.organisms.planPriceTable.start')}</span>
						<span className='text-sm font-medium'>{formatDateTimeWithSecondsAndTimezone(startDate)}</span>
					</div>,
				);
			}
		} catch {
			// Ignore invalid dates
		}
	}

	if (price.end_date && price.end_date.trim() !== '') {
		try {
			const endDate = new Date(price.end_date);
			if (!isNaN(endDate.getTime())) {
				dateItems.push(
					<div key='end' className='flex items-center gap-2'>
						<span className='text-xs font-medium text-gray-500'>{t('catalog:plans.organisms.planPriceTable.end')}</span>
						<span className='text-sm font-medium'>{formatDateTimeWithSecondsAndTimezone(endDate)}</span>
					</div>,
				);
			}
		} catch {
			// Ignore invalid dates
		}
	}

	if (dateItems.length === 0) {
		return <span className='text-sm'>{t('catalog:plans.organisms.planPriceTable.noDateInformation')}</span>;
	}

	return <div className='flex flex-col gap-2'>{dateItems}</div>;
};

const chargeFilterOptions: FilterField[] = [
	{
		field: CHARGE_FILTER_FIELD.DISPLAY_NAME,
		label: 'Display name',
		fieldType: FilterFieldType.INPUT,
		operators: [FilterOperator.EQUAL, FilterOperator.CONTAINS],
		dataType: DataType.STRING,
	},
	{
		field: CHARGE_FILTER_FIELD.AMOUNT,
		label: 'Amount',
		fieldType: FilterFieldType.INPUT,
		operators: [FilterOperator.EQUAL, FilterOperator.GREATER_THAN, FilterOperator.LESS_THAN],
		dataType: DataType.NUMBER,
	},
];

const chargeSortOptions = [
	{ field: CHARGE_FILTER_FIELD.DISPLAY_NAME, label: 'Display name', direction: SortDirection.ASC as const },
	{ field: CHARGE_FILTER_FIELD.AMOUNT, label: 'Amount', direction: SortDirection.ASC as const },
	{ field: CHARGE_FILTER_FIELD.BILLING_PERIOD, label: 'Billing period', direction: SortDirection.ASC as const },
];

const PlanPriceTable: FC<PlanChargesTableProps> = ({ plan, onPriceUpdate }) => {
	const { t } = useTranslation(['catalog', 'common']);
	const navigate = useNavigate();
	const [showTerminateModal, setShowTerminateModal] = useState(false);
	const [selectedPriceForTermination, setSelectedPriceForTermination] = useState<Price | null>(null);
	const [selectedPriceForEdit, setSelectedPriceForEdit] = useState<Price | null>(null);
	const [isPriceDialogOpen, setIsPriceDialogOpen] = useState(false);
	const [selectedPriceForDetailsEdit, setSelectedPriceForDetailsEdit] = useState<Price | null>(null);
	const [isDetailsDrawerOpen, setIsDetailsDrawerOpen] = useState(false);

	// ===== MUTATIONS =====
	const { mutateAsync: deletePrice, isPending: isDeletingPrice } = useMutation({
		mutationFn: async ({ priceId, data }: { priceId: string; data?: DeletePriceRequest }) => {
			return await PriceApi.DeletePrice(priceId, data);
		},
		onError: (error: Error) => {
			toast.error(error.message || 'Error deleting price');
		},
	});

	const isPending = isDeletingPrice;

	// ===== HANDLERS =====
	const handleEditPrice = useCallback((price: Price) => {
		setSelectedPriceForEdit(price);
		setIsPriceDialogOpen(true);
	}, []);

	const handleEditDetails = useCallback((price: Price) => {
		setSelectedPriceForDetailsEdit(price);
		setIsDetailsDrawerOpen(true);
	}, []);

	const handlePriceUpdateSuccess = useCallback(() => {
		setIsPriceDialogOpen(false);
		setSelectedPriceForEdit(null);
		onPriceUpdate?.();
	}, [onPriceUpdate]);

	const handleTerminatePrice = useCallback((price: Price) => {
		setSelectedPriceForTermination(price);
		setShowTerminateModal(true);
	}, []);

	const handleTerminateConfirm = useCallback(
		async (endDate: string | undefined) => {
			if (!selectedPriceForTermination) return;

			setShowTerminateModal(false);

			try {
				const deleteRequest: DeletePriceRequest | undefined = endDate ? { end_date: endDate } : undefined;
				await deletePrice({ priceId: selectedPriceForTermination.id, data: deleteRequest });

				const priceName = selectedPriceForTermination.meter?.name || selectedPriceForTermination.description || 'Price';
				const message = endDate
					? `${priceName} will be terminated on ${formatDateTimeWithSecondsAndTimezone(new Date(endDate))}.`
					: `${priceName} has been terminated immediately.`;
				toast.success(message);

				onPriceUpdate?.();
				setSelectedPriceForTermination(null);
			} catch (error) {
				console.error('Error terminating price:', error);
			}
		},
		[selectedPriceForTermination, deletePrice, onPriceUpdate],
	);

	const handleTerminateCancel = useCallback(() => {
		setShowTerminateModal(false);
		setSelectedPriceForTermination(null);
	}, []);

	// ===== FILTER & SORT =====
	const initialFilters = useMemo<FilterCondition[]>(
		() => [
			{
				id: 'plan-display_name',
				field: CHARGE_FILTER_FIELD.DISPLAY_NAME,
				operator: FilterOperator.CONTAINS,
				valueString: '',
				dataType: DataType.STRING,
			},
			{ id: 'plan-amount', field: CHARGE_FILTER_FIELD.AMOUNT, operator: FilterOperator.EQUAL, valueString: '', dataType: DataType.NUMBER },
		],
		[],
	);
	const initialSorts = useMemo(() => [{ field: CHARGE_FILTER_FIELD.AMOUNT, label: 'Amount', direction: SortDirection.ASC }], []);

	const { filters, sorts, setFilters, setSorts } = useFilterSorting({
		initialFilters,
		initialSorts,
		debounceTime: 300,
	});

	const {
		page,
		limit,
		offset,
		reset: resetPage,
	} = usePagination({
		initialLimit: PLAN_CHARGES_PAGE_SIZE,
		prefix: PAGINATION_PREFIX.PLAN_CHARGES,
	});

	const searchFilters = useMemo(() => sanitizeFilterConditions(filters), [filters]);
	const searchSorts = useMemo(() => sanitizeSortConditions(sorts), [sorts]);

	// Stable signature so we only reset page when filter values change, not when resetPage reference changes (e.g. after setPage(2))
	const searchFiltersSignature = useMemo(() => JSON.stringify(searchFilters), [searchFilters]);

	const { data: searchData, isLoading: isSearchLoading } = useQuery<SearchPricesResponse>({
		queryKey: ['planChargesSearch', plan.id, searchFilters, searchSorts, page, limit],
		queryFn: () =>
			PriceApi.searchPrices({
				entity_ids: [plan.id],
				entity_type: PRICE_ENTITY_TYPE.PLAN,
				filters: searchFilters.length > 0 ? searchFilters : undefined,
				sorts: searchSorts.length > 0 ? searchSorts : undefined,
				allow_expired_prices: true,
				limit,
				offset,
			}),
		enabled: !!plan.id, // Only fetch if prices not provided externally
	});

	const resetPageRef = React.useRef(resetPage);
	resetPageRef.current = resetPage;
	useEffect(() => {
		resetPageRef.current();
	}, [searchFiltersSignature]);

	// Use search API response directly (no client-side filter/sort)
	const tableItems = searchData?.items || [];
	const totalFromSearch = searchData?.pagination?.total ?? 0;
	const totalItems = totalFromSearch || Math.max(offset + tableItems.length, limit * page);

	// ===== TABLE COLUMNS =====
	const chargeColumns: ColumnData<Price>[] = useMemo(
		() => [
			{
				title: 'Display Name',
				render: (row) => <span>{row.display_name ?? t('catalog:plans.organisms.planPriceTable.fallbackName')}</span>,
			},
			{
				title: 'Charge Type & Timing',
				render: (row) => {
					const isFixedCharge = row.type === PRICE_TYPE.FIXED;
					const isUsageCharge = row.type === PRICE_TYPE.USAGE;

					if (isFixedCharge) {
						// For fixed charges: show [Recurring] [Advance/Arrear]
						const isAdvance = row.invoice_cadence === INVOICE_CADENCE.ADVANCE;
						const billingTimingKey = isAdvance ? 'advance' : 'arrear';
						return (
							<div className='flex gap-2'>
								<Tooltip
									content={t('catalog:plans.organisms.planPriceTable.chargeTypeTooltips.fixedRecurring')}
									delayDuration={0}
									sideOffset={5}>
									<span>
										<Chip label={t('catalog:plans.organisms.planPriceTable.recurring')} variant='default' />
									</span>
								</Tooltip>
								<Tooltip
									content={t(`catalog:plans.organisms.planPriceTable.chargeTypeTooltips.${billingTimingKey}`)}
									delayDuration={0}
									sideOffset={5}>
									<span>
										<Chip
											label={t(`catalog:plans.organisms.planPriceTable.${billingTimingKey}`)}
											variant={isAdvance ? 'success' : 'warning'}
										/>
									</span>
								</Tooltip>
							</div>
						);
					}

					if (isUsageCharge) {
						// For usage charges: show [Usage Based] only
						return (
							<Tooltip content={t('catalog:plans.organisms.planPriceTable.chargeTypeTooltips.usageBased')} delayDuration={0} sideOffset={5}>
								<span>
									<Chip label={t('catalog:plans.organisms.planPriceTable.usageBased')} variant='info' />
								</span>
							</Tooltip>
						);
					}

					// Fallback
					return <span>{t('catalog:plans.organisms.planPriceTable.notAvailable')}</span>;
				},
			},
			{
				title: 'Billing Period',
				render: (row) => <span>{formatBillingPeriod(row.billing_period as string)}</span>,
			},
			{
				title: 'Status',
				render: (row) => {
					const status = getPriceStatus(row);
					const variant = getStatusChipVariant(status);
					const label = status.charAt(0).toUpperCase() + status.slice(1);
					const tooltipContent = formatPriceDateTooltip(row, t);
					return (
						<Tooltip
							content={tooltipContent}
							delayDuration={0}
							sideOffset={5}
							className='bg-white border border-gray-200 shadow-lg text-sm text-gray-900 px-4 py-3 rounded-[6px] max-w-[320px]'>
							<span>
								<Chip label={label} variant={variant} />
							</span>
						</Tooltip>
					);
				},
			},
			{
				title: 'Value',
				render: (row) => {
					const priceWithPricingUnit = row as Price & { pricing_unit?: PriceUnit };
					return <ChargeValueCell data={priceWithPricingUnit} />;
				},
			},
			{
				fieldVariant: 'interactive',
				width: '30px',
				hideOnEmpty: true,
				render: (row) => {
					const hasEndDate = !!(row.end_date && row.end_date.trim() !== '');
					return (
						<PriceDropdown
							row={row}
							hasEndDate={hasEndDate}
							onEditPrice={handleEditPrice}
							onEditDetails={handleEditDetails}
							onTerminatePrice={handleTerminatePrice}
						/>
					);
				},
			},
		],
		[t, handleEditPrice, handleEditDetails, handleTerminatePrice],
	);

	// ===== RENDER =====
	return (
		<>
			{/* Terminate Price Modal */}
			<Dialog open={showTerminateModal} onOpenChange={setShowTerminateModal}>
				{selectedPriceForTermination && (
					<TerminatePriceModal
						planId={plan.id}
						price={selectedPriceForTermination}
						onCancel={handleTerminateCancel}
						onConfirm={handleTerminateConfirm}
						isLoading={isPending}
					/>
				)}
			</Dialog>

			{/* Update Price Dialog */}
			{selectedPriceForEdit && (
				<UpdatePriceDialog
					isOpen={isPriceDialogOpen}
					onOpenChange={setIsPriceDialogOpen}
					price={selectedPriceForEdit}
					planId={plan.id}
					onSuccess={handlePriceUpdateSuccess}
				/>
			)}

			{/* Update Price Details Drawer */}
			{selectedPriceForDetailsEdit && (
				<UpdatePriceDetailsDrawer
					price={selectedPriceForDetailsEdit}
					open={isDetailsDrawerOpen}
					onOpenChange={setIsDetailsDrawerOpen}
					refetchQueryKeys={['fetchPlan']}
				/>
			)}

			{/* Charges Table - always show Card + QueryBuilder; inner content is filled or empty state */}
			<Card variant='notched'>
				<CardHeader
					title={t('catalog:plans.organisms.planPriceTable.charges')}
					cta={
						<Button prefixIcon={<Plus />} onClick={() => navigate(`${RouteNames.plan}/${plan.id}/add-charges`)}>
							{t('common:actions.add')}
						</Button>
					}
				/>
				<div>
					<QueryBuilder
						filterOptions={chargeFilterOptions}
						filters={filters}
						onFilterChange={setFilters}
						sortOptions={chargeSortOptions}
						selectedSorts={sorts}
						onSortChange={setSorts}
						debounceTime={300}
					/>
				</div>
				{isSearchLoading ? (
					<div className='flex items-center justify-center py-12'>
						<Loader />
					</div>
				) : (
					<>
						<FlexpriceTable showEmptyRow columns={chargeColumns} data={tableItems} />
						{(totalItems > 0 || page > 1) && (
							<ShortPagination unit='Charges' totalItems={totalItems} pageSize={limit} prefix={PAGINATION_PREFIX.PLAN_CHARGES} />
						)}
					</>
				)}
			</Card>
		</>
	);
};

export default PlanPriceTable;
