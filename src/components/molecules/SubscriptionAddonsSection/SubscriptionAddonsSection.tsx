import { FC, useState, useMemo, useCallback, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { TFunction } from 'i18next';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { Settings2, Trash2, Copy } from 'lucide-react';
import { Button, Card, CardHeader, Chip, DatePicker, Dialog, AddButton, Select, Tooltip, NoDataCard } from '@/components/atoms';
import { FlexpriceTable, ColumnData } from '@/components/molecules';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { BsThreeDots } from 'react-icons/bs';
import SubscriptionApi from '@/api/SubscriptionApi';
import { ADDON_ASSOCIATION_STATUS } from '@/models/AddonAssociation';
import { AddonAssociationResponse, SubscriptionLineItemListItem, SubscriptionResponse } from '@/types/dto/Subscription';
import { EXPAND } from '@/models';
import { ADDON_PRORATION_BEHAVIOR } from '@/types/dto/Addon';
import { BILLING_PERIOD } from '@/constants/constants';
import { toSentenceCase, copyToClipboard } from '@/utils/common/helper_functions';
import { Price, PRICE_TYPE } from '@/models/Price';
import { getCurrentPriceAmount } from '@/utils/common/price_override_helpers';
import { getTotalPayableTextWithCoupons } from '@/utils/common/helper_functions';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';
import AddAddonDialog from './AddAddonDialog';
import ConfigureAddonDialog from './ConfigureAddonDialog';
import { formatDateTimeWithSecondsAndTimezone } from '@/utils/common/format_date';
import { refetchQueries } from '@/core/services/tanstack/ReactQueryProvider';
import { useCurrentUserPermissions } from '@/hooks/useCurrentUserPermissions';

interface SubscriptionAddonsSectionProps {
	subscriptionId: string;
	/** When true, add/remove addon actions are disabled. */
	readOnly?: boolean;
	/**
	 * When all subscription context props are supplied (e.g. from subscription edit core query),
	 * avoids an extra GET /subscriptions/:id fetch.
	 */
	subscriptionBillingPeriod?: BILLING_PERIOD;
	/** Paired with subscriptionBillingPeriod for the cadence-compat filter. Defaults to 1. */
	subscriptionBillingPeriodCount?: number;
	subscriptionCurrency?: string;
	subscriptionCurrentPeriodStart?: string;
	subscriptionCurrentPeriodEnd?: string;
}

const formatAddonCharges = (prices: Price[] = []): string => {
	if (!prices || prices.length === 0) return '--';

	const recurringPrices = prices.filter((p) => p.type === PRICE_TYPE.FIXED);
	const usagePrices = prices.filter((p) => p.type === PRICE_TYPE.USAGE);

	const hasUsage = usagePrices.length > 0;

	if (recurringPrices.length === 0) {
		return hasUsage ? 'Depends on usage' : '--';
	}

	// Calculate total recurring amount
	const recurringTotal = recurringPrices.reduce((acc, charge) => {
		const currentAmount = getCurrentPriceAmount(charge, {});
		return acc + parseFloat(currentAmount);
	}, 0);

	// Use the same helper as Preview component for consistent display
	return getTotalPayableTextWithCoupons(recurringPrices, usagePrices, recurringTotal, []);
};

type AddonStatus = `${ADDON_ASSOCIATION_STATUS}`;

const getStatusVariant = (status: AddonStatus): 'info' | 'default' | 'success' => {
	switch (status) {
		case 'upcoming':
		case 'pending':
		case 'scheduled':
			return 'info';
		case 'inactive':
		case 'cancelled':
			return 'default';
		case 'active':
		default:
			return 'success';
	}
};

const formatAddonAssociationTooltip = (association: AddonAssociationResponse, t: TFunction): ReactNode => {
	const { start_date, end_date } = association;
	const items: ReactNode[] = [];

	if (start_date && start_date.trim() !== '') {
		const parsed = new Date(start_date);
		if (!isNaN(parsed.getTime())) {
			items.push(
				<div key='start' className='flex items-center gap-2'>
					<span className='text-xs font-medium text-content-muted'>{t('labels.start')}</span>
					<span className='text-sm font-medium'>{formatDateTimeWithSecondsAndTimezone(parsed)}</span>
				</div>,
			);
		}
	}

	if (end_date && end_date.trim() !== '') {
		const parsed = new Date(end_date);
		if (!isNaN(parsed.getTime())) {
			items.push(
				<div key='end' className='flex items-center gap-2'>
					<span className='text-xs font-medium text-content-muted'>{t('labels.end')}</span>
					<span className='text-sm font-medium'>{formatDateTimeWithSecondsAndTimezone(parsed)}</span>
				</div>,
			);
		}
	}

	if (items.length === 0) {
		return <span className='text-sm'>{t('labels.noDateInformation')}</span>;
	}

	return <div className='flex flex-col gap-2'>{items}</div>;
};

interface AddonAssociationWithStatus extends AddonAssociationResponse {
	precomputedStatus: AddonStatus;
	statusVariant: 'info' | 'default' | 'success';
	statusLabel: string;
	tooltipContent: ReactNode;
}

const computeAssociationStatus = (association: AddonAssociationResponse): AddonStatus => {
	const raw = association.addon_status?.toLowerCase() as AddonStatus | undefined;
	if (
		raw === ADDON_ASSOCIATION_STATUS.CANCELLED ||
		raw === ADDON_ASSOCIATION_STATUS.INACTIVE ||
		raw === ADDON_ASSOCIATION_STATUS.ACTIVE ||
		raw === ADDON_ASSOCIATION_STATUS.UPCOMING ||
		raw === ADDON_ASSOCIATION_STATUS.PENDING ||
		raw === ADDON_ASSOCIATION_STATUS.SCHEDULED
	) {
		return raw;
	}

	// Fallback to date-based computation
	const now = new Date();
	if (association.start_date && association.start_date.trim() !== '') {
		const start = new Date(association.start_date);
		if (!isNaN(start.getTime()) && start > now) return 'upcoming';
	}
	if (association.end_date && association.end_date.trim() !== '') {
		const end = new Date(association.end_date);
		if (!isNaN(end.getTime()) && end < now) return 'inactive';
	}
	return 'active';
};

const SubscriptionAddonsSection: FC<SubscriptionAddonsSectionProps> = ({
	subscriptionId,
	readOnly = false,
	subscriptionBillingPeriod,
	subscriptionBillingPeriodCount,
	subscriptionCurrency,
	subscriptionCurrentPeriodStart,
	subscriptionCurrentPeriodEnd,
}) => {
	const { t } = useTranslation(['common', 'billing']);
	const { can } = useCurrentUserPermissions();
	const canWriteAddon = can('addon', 'write');
	const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
	const [addonToConfigure, setAddonToConfigure] = useState<AddonAssociationResponse | null>(null);
	const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
	const [addonToCancel, setAddonToCancel] = useState<AddonAssociationResponse | null>(null);
	const [effectiveEndDate, setEffectiveEndDate] = useState<Date | undefined>(undefined);
	const [cancelProrationBehavior, setCancelProrationBehavior] = useState<ADDON_PRORATION_BEHAVIOR | ''>('');
	const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);
	const queryClient = useQueryClient();

	const subscriptionContextResolved =
		subscriptionBillingPeriod != null &&
		subscriptionCurrency != null &&
		subscriptionCurrentPeriodStart != null &&
		subscriptionCurrentPeriodEnd != null;

	const { data: subscriptionDetailsFetched } = useQuery({
		queryKey: ['subscriptionDetails', subscriptionId],
		queryFn: async () => SubscriptionApi.getSubscription(subscriptionId),
		enabled: !!subscriptionId && !subscriptionContextResolved,
	});

	const subscriptionDetails = subscriptionContextResolved
		? {
				billing_period: subscriptionBillingPeriod,
				currency: subscriptionCurrency,
				current_period_start: subscriptionCurrentPeriodStart,
				current_period_end: subscriptionCurrentPeriodEnd,
			}
		: subscriptionDetailsFetched;

	// Fetch active addons (backend returns { items, pagination })
	const {
		data: addonAssociationsResponse,
		isLoading: isLoadingAddons,
		isError,
	} = useQuery({
		queryKey: ['subscriptionActiveAddons', subscriptionId],
		queryFn: async () => {
			return await SubscriptionApi.getActiveAddons(subscriptionId);
		},
		enabled: !!subscriptionId,
		retry: false,
		refetchOnWindowFocus: false,
	});

	// Normalize response to always be an array for rendering
	const addonAssociations = useMemo<AddonAssociationResponse[]>(() => {
		if (!addonAssociationsResponse) return [];
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const response = addonAssociationsResponse as any;
		return response.items ?? response ?? [];
	}, [addonAssociationsResponse]);

	// The Charges column must reflect each addon's actual subscription line items — which
	// carry any per-subscription price override — rather than the addon's catalog default
	// prices (`association.addon.prices`, which never change after an override). Fetched
	// once for the whole subscription and grouped client-side to avoid one request per row.
	// Query key matches what ConfigureAddonDialog already refetches on every line-item
	// mutation (see its `invalidateAddonQueries`), so an override there updates this table too.
	const {
		data: addonLineItems,
		isLoading: isLoadingAddonLineItems,
		isError: isErrorAddonLineItems,
	} = useQuery({
		queryKey: ['subscriptionAddonLineItems', subscriptionId],
		queryFn: async () => {
			// A page size this large covers virtually every subscription in one request; the loop
			// below only makes a second request on the rare subscription that actually exceeds it,
			// so this stays a single round trip for the common case while still being correct for
			// subscriptions with more active line items than fit on one page.
			const pageSize = 1000;
			const items: SubscriptionLineItemListItem[] = [];
			let offset = 0;
			while (true) {
				const page = await SubscriptionApi.searchSubscriptionLineItems({
					subscription_ids: [subscriptionId],
					active_filter: true,
					expand: `${EXPAND.PRICES}.${EXPAND.METERS}`,
					limit: pageSize,
					offset,
				});
				items.push(...page.items);
				const total = page.pagination?.total ?? items.length;
				if (items.length >= total || page.items.length === 0) break;
				offset += pageSize;
			}
			return items;
		},
		enabled: !!subscriptionId,
	});

	const pricesByAddonAssociationId = useMemo<Record<string, Price[]>>(() => {
		const grouped: Record<string, Price[]> = {};
		for (const item of addonLineItems ?? []) {
			if (!item.addon_association_id || !item.price) continue;
			(grouped[item.addon_association_id] ??= []).push(item.price);
		}
		return grouped;
	}, [addonLineItems]);

	const isLoading = isLoadingAddons || isLoadingAddonLineItems;

	const processedAddonAssociations = useMemo<AddonAssociationWithStatus[]>(() => {
		return addonAssociations.map((association) => {
			const status = computeAssociationStatus(association);
			const statusVariant = getStatusVariant(status);
			const statusLabel = toSentenceCase(status || 'active');
			const tooltipContent = formatAddonAssociationTooltip(association, t);

			return {
				...association,
				precomputedStatus: status,
				statusVariant,
				statusLabel,
				tooltipContent,
			};
		});
	}, [addonAssociations, t]);

	const addonNameToCancel = useMemo(() => {
		if (!addonToCancel) return 'this addon';
		return addonAssociations.find((a) => a.id === addonToCancel.id)?.addon?.name || 'this addon';
	}, [addonToCancel, addonAssociations]);

	// Cancel addon mutation
	const { mutate: cancelAddon, isPending: isCancellingAddon } = useMutation({
		mutationFn: async (payload: { addonAssociationId: string; effectiveDate?: string; prorationBehavior?: ADDON_PRORATION_BEHAVIOR }) => {
			return await SubscriptionApi.removeAddonFromSubscription({
				addon_association_id: payload.addonAssociationId,
				...(payload.effectiveDate ? { effective_date: payload.effectiveDate } : {}),
				...(payload.prorationBehavior ? { proration_behavior: payload.prorationBehavior } : {}),
			});
		},
		onSuccess: () => {
			toast.success('Addon cancelled successfully');
			queryClient.invalidateQueries({ queryKey: ['subscriptionActiveAddons', subscriptionId] });
			void refetchQueries(['subscriptionEdit', subscriptionId]);
			queryClient.invalidateQueries({ queryKey: ['subscriptionEntitlements', subscriptionId] });
			setIsCancelDialogOpen(false);
			setAddonToCancel(null);
			setEffectiveEndDate(undefined);
			setCancelProrationBehavior('');
		},
		onError: (error: Error) => {
			toast.error(error.message || 'Failed to cancel addon');
		},
	});

	const handleCancel = useCallback(
		(addon: AddonAssociationResponse) => {
			setDropdownOpen(null);
			setAddonToCancel(addon);
			const rawPeriodEnd = subscriptionDetails?.current_period_end;
			const periodEnd = rawPeriodEnd ? new Date(rawPeriodEnd) : undefined;
			setEffectiveEndDate(periodEnd && !isNaN(periodEnd.getTime()) ? periodEnd : undefined);
			setCancelProrationBehavior(ADDON_PRORATION_BEHAVIOR.NONE);
			setIsCancelDialogOpen(true);
		},
		[subscriptionDetails?.current_period_end],
	);

	const confirmCancel = useCallback(() => {
		if (!addonToCancel) return;
		cancelAddon({
			addonAssociationId: addonToCancel.id,
			effectiveDate: effectiveEndDate?.toISOString(),
			prorationBehavior: cancelProrationBehavior || undefined,
		});
	}, [addonToCancel, cancelAddon, effectiveEndDate, cancelProrationBehavior]);

	const closeCancelDialog = useCallback(() => {
		setIsCancelDialogOpen(false);
		setAddonToCancel(null);
		setEffectiveEndDate(undefined);
		setCancelProrationBehavior('');
	}, []);

	const columns: ColumnData<AddonAssociationWithStatus>[] = useMemo(
		() => [
			{
				title: 'Name',
				render: (row) => <span>{row.addon?.name || row.addon_id}</span>,
			},
			{
				title: 'Status',
				render: (row) => (
					<Tooltip
						content={row.tooltipContent}
						delayDuration={0}
						sideOffset={5}
						className='bg-surface border border-line shadow-lg text-sm text-content px-4 py-3 rounded-lg max-w-[320px]'>
						<span>
							<Chip label={row.statusLabel} variant={row.statusVariant} />
						</span>
					</Tooltip>
				),
			},
			{
				title: 'Charges',
				render: (row) => {
					// Falls back to the catalog default only if this association genuinely has no
					// matching line items — the common case reads the real, possibly-overridden line
					// item prices grouped above. When the line-items fetch itself failed, showing the
					// catalog price would silently pass off a possibly-stale number as current, so
					// show nothing instead.
					const prices = pricesByAddonAssociationId[row.id] ?? (isErrorAddonLineItems ? [] : row.addon?.prices) ?? [];
					return <span>{formatAddonCharges(prices)}</span>;
				},
			},
			{
				title: '',
				width: '30px',
				fieldVariant: 'interactive',
				hideOnEmpty: true,
				render: (row) => {
					if (readOnly) return null;
					const hasEndDate = !!row.end_date && row.end_date.trim() !== '';
					return (
						<div
							data-interactive='true'
							onClick={(e) => {
								e.preventDefault();
								e.stopPropagation();
							}}>
							<DropdownMenu open={dropdownOpen === row.id} onOpenChange={(open) => setDropdownOpen(open ? row.id : null)}>
								<DropdownMenuTrigger asChild>
									<button className='focus:outline-none'>
										<BsThreeDots className='text-base text-muted-foreground hover:text-foreground transition-colors' />
									</button>
								</DropdownMenuTrigger>
								<DropdownMenuContent align='end'>
									<DropdownMenuItem
										disabled={hasEndDate || !canWriteAddon}
										onSelect={(e) => {
											if (hasEndDate || !canWriteAddon) return;
											e.preventDefault();
											setDropdownOpen(null);
											setAddonToConfigure(row);
										}}
										className={cn(
											'flex gap-2 items-center cursor-pointer',
											(hasEndDate || !canWriteAddon) && 'opacity-50 cursor-not-allowed',
										)}>
										<Settings2 className='h-4 w-4' />
										<span>{t('billing:subscriptions.configure')}</span>
									</DropdownMenuItem>
									<DropdownMenuItem
										onSelect={(e) => {
											e.preventDefault();
											void copyToClipboard(row.id, t('copyId.toastWithType', { type: 'Addon' }));
										}}
										className='flex gap-2 items-center cursor-pointer'>
										<Copy className='h-4 w-4' />
										<span>{t('copyId.genericLabel')}</span>
									</DropdownMenuItem>
									<DropdownMenuItem
										disabled={hasEndDate || !canWriteAddon}
										onSelect={(e) => {
											if (hasEndDate || !canWriteAddon) return;
											e.preventDefault();
											handleCancel(row);
										}}
										className={cn(
											'flex gap-2 items-center cursor-pointer text-danger',
											(hasEndDate || !canWriteAddon) && 'opacity-50 cursor-not-allowed',
										)}>
										<Trash2 className='h-4 w-4' />
										<span>{t('actions.cancel')}</span>
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						</div>
					);
				},
			},
		],
		[dropdownOpen, handleCancel, readOnly, canWriteAddon, t, pricesByAddonAssociationId, isErrorAddonLineItems],
	);

	const addButton = readOnly ? undefined : canWriteAddon ? (
		<AddButton onClick={() => setIsAddDialogOpen(true)} />
	) : (
		<Tooltip content={t('labels.addonWriteDeniedTooltip')}>
			<span tabIndex={0} className='inline-block'>
				<AddButton disabled />
			</span>
		</Tooltip>
	);

	if (isLoading) {
		return (
			<Card variant='notched'>
				<CardHeader title={t('labels.addons')} cta={addButton} />
				<div className='flex justify-center items-center py-8'>
					<span className='text-content-muted'>{t('labels.loadingAddons')}</span>
				</div>
			</Card>
		);
	}

	if (isError) {
		return null;
	}

	return (
		<>
			{processedAddonAssociations.length > 0 ? (
				<Card variant='notched'>
					<CardHeader title={t('labels.addons')} cta={addButton} />
					<FlexpriceTable showEmptyRow data={processedAddonAssociations} columns={columns} variant='no-bordered' />
				</Card>
			) : (
				<NoDataCard title={t('labels.addons')} subtitle={t('labels.noAddonsAddedYet')} cta={addButton} />
			)}

			{!readOnly && (
				<AddAddonDialog
					isOpen={isAddDialogOpen}
					onOpenChange={setIsAddDialogOpen}
					subscriptionId={subscriptionId}
					billingPeriod={subscriptionDetails?.billing_period}
					billingPeriodCount={
						subscriptionBillingPeriodCount ??
						(subscriptionContextResolved
							? undefined
							: (subscriptionDetailsFetched as SubscriptionResponse | undefined)?.billing_period_count)
					}
					currency={subscriptionDetails?.currency}
					currentPeriodEndIso={subscriptionDetails?.current_period_end}
				/>
			)}

			<ConfigureAddonDialog
				isOpen={!!addonToConfigure}
				onOpenChange={(open) => {
					if (!open) setAddonToConfigure(null);
				}}
				subscriptionId={subscriptionId}
				association={addonToConfigure}
				currentPeriodStart={subscriptionDetails?.current_period_start}
				currentPeriodEnd={subscriptionDetails?.current_period_end}
				readOnly={readOnly}
			/>

			{/* Cancel Addon Dialog */}
			<Dialog
				title={`Cancel "${addonNameToCancel}"?`}
				description={t('labels.cancelAddonDescription')}
				titleClassName='text-lg font-normal text-content-heading'
				isOpen={isCancelDialogOpen}
				onOpenChange={(open) => {
					setIsCancelDialogOpen(open);
					if (!open) {
						closeCancelDialog();
					}
				}}
				showCloseButton={false}>
				<div className='space-y-5'>
					<div className='space-y-3'>
						<div className='gap-3'>
							<DatePicker
								label={t('labels.effectiveEndDate')}
								placeholder={t('labels.endDate')}
								date={effectiveEndDate}
								setDate={setEffectiveEndDate}
								className='w-full'
								minDate={subscriptionDetails?.current_period_start ? new Date(subscriptionDetails.current_period_start) : undefined}
								maxDate={subscriptionDetails?.current_period_end ? new Date(subscriptionDetails.current_period_end) : undefined}
								popoverTriggerClassName='w-full'
							/>
							<Select
								label={t('labels.proration')}
								placeholder={t('labels.default')}
								options={[
									{
										label: 'Create prorations',
										value: ADDON_PRORATION_BEHAVIOR.CREATE_PRORATIONS,
										description: 'Creates proration credits/charges.',
									},
									{ label: 'None', value: ADDON_PRORATION_BEHAVIOR.NONE, description: 'No proration adjustments.' },
								]}
								value={cancelProrationBehavior}
								onChange={(v) => setCancelProrationBehavior(v as ADDON_PRORATION_BEHAVIOR)}
							/>
						</div>
						<p className='text-xs text-content-muted'>{t('labels.leaveEmptyToCancelAtPeriodEnd')}</p>
					</div>

					<div className='flex justify-end gap-3'>
						<Button variant='outline' onClick={closeCancelDialog} disabled={isCancellingAddon}>
							{t('actions.keep')}
						</Button>
						<Button variant='destructive' onClick={confirmCancel} disabled={isCancellingAddon}>
							{isCancellingAddon ? t('status.cancelling') : t('actions.cancel')}
						</Button>
					</div>
				</div>
			</Dialog>
		</>
	);
};

export default SubscriptionAddonsSection;
