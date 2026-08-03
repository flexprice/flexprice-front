import { Card, FormHeader, Page, Spacer, Chip } from '@/components/atoms';
import { IntegrationMappingCard, SubscriptionAddonsSection, UpcomingCreditGrantApplicationsTable } from '@/components/molecules';
import SubscriptionDetailChargesSection from '@/components/molecules/Subscription/SubscriptionDetailChargesSection';
import FlexpriceTable, { ColumnData, RedirectCell } from '@/components/molecules/Table';
import { SubscriptionPreviewLineItemTable } from '@/components/molecules/InvoiceLineItemTable';
import SubscriptionActionButton from '@/components/organisms/Subscription/SubscriptionActionButton';
import { getSubscriptionStatus } from '@/components/organisms/Subscription/SubscriptionTable';
import { Skeleton } from '@/components/ui';
import { RouteNames } from '@/core/routes/Routes';
import { useBreadcrumbsStore } from '@/store/useBreadcrumbsStore';
import { CustomerApi, SubscriptionApi, TaxApi } from '@/api';
import { formatDateShort, getCurrencySymbol } from '@/utils/common/helper_functions';
import { useQuery } from '@tanstack/react-query';
import { FC, useEffect, useMemo, useState } from 'react';
import type { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { useParams, Link } from 'react-router';
import { INVOICE_TYPE } from '@/models/Invoice';
import { TAXRATE_ENTITY_TYPE } from '@/models/Tax';
import TaxAssociationTable from '@/components/molecules/TaxAssociationTable';
import CouponAssociationTable from '@/components/molecules/CouponAssociationTable/CouponAssociationTable';
import { Subscription as SubscriptionType, SUBSCRIPTION_STATUS, SUBSCRIPTION_TYPE } from '@/models/Subscription';
import { ENTITY_STATUS, EXPAND } from '@/models';
import { DataType, FilterOperator } from '@/types/common/QueryBuilder';
import { SubscriptionResponse } from '@/types/dto/Subscription';
import { generateExpandQueryParams } from '@/utils/common/api_helper';
import formatDate from '@/utils/common/format_date';
import { BILLING_PERIOD } from '@/constants/constants';
import { ExternalLink } from 'lucide-react';
import { formatSubscriptionTypeDisplayLabel } from '@/utils/subscription/formatSubscriptionTypeDisplay';

const DATE_NO_YEAR_FORMAT: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };

type SubscriptionTypeChipProps =
	| { variant: 'default' | 'success' | 'warning' | 'failed' | 'info' }
	| { textColor: string; bgColor: string; borderColor: string };

/** Distinct palettes per API `subscription_type` (avoids dull grey for the common cases). */
function getSubscriptionTypeChipProps(raw: string | null | undefined): SubscriptionTypeChipProps {
	const t = raw?.trim().toLowerCase();
	switch (t) {
		case SUBSCRIPTION_TYPE.STANDALONE:
			return {
				textColor: 'rgb(var(--fp-chip-teal-text))',
				bgColor: 'rgb(var(--fp-chip-teal-bg))',
				borderColor: 'rgb(var(--fp-chip-teal-line))',
			};
		case SUBSCRIPTION_TYPE.PARENT:
			return { variant: 'success' };
		case SUBSCRIPTION_TYPE.INHERITED:
			return { variant: 'info' };
		case SUBSCRIPTION_TYPE.GROUPED_INVOICING:
			return { variant: 'warning' };
		case SUBSCRIPTION_TYPE.DELEGATED_INVOICING:
			return {
				textColor: 'rgb(var(--fp-chip-violet-text))',
				bgColor: 'rgb(var(--fp-chip-violet-bg))',
				borderColor: 'rgb(var(--fp-chip-violet-line))',
			};
		default:
			return {
				textColor: 'rgb(var(--fp-chip-indigo-text))',
				bgColor: 'rgb(var(--fp-chip-indigo-bg))',
				borderColor: 'rgb(var(--fp-chip-indigo-line))',
			};
	}
}

function getCommitmentPeriodLabel(subscription: SubscriptionType | undefined, t: TFunction): string {
	const period = subscription?.commitment_duration;
	const count = subscription?.billing_period_count ?? 1;
	const dash = () => t('usageTable.featureTypes.dash');

	if (!period) return dash();

	switch (period) {
		case BILLING_PERIOD.ANNUAL:
			return t('subscriptionDetail.commitment.annual');
		case BILLING_PERIOD.MONTHLY:
			if (count === 12) return t('subscriptionDetail.commitment.annual');
			if (count === 1) return t('subscriptionDetail.commitment.monthly');
			return t('subscriptionDetail.commitment.nMonths', { count });
		case BILLING_PERIOD.QUARTERLY:
			return t('subscriptionDetail.commitment.quarterly');
		case BILLING_PERIOD.HALF_YEARLY:
			return t('subscriptionDetail.commitment.halfYearly');
		case BILLING_PERIOD.WEEKLY:
			return t('subscriptionDetail.commitment.weekly');
		case BILLING_PERIOD.DAILY:
			return t('subscriptionDetail.commitment.daily');
		default:
			return dash();
	}
}

const CustomerSubscriptionDetailsPage: FC = () => {
	const { t } = useTranslation(['customers', 'common']);
	const { subscription_id, id: customerId } = useParams();
	const { updateBreadcrumb } = useBreadcrumbsStore();
	const { data: subscriptionDetails, isLoading: isSubscriptionDetailsLoading } = useQuery<SubscriptionType>({
		queryKey: ['subscriptionDetails', subscription_id],
		queryFn: async (): Promise<SubscriptionType> => {
			// Use v2 API with minimal expand - only request fields needed for this page
			return await SubscriptionApi.getSubscriptionV2(subscription_id!, { expand: 'plan' });
		},
		staleTime: 1,
	});

	const { data: customer } = useQuery({
		queryKey: ['fetchCustomerDetails', customerId],
		queryFn: async () => await CustomerApi.getCustomerById(customerId!),
		enabled: !!customerId,
	});

	const { data: invoicingCustomer } = useQuery({
		queryKey: ['invoicingCustomer', subscriptionDetails?.invoicing_customer_id],
		queryFn: async () => {
			if (!subscriptionDetails?.invoicing_customer_id) return null;
			return await CustomerApi.getCustomerById(subscriptionDetails.invoicing_customer_id);
		},
		enabled: !!subscriptionDetails?.invoicing_customer_id,
	});

	const parentSubscriptionId = subscriptionDetails?.parent_subscription_id;
	const { data: parentSubscription, isLoading: isParentSubscriptionLoading } = useQuery({
		queryKey: ['parentSubscription', parentSubscriptionId],
		queryFn: async () => SubscriptionApi.getSubscriptionV2(parentSubscriptionId!, { expand: 'plan' }),
		enabled: !!parentSubscriptionId,
		staleTime: 1,
	});

	const parentCustomerId = parentSubscription?.customer_id;
	const { data: parentCustomer, isLoading: isParentCustomerLoading } = useQuery({
		queryKey: ['parentSubscriptionCustomer', parentCustomerId],
		queryFn: async () => CustomerApi.getCustomerById(parentCustomerId!),
		enabled: !!parentCustomerId,
	});

	const [showZeroCharges, setShowZeroCharges] = useState(false);

	const {
		data,
		isLoading: isPreviewLoading,
		isError,
		refetch,
	} = useQuery({
		queryKey: [
			'subscriptionInvoices',
			subscription_id,
			subscriptionDetails?.current_period_start,
			subscriptionDetails?.current_period_end,
			showZeroCharges,
		],
		queryFn: async () => {
			return await SubscriptionApi.getSubscriptionInvoicesPreview({
				subscription_id: subscription_id!,
				hide_zero_charges_line_items: !showZeroCharges,
			});
		},
		enabled:
			!!subscriptionDetails &&
			subscriptionDetails.subscription_status !== SUBSCRIPTION_STATUS.CANCELLED &&
			subscriptionDetails.subscription_status !== SUBSCRIPTION_STATUS.TRIALING &&
			!!subscription_id,
	});

	const { data: subscriptionTaxAssociations } = useQuery({
		queryKey: ['subscriptionTaxAssociations', subscription_id],
		queryFn: async () => {
			return await TaxApi.listTaxAssociations({
				limit: 1000,
				offset: 0,
				entity_id: subscription_id!,
				entity_type: TAXRATE_ENTITY_TYPE.SUBSCRIPTION,
				expand: generateExpandQueryParams([EXPAND.TAX_RATE]),
			});
		},
		enabled: !!subscription_id,
	});

	const { data: upcomingCreditGrantApplications } = useQuery({
		queryKey: ['upcomingCreditGrantApplications', subscription_id],
		queryFn: async () => {
			return await SubscriptionApi.getUpcomingCreditGrantApplications(subscription_id!);
		},
		enabled: !!subscription_id,
	});

	const { data: inheritedSubscriptionsData } = useQuery({
		queryKey: ['inheritedSubscriptions', subscription_id, 'plan+customer'],
		queryFn: async () =>
			SubscriptionApi.searchSubscriptions({
				filters: [
					{
						field: 'parent_subscription_id',
						operator: FilterOperator.EQUAL,
						data_type: DataType.STRING,
						value: { string: subscription_id! },
					},
				],
				limit: 100,
				offset: 0,
				expand: generateExpandQueryParams([EXPAND.PLAN, EXPAND.CUSTOMER]),
				status: ENTITY_STATUS.PUBLISHED,
			}),
		enabled: !!subscription_id && !!subscriptionDetails,
	});

	const inheritedSubscriptionRows = inheritedSubscriptionsData?.items ?? [];

	const inheritedSubscriptionsColumns = useMemo<ColumnData<SubscriptionResponse>[]>(
		() => [
			{
				title: t('subscriptionDetail.columns.customer'),
				render: (row) => (
					<RedirectCell redirectUrl={`${RouteNames.customers}/${row.customer_id}`}>
						{row.customer?.name ?? t('usageTable.featureTypes.dash')}
					</RedirectCell>
				),
			},
			{
				title: t('subscriptionDetail.columns.type'),
				render: (row) => {
					const chip = getSubscriptionTypeChipProps(row.subscription_type);
					return (
						<Chip
							label={formatSubscriptionTypeDisplayLabel(row.subscription_type)}
							className='shrink-0'
							{...('variant' in chip
								? { variant: chip.variant }
								: { textColor: chip.textColor, bgColor: chip.bgColor, borderColor: chip.borderColor })}
						/>
					);
				},
			},
			{
				title: t('subscriptionDetail.columns.plan'),
				render: (row) => (
					<RedirectCell redirectUrl={`${RouteNames.customers}/${row.customer_id}/subscription/${row.id}`}>
						{row.plan?.name ?? t('usageTable.featureTypes.dash')}
					</RedirectCell>
				),
			},
			{
				title: t('subscriptionDetail.columns.startDate'),
				render: (row) => <span className='text-muted-foreground'>{formatDate(row.start_date)}</span>,
			},
			{
				title: t('subscriptionDetail.columns.renewalDate'),
				render: (row) => <span className='text-muted-foreground'>{formatDate(row.current_period_end)}</span>,
			},
		],
		[t],
	);

	useEffect(() => {
		if (subscriptionDetails?.plan?.name) {
			updateBreadcrumb(4, subscriptionDetails.plan.name);
		}

		updateBreadcrumb(3, t('subscriptionDetail.breadcrumbSubscription'), RouteNames.customers + '/' + customerId);

		if (customer?.external_id) {
			updateBreadcrumb(2, customer.external_id);
		}
	}, [subscriptionDetails, updateBreadcrumb, customer, customerId, t]);

	// Load subscription first; show page as soon as subscription is ready (preview loads separately below)
	if (isSubscriptionDetailsLoading) {
		return (
			<Page>
				<Skeleton className='h-48' />
				<Spacer className='!my-4' />
				<Skeleton className='h-60' />
			</Page>
		);
	}

	if (isError) {
		toast.error(t('subscriptionDetail.toast.genericError'));
	}

	// Determine if subscription is scheduled to cancel soon (within 15 days)
	const getCancellationEffectiveDate = (): Date | null => {
		if (!subscriptionDetails) return null;
		// If cancel_at is set, that is the effective cancellation date
		if (subscriptionDetails.cancel_at) {
			const d = new Date(subscriptionDetails.cancel_at);
			return isNaN(d.getTime()) ? null : d;
		}
		// If cancel_at_period_end, then cancellation is effective at current period end
		if (subscriptionDetails.cancel_at_period_end && subscriptionDetails.current_period_end) {
			const d = new Date(subscriptionDetails.current_period_end);
			return isNaN(d.getTime()) ? null : d;
		}
		return null;
	};

	const cancellationEffectiveDate = getCancellationEffectiveDate();
	const showCancelsByTag =
		subscriptionDetails?.subscription_status === SUBSCRIPTION_STATUS.ACTIVE &&
		!!cancellationEffectiveDate &&
		(() => {
			const now = new Date();
			const diffMs = cancellationEffectiveDate.getTime() - now.getTime();
			const diffDays = diffMs / (1000 * 60 * 60 * 24);
			return diffDays >= 0 && diffDays <= 15;
		})();
	// Prefer explicit end_date if it's a meaningful value and within 15 days (avoid epoch/default like 1970/0001)
	const showEndDateTag = (() => {
		const dStr = subscriptionDetails?.end_date;
		if (!dStr) return false;
		const d = new Date(dStr);
		if (isNaN(d.getTime())) return false;
		const year = d.getUTCFullYear();
		// Treat early sentinel years as "default" (e.g., 0001, 1970, 1971)
		if (year <= 1971) return false;
		const now = new Date();
		const diffMs = d.getTime() - now.getTime();
		const diffDays = diffMs / (1000 * 60 * 60 * 24);
		return diffDays >= 0 && diffDays <= 15;
	})();
	// Local formatter to show date without year (e.g., "Nov 12")
	const formatDateNoYear = (dateString: string | Date) => {
		const d = new Date(dateString);
		if (isNaN(d.getTime())) return t('usageTable.featureTypes.dash');
		return d.toLocaleDateString('en-US', DATE_NO_YEAR_FORMAT);
	};

	return (
		<div>
			<Card className='card'>
				<div className='flex justify-between items-center'>
					<FormHeader title={t('subscriptionDetail.sectionTitle')} variant='sub-header' titleClassName='font-semibold' />
					<SubscriptionActionButton subscription={subscriptionDetails!} />
				</div>
				<div className='w-full flex justify-between items-center'>
					<p className='text-content-zinc-muted text-sm'>{t('subscriptionDetail.subscriptionName')}</p>
					<p className='text-content-zinc text-sm'>{subscriptionDetails?.plan.name ?? t('usageTable.featureTypes.dash')}</p>
				</div>
				<Spacer className='!my-4' />
				<div className='w-full flex justify-between items-center'>
					<p className='text-content-zinc-muted text-sm'>{t('subscriptionDetail.status')}</p>
					<div className='text-content-zinc text-sm flex items-center gap-2'>
						{getSubscriptionStatus(subscriptionDetails?.subscription_status ?? '', t)}
						{showEndDateTag ? (
							<Chip
								variant='default'
								label={t('subscriptionDetail.cancelsOnDate', { date: formatDateNoYear(subscriptionDetails!.end_date) })}
							/>
						) : (
							showCancelsByTag &&
							cancellationEffectiveDate && (
								<Chip
									variant='default'
									label={t('subscriptionDetail.cancelsByDate', {
										date: formatDateShort(cancellationEffectiveDate.toISOString()),
									})}
								/>
							)
						)}
					</div>
				</div>
				<Spacer className='!my-4' />

				<div className='w-full flex justify-between items-center'>
					<p className='text-content-zinc-muted text-sm'>{t('subscriptionDetail.billingCycle')}</p>
					<p className='text-content-zinc text-sm'>{subscriptionDetails?.billing_cycle || t('usageTable.featureTypes.dash')}</p>
				</div>
				<Spacer className='!my-4' />

				<div className='w-full flex justify-between items-center'>
					<p className='text-content-zinc-muted text-sm'>{t('subscriptionDetail.commitmentPeriod')}</p>
					<p className='text-content-zinc text-sm'>{getCommitmentPeriodLabel(subscriptionDetails, t)}</p>
				</div>
				<Spacer className='!my-4' />

				<div className='w-full flex justify-between items-center'>
					<p className='text-content-zinc-muted text-sm'>{t('subscriptionDetail.paymentTerms')}</p>
					<p className='text-content-zinc text-sm'>{subscriptionDetails?.payment_terms ?? t('usageTable.featureTypes.dash')}</p>
				</div>
				<Spacer className='!my-4' />

				{subscriptionDetails?.timezone?.trim() && (
					<>
						<div className='w-full flex justify-between items-center'>
							<p className='text-content-zinc-muted text-sm'>{t('subscriptionDetail.timezone')}</p>
							<p className='text-content-zinc text-sm'>{subscriptionDetails.timezone}</p>
						</div>
						<Spacer className='!my-4' />
					</>
				)}

				{subscriptionDetails?.invoicing_customer_id && (
					<>
						<div className='w-full flex justify-between items-center'>
							<p className='text-content-zinc-muted text-sm'>{t('subscriptionDetail.invoicingCustomer')}</p>
							<Link
								to={`${RouteNames.customers}/${subscriptionDetails.invoicing_customer_id}`}
								className='inline-flex items-center text-sm gap-1.5 hover:underline transition-colors'>
								{invoicingCustomer?.name || invoicingCustomer?.external_id || subscriptionDetails.invoicing_customer_id}
								<ExternalLink className='w-3.5 h-3.5' />
							</Link>
						</div>
						<Spacer className='!my-4' />
					</>
				)}

				{subscriptionDetails?.parent_subscription_id && (
					<>
						<div className='w-full flex justify-between items-center'>
							<p className='text-content-zinc-muted text-sm'>{t('subscriptionDetail.parentCustomer')}</p>
							{isParentSubscriptionLoading || (parentCustomerId && isParentCustomerLoading) ? (
								<Skeleton className='h-4 w-40' />
							) : parentCustomerId ? (
								<Link
									to={`${RouteNames.customers}/${parentCustomerId}`}
									className='inline-flex items-center text-sm gap-1.5 hover:underline transition-colors'>
									{parentCustomer?.name || parentCustomer?.external_id || parentCustomerId}
									<ExternalLink className='w-3.5 h-3.5' />
								</Link>
							) : (
								<p className='text-content-zinc text-sm'>{t('usageTable.featureTypes.dash')}</p>
							)}
						</div>
						<Spacer className='!my-4' />
					</>
				)}

				{subscriptionDetails?.commitment_amount && (
					<div className='w-full flex justify-between items-center'>
						<p className='text-content-zinc-muted text-sm'>{t('subscriptionDetail.commitmentLabel')}</p>
						<p className='text-content-zinc text-sm'>
							{getCurrencySymbol(subscriptionDetails?.currency || '')} {subscriptionDetails?.commitment_amount || '0'}/{' '}
							{getCommitmentPeriodLabel(subscriptionDetails, t)}
						</p>
					</div>
				)}

				{subscriptionDetails?.auto_invoice_threshold != null && (
					<div className='w-full flex justify-between items-center'>
						<p className='text-content-zinc-muted text-sm'>{t('subscriptionDetail.autoInvoiceThreshold')}</p>
						<p className='text-content-zinc text-sm'>
							{getCurrencySymbol(subscriptionDetails?.currency || '')} {subscriptionDetails.auto_invoice_threshold}
						</p>
					</div>
				)}
				<Spacer className='!my-4' />

				{subscriptionDetails?.overage_factor && subscriptionDetails?.overage_factor > 1 && (
					<div className='w-full flex justify-between items-center'>
						<p className='text-content-zinc-muted text-sm'>{t('subscriptionDetail.overageFactor')}</p>
						<p className='text-content-zinc text-sm'>{subscriptionDetails?.overage_factor}</p>
					</div>
				)}
				<Spacer className='!my-4' />

				<div className='w-full flex justify-between items-center'>
					<p className='text-content-zinc-muted text-sm'>{t('subscriptionDetail.startDate')}</p>
					<p className='text-content-zinc text-sm'>{formatDateShort(subscriptionDetails?.start_date ?? '')}</p>
				</div>
				<Spacer className='!my-4' />
			</Card>

			{/* third-party integration mappings (e.g. AWS Marketplace license_arn) */}
			{subscription_id && (
				<div className='mt-8'>
					<IntegrationMappingCard entityType='subscription' entityId={subscription_id} />
				</div>
			)}

			{/* subscription schedule */}
			{subscriptionDetails?.schedule?.phases?.length && subscriptionDetails?.schedule?.phases?.length > 0 && (
				<Card className='card mt-8'>
					<FormHeader title={t('subscriptionDetail.subscriptionPhases')} variant='sub-header' titleClassName='font-semibold' />
					<div className='flex flex-col gap-4 pl-6'>
						{subscriptionDetails?.schedule?.phases?.length ? (
							subscriptionDetails.schedule.phases.map((phase, idx) => (
								<div key={idx} className='flex items-stretch gap-4 relative'>
									{/* Timeline Dot & Line */}
									<div className='flex flex-col items-center mr-2'>
										<div
											className={`w-2.5 h-2.5 rounded-full ${idx === subscriptionDetails.schedule.current_phase_index ? 'bg-info' : 'bg-surface-bold'}`}></div>
										{idx < subscriptionDetails.schedule.phases.length - 1 && (
											<div className='w-0.5 flex-1 bg-surface-strong' style={{ minHeight: 40 }}></div>
										)}
									</div>
									{/* Phase Card */}
									<div className='flex-1'>
										<div className='rounded-2xl border border-line-subtle bg-surface-faint px-8 py-5 flex flex-col gap-1'>
											<div className='text-sm font-medium text-content-subtle mb-2'>
												{t('subscriptionDetail.phaseHeading', { index: idx + 1 })}
											</div>
											<div className='grid grid-cols-4 gap-8'>
												<div>
													<div className='text-xs text-content-subtle'>{t('subscriptionDetail.phaseStart')}</div>
													<div className='font-normal text-lg text-content'>{formatDateShort(phase.start_date.toString())}</div>
												</div>
												<div>
													<div className='text-xs text-content-subtle'>{t('subscriptionDetail.phaseEnd')}</div>
													<div className='font-normal text-lg text-content'>
														{phase.end_date ? formatDateShort(phase.end_date.toString()) : t('usageTable.featureTypes.dash')}
													</div>
												</div>
												{/* Commitment and overage info removed - not available in SubscriptionPhase model */}
											</div>
										</div>
									</div>
								</div>
							))
						) : (
							<span className='text-content-zinc-muted text-sm'>{t('subscriptionDetail.noPhases')}</span>
						)}
					</div>
				</Card>
			)}

			{/* Upcoming Invoices: show card with header immediately; preview API can be slow so we show a dedicated loader */}
			{subscriptionDetails?.subscription_status !== SUBSCRIPTION_STATUS.CANCELLED &&
				subscriptionDetails?.subscription_status !== SUBSCRIPTION_STATUS.TRIALING && (
					<div className='card !mt-4'>
						{isPreviewLoading ? (
							<>
								<FormHeader
									variant='sub-header'
									titleClassName='font-semibold text-content'
									subtitleClassName='text-sm text-content-muted !mb-0 !mt-1'
									title={t('subscriptionDetail.upcomingInvoicesTitle')}
									subtitle={t('subscriptionDetail.upcomingInvoicesSubtitle', {
										date: formatDateShort(subscriptionDetails?.current_period_end ?? ''),
									})}
								/>
								<Spacer className='!my-4' />
								<Skeleton className='h-64 w-full' />
								<Spacer className='!my-4' />
								<div className='flex justify-end'>
									<Skeleton className='h-8 w-48' />
								</div>
							</>
						) : (data?.line_items?.length ?? 0) > 0 ? (
							<SubscriptionPreviewLineItemTable
								discount={data?.total_discount}
								subtotal={data?.subtotal}
								invoiceType={data?.invoice_type as INVOICE_TYPE}
								refetch={refetch}
								currency={data?.currency}
								amount_due={data?.amount_due}
								tax={data?.total_tax}
								title={t('subscriptionDetail.upcomingInvoicesTitle')}
								subtitle={t('subscriptionDetail.upcomingInvoicesSubtitle', {
									date: formatDateShort(subscriptionDetails?.current_period_end ?? ''),
								})}
								data={data?.line_items ?? []}
								showZeroCharges={showZeroCharges}
								onShowZeroChargesChange={setShowZeroCharges}
							/>
						) : (
							<>
								<FormHeader
									variant='sub-header'
									titleClassName='font-semibold text-content'
									title={t('subscriptionDetail.upcomingInvoicesTitle')}
									subtitle={t('subscriptionDetail.upcomingInvoicesEmpty', {
										date: formatDateShort(subscriptionDetails?.current_period_end ?? ''),
									})}
								/>
							</>
						)}
					</div>
				)}

			<UpcomingCreditGrantApplicationsTable data={upcomingCreditGrantApplications?.items ?? []} customerId={customerId} />

			{subscription_id && subscriptionDetails?.customer_id && subscriptionDetails?.current_period_start && (
				<SubscriptionDetailChargesSection
					subscriptionId={subscription_id}
					customerId={subscriptionDetails.customer_id}
					currentPeriodStart={subscriptionDetails.current_period_start}
					commitmentInfo={{
						enable_true_up: subscriptionDetails.enable_true_up,
						commitment_amount: subscriptionDetails.commitment_amount,
						overage_factor: subscriptionDetails.overage_factor,
						commitment_duration: subscriptionDetails.commitment_duration,
						currency: subscriptionDetails.currency,
					}}
				/>
			)}

			{subscription_id && subscriptionDetails && (
				<div className='mt-8'>
					<SubscriptionAddonsSection
						subscriptionId={subscription_id}
						readOnly
						subscriptionBillingPeriod={subscriptionDetails.billing_period}
						subscriptionCurrency={subscriptionDetails.currency}
						subscriptionCurrentPeriodStart={subscriptionDetails.current_period_start}
						subscriptionCurrentPeriodEnd={subscriptionDetails.current_period_end}
					/>
				</div>
			)}

			{inheritedSubscriptionRows.length > 0 && (
				<Card className='card mt-8'>
					<FormHeader
						className='mb-0'
						title={t('subscriptionDetail.subscriptionsInheritance')}
						variant='sub-header'
						titleClassName='font-semibold'
					/>
					<div className='mt-4 rounded-[6px] border border-line-strong'>
						<FlexpriceTable data={inheritedSubscriptionRows} columns={inheritedSubscriptionsColumns} />
					</div>
				</Card>
			)}

			{subscription_id && (
				<div className='mt-8'>
					<CouponAssociationTable subscriptionId={subscription_id} />
				</div>
			)}

			{subscriptionTaxAssociations?.items && subscriptionTaxAssociations.items.length > 0 && (
				<div className='mt-8'>
					<TaxAssociationTable data={subscriptionTaxAssociations.items} refetchQueryKey='subscriptionTaxAssociations' />
				</div>
			)}
		</div>
	);
};

export default CustomerSubscriptionDetailsPage;
