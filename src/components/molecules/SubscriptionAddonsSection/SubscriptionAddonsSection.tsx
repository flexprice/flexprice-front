import { FC, useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { Settings2, Trash2, Copy } from 'lucide-react';
import { Button, Card, CardHeader, DatePicker, Dialog, AddButton, Select, Tooltip, NoDataCard } from '@/components/atoms';
import { FlexpriceTable, ColumnData } from '@/components/molecules';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { BsThreeDots } from 'react-icons/bs';
import SubscriptionApi from '@/api/SubscriptionApi';
import { AddonAssociationResponse, SubscriptionResponse } from '@/types/dto/Subscription';
import { EXPAND } from '@/models';
import { ADDON_PRORATION_BEHAVIOR } from '@/types/dto/Addon';
import { BILLING_PERIOD } from '@/constants/constants';
import { copyToClipboard } from '@/utils/common/helper_functions';
import { getCurrentPriceAmount } from '@/utils/common/price_override_helpers';
import {
	attachedAddonLinesToDisplayInput,
	formatAddonCharges,
	formatAddonQuantityDisplay,
	type AttachedAddonChargeLine,
} from '@/utils/subscription/addonQuantity';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';
import AddAddonDialog from './AddAddonDialog';
import ConfigureAddonDialog from './ConfigureAddonDialog';
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
	const { data: addonLineItemsResponse, isLoading: isLoadingAddonLineItems } = useQuery({
		queryKey: ['subscriptionAddonLineItems', subscriptionId],
		queryFn: async () =>
			SubscriptionApi.searchSubscriptionLineItems({
				subscription_ids: [subscriptionId],
				active_filter: true,
				expand: `${EXPAND.PRICES}.${EXPAND.METERS}`,
				limit: 100,
				offset: 0,
			}),
		enabled: !!subscriptionId,
	});

	const chargeLinesByAddonAssociationId = useMemo<Record<string, AttachedAddonChargeLine[]>>(() => {
		const grouped: Record<string, AttachedAddonChargeLine[]> = {};
		for (const item of addonLineItemsResponse?.items ?? []) {
			if (!item.addon_association_id || !item.price) continue;
			const unitAmount = parseFloat(getCurrentPriceAmount(item.price, {}));
			(grouped[item.addon_association_id] ??= []).push({
				priceType: item.price_type ?? item.price.type,
				quantity: item.quantity,
				unitAmount: Number.isFinite(unitAmount) ? unitAmount : 0,
				startDate: item.start_date,
				endDate: item.end_date,
				price: item.price,
			});
		}
		return grouped;
	}, [addonLineItemsResponse]);

	const isLoading = isLoadingAddons || isLoadingAddonLineItems;

	const getAddonDisplayInput = useCallback(
		(association: AddonAssociationResponse) => {
			const lines = chargeLinesByAddonAssociationId[association.id];
			if (lines) {
				return attachedAddonLinesToDisplayInput(lines);
			}
			return { prices: association.addon?.prices ?? [], overrideLineItems: [] };
		},
		[chargeLinesByAddonAssociationId],
	);

	const chargeLabels = useMemo(
		() => ({
			empty: t('common:labels.na'),
			dependsOnUsage: t('common:subscriptionAddon.dependsOnUsage'),
		}),
		[t],
	);

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

	const columns: ColumnData<AddonAssociationResponse>[] = useMemo(
		() => [
			{
				title: t('common:subscriptionAddon.columnName'),
				render: (row) => <span>{row.addon?.name || row.addon_id}</span>,
			},
			{
				title: t('common:subscriptionAddon.columnQuantity'),
				render: (row) => {
					const { prices, overrideLineItems } = getAddonDisplayInput(row);
					return formatAddonQuantityDisplay(prices, overrideLineItems, t('common:subscriptionAddon.quantityUsage'));
				},
			},
			{
				title: t('common:subscriptionAddon.columnCharges'),
				render: (row) => {
					const { prices, overrideLineItems } = getAddonDisplayInput(row);
					return <span>{formatAddonCharges(prices, overrideLineItems, {}, [], chargeLabels)}</span>;
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
		[dropdownOpen, handleCancel, readOnly, canWriteAddon, t, getAddonDisplayInput, chargeLabels],
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
			{addonAssociations.length > 0 ? (
				<Card variant='notched'>
					<CardHeader title={t('labels.addons')} cta={addButton} />
					<FlexpriceTable showEmptyRow data={addonAssociations} columns={columns} variant='no-bordered' />
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
