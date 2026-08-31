import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams, useLocation } from 'react-router';
import { useMutation, useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';

import { Button, SelectOption } from '@/components/atoms';
import { ApiDocsContent } from '@/components/molecules';
import { API_DOCS_TAGS } from '@/constants/apiDocsTags';
import { UsageTable, SubscriptionForm } from '@/components/organisms';
import { AlertTriangle } from 'lucide-react';

import { AddonApi, CustomerApi, PlanApi, SubscriptionApi, TaxApi, CouponApi } from '@/api';
import { refetchQueries } from '@/core/services/tanstack/ReactQueryProvider';
import { RouteNames } from '@/core/routes/Routes';

import {
	SubscriptionPhase,
	Coupon,
	Customer,
	TAXRATE_ENTITY_TYPE,
	EXPAND,
	BILLING_CYCLE,
	PAYMENT_TERMS,
	SUBSCRIPTION_PRORATION_BEHAVIOR,
	SUBSCRIPTION_STATUS,
	PRICE_TYPE,
	ENTITY_STATUS,
	Price,
} from '@/models';
import { InternalCreditGrantRequest, creditGrantToInternal, internalToCreateRequest } from '@/types/dto/CreditGrant';
import { BILLING_PERIOD, PAYMENT_TERMS_NONE, SANDBOX_AUTO_CANCELLATION_DAYS } from '@/constants/constants';

import {
	CreateSubscriptionRequest,
	AddAddonToSubscriptionRequest,
	TaxRateOverride,
	EntitlementOverrideRequest,
	SearchPricesResponse,
	SubscriptionInheritanceConfig,
} from '@/types/dto';
import { FilterOperator, DataType } from '@/types/common/QueryBuilder';
import { OverrideLineItemRequest, SubscriptionPhaseCreateRequest } from '@/types/dto/Subscription';
import type { AddedSubscriptionLineItem } from '@/components/organisms/Subscription/AddSubscriptionChargeDialog';

import { cn } from '@/lib/utils';
import { toSentenceCase } from '@/utils/common/helper_functions';
import { ExtendedPriceOverride, getLineItemOverrides } from '@/utils/common/price_override_helpers';
import { extractLineItemCommitments } from '@/utils/common/commitment_helpers';
import { sanitizeAddonLineItemCommitmentsForApi, filterAddonPricesForSubscription } from '@/utils/subscription/addon_commitment_helpers';
import { extractSubscriptionBoundaries, extractFirstPhaseData } from '@/utils/subscription/phaseConversion';
import { stripDisplayMeterFromLineItemRequest } from '@/utils/subscription/internalPriceToSubscriptionLineItemRequest';

import { useBreadcrumbsStore } from '@/store/useBreadcrumbsStore';
import { useEnvironment } from '@/hooks/useEnvironment';
import { usePlanPrices } from '@/hooks/usePlanPrices';
import {
	cadenceKey,
	filterPlanPricesForSubscriptionCharges,
	isOneTimePlanPrice,
	partitionPricesForSubscription,
	uniqueRecurringBillingPeriodsFromPrices,
} from '@/utils/subscription/planPricesForSubscriptionUi';

const SANDBOX_END_DATE_FORMAT: Intl.DateTimeFormatOptions = {
	year: 'numeric',
	month: 'long',
	day: 'numeric',
};

function subscriptionChargesHaveFixedPrice(
	prices: SearchPricesResponse | null,
	billingPeriod: BILLING_PERIOD,
	currency: string,
	isPriceActiveFn: (price: { start_date?: string }) => boolean,
): boolean {
	const activeItems = prices?.items?.filter(isPriceActiveFn) ?? [];
	const filtered = filterPlanPricesForSubscriptionCharges(activeItems, billingPeriod, currency);
	return filtered.some((p) => p.type === PRICE_TYPE.FIXED);
}

type Params = {
	id?: string;
	subscription_id?: string;
};

type CreateSubscriptionLocationState = {
	returnTo?: string;
};

export enum SubscriptionPhaseState {
	EDIT = 'edit',
	SAVED = 'saved',
	NEW = 'new',
}

export type SubscriptionFormState = {
	selectedPlan: string;
	prices: SearchPricesResponse | null;
	billingPeriod: BILLING_PERIOD;
	currency: string;
	billingPeriodOptions: SelectOption[];
	billingCycle: BILLING_CYCLE;
	billingAnchor?: string;
	commitmentAmount: string;
	overageFactor: string;
	startDate: string;
	endDate?: string;
	phases: SubscriptionPhaseCreateRequest[];
	selectedPhase: number;
	phaseStates: SubscriptionPhaseState[];
	isPhaseEditing: boolean;
	originalPhases: SubscriptionPhase[];
	priceOverrides: Record<string, ExtendedPriceOverride>;
	linkedCoupon: Coupon | null;
	lineItemCoupons: Record<string, Coupon>;
	addons?: AddAddonToSubscriptionRequest[];
	customerId: string;
	tax_rate_overrides: TaxRateOverride[];
	entitlementOverrides: Record<string, EntitlementOverrideRequest>;
	creditGrants: InternalCreditGrantRequest[];
	enable_true_up: boolean;
	commitmentDuration: string;
	/** Billing customer (serialized as inheritance.invoicing_customer_external_id on create) */
	invoicingCustomer?: Customer;
	paymentTerms?: string;
	/** When true, create payload sends proration_behavior CREATE_PRORATIONS; when false, sends NONE */
	prorationCreateLineItems: boolean;
	hasModifiedPlanCreditGrants?: boolean;
	addedSubscriptionLineItems: AddedSubscriptionLineItem[];
	/** Customers that should receive inherited child subscriptions (serialized as external IDs on create) */
	inheritanceCustomers: Customer[];
	/** Set to send `trial_period_days`; leave empty to omit (inherit from plan). */
	subscriptionTrialPeriodDays: string;
	/** Set to send `auto_invoice_threshold` when plan has no FIXED charges; leave empty to omit. */
	autoInvoiceThreshold: string;
	/**
	 * Cadence keys (`period:count`, e.g. "MONTHLY:1") the user opted in from the
	 * "Also available on this plan" section. Each opted-in cadence pulls **all**
	 * plan prices of that cadence into the main Charges table. Empty = user
	 * accepted the default (exact cadence + ONETIME only).
	 * On submit: if non-empty, we send `include_price_ids = [primary_ids +
	 * every_price_in_opted_in_cadences]` so backend attaches exactly the user's selection.
	 */
	optedInAdditionalCadences: string[];
};

const usePlans = () => {
	return useQuery({
		queryKey: ['plans'],
		queryFn: async () => {
			const plansResponse = await PlanApi.getPlansByFilter({
				limit: 1000,
				offset: 0,
				filters: [
					{
						field: 'status',
						operator: FilterOperator.EQUAL,
						data_type: DataType.STRING,
						value: { string: 'published' },
					},
				],
				sort: [],
			});

			return plansResponse.items;
		},
	});
};

const useCustomerData = (customerId: string | undefined) => {
	return useQuery({
		queryKey: ['customerSubscription', customerId],
		queryFn: () => CustomerApi.getCustomerById(customerId!),
		enabled: !!customerId,
	});
};

const useSubscriptionData = (subscription_id: string | undefined) => {
	return useQuery({
		queryKey: ['subscription', subscription_id],
		queryFn: async () => {
			const [details, usage] = await Promise.all([
				CustomerApi.getCustomerSubscriptionById(subscription_id!),
				SubscriptionApi.getSubscriptionUsage(subscription_id!),
			]);
			return { details, usage };
		},
		enabled: !!subscription_id,
	});
};

const useAddons = (addonIds: string[]) => {
	return useQuery({
		queryKey: ['addons', addonIds],
		queryFn: async () => {
			if (addonIds.length === 0) return { items: [] };
			const response = await AddonApi.List({ limit: 1000, offset: 0 });
			const filteredItems = response.items.filter((addon) => addonIds.includes(addon.id));
			return { ...response, items: filteredItems };
		},
		enabled: addonIds.length > 0,
		staleTime: 5 * 60 * 1000,
		refetchOnWindowFocus: false,
	});
};

const usePlanDetails = (planId: string | undefined) => {
	const planQuery = useQuery({
		queryKey: ['planDetails', planId],
		queryFn: async () => {
			if (!planId) return null;
			const response = await PlanApi.getPlansByFilter({
				limit: 1,
				offset: 0,
				filters: [
					{
						field: 'id',
						operator: FilterOperator.EQUAL,
						data_type: DataType.STRING,
						value: { string: planId },
					},
				],
				sort: [],
			});
			return response.items[0] ?? null;
		},
		enabled: !!planId,
		staleTime: 5 * 60 * 1000,
		refetchOnWindowFocus: false,
	});

	const pricesQuery = usePlanPrices(planId);

	return {
		data: planQuery.data,
		prices: pricesQuery.data,
		isLoading: planQuery.isLoading || pricesQuery.isLoading,
		isError: planQuery.isError || pricesQuery.isError,
	};
};

const CreateCustomerSubscriptionPage: React.FC = () => {
	const { t } = useTranslation(['customers', 'common']);
	const { id: urlCustomerId, subscription_id } = useParams<Params>();
	const navigate = useNavigate();
	const location = useLocation();
	const updateBreadcrumb = useBreadcrumbsStore((state) => state.updateBreadcrumb);
	const returnTo = (location.state as CreateSubscriptionLocationState | null)?.returnTo;

	const [selectedCustomer, setSelectedCustomer] = useState<Customer | undefined>();
	const effectiveCustomerId = urlCustomerId ?? selectedCustomer?.id;
	const showCustomerPicker = !urlCustomerId;

	const [isDraft, setIsDraft] = useState(false);
	const { data: customerTaxAssociations } = useQuery({
		queryKey: ['customerTaxAssociations', effectiveCustomerId],
		queryFn: async () => {
			return await TaxApi.listTaxAssociations({
				limit: 100,
				offset: 0,
				entity_id: effectiveCustomerId!,
				expand: EXPAND.TAX_RATE,
				entity_type: TAXRATE_ENTITY_TYPE.CUSTOMER,
			});
		},
		enabled: !!effectiveCustomerId,
	});

	useEffect(() => {
		if (customerTaxAssociations?.items) {
			setSubscriptionState((prev) => ({
				...prev,
				tax_rate_overrides: customerTaxAssociations.items
					.filter((item) => item.tax_rate?.status === ENTITY_STATUS.PUBLISHED)
					.map((item) => ({
						tax_rate_id: item.tax_rate_id,
						tax_rate_code: item.tax_rate?.code ?? '',
						currency: item.currency.toLowerCase(),
						auto_apply: item.auto_apply,
						priority: item.priority,
						tax_rate_name: item.tax_rate?.name ?? '',
					})),
			}));
		}
	}, [customerTaxAssociations]);

	const [subscriptionState, setSubscriptionState] = useState<SubscriptionFormState>({
		selectedPlan: '',
		prices: null,
		billingPeriod: BILLING_PERIOD.MONTHLY,
		currency: '',
		billingPeriodOptions: [],
		billingCycle: BILLING_CYCLE.ANNIVERSARY,
		billingAnchor: undefined,
		commitmentAmount: '',
		overageFactor: '',
		startDate: new Date().toISOString(),
		endDate: undefined,
		phases: [],
		selectedPhase: 0,
		phaseStates: [],
		isPhaseEditing: false,
		originalPhases: [],
		priceOverrides: {},
		linkedCoupon: null,
		lineItemCoupons: {},
		addons: [],
		customerId: urlCustomerId ?? '',
		tax_rate_overrides: [],
		entitlementOverrides: {},
		creditGrants: [],
		enable_true_up: false,
		commitmentDuration: BILLING_PERIOD.MONTHLY.toUpperCase(),
		invoicingCustomer: undefined,
		paymentTerms: undefined,
		prorationCreateLineItems: false,
		hasModifiedPlanCreditGrants: false,
		addedSubscriptionLineItems: [],
		inheritanceCustomers: [],
		subscriptionTrialPeriodDays: '',
		autoInvoiceThreshold: '',
		optedInAdditionalCadences: [],
	});

	const { data: plans, isLoading: plansLoading, isError: plansError } = usePlans();
	const { data: customerData } = useCustomerData(effectiveCustomerId);
	const { data: subscriptionData } = useSubscriptionData(subscription_id);
	const {
		data: planDetails,
		prices,
		isLoading: isLoadingPlanDetails,
		isError: isPlanDetailsError,
	} = usePlanDetails(subscriptionState.selectedPlan);
	const { isDevelopment } = useEnvironment();

	const { data: couponsResponse } = useQuery({
		queryKey: ['coupons'],
		queryFn: () => CouponApi.getAllCoupons({ limit: 1000, offset: 0 }),
		staleTime: 5 * 60 * 1000,
		refetchOnWindowFocus: false,
	});
	const allCouponsData = couponsResponse?.items || [];

	const addonIds = useMemo(() => subscriptionState.addons?.map((addon) => addon.addon_id) || [], [subscriptionState.addons]);
	const { data: addonsData } = useAddons(addonIds);

	const isPriceActive = (price: { start_date?: string }) => {
		if (!price.start_date) return true;
		const now = new Date();
		const startDate = new Date(price.start_date);
		if (isNaN(startDate.getTime())) return true;
		return startDate <= now;
	};

	const navigateAfterAction = () => {
		if (returnTo === RouteNames.subscriptions) {
			navigate(RouteNames.subscriptions);
			return;
		}
		if (effectiveCustomerId) {
			navigate(`${RouteNames.customers}/${effectiveCustomerId}`);
		}
	};

	const handleCustomerChange = (customer: Customer | undefined) => {
		setSelectedCustomer(customer);
		if (!customer) return;

		setSubscriptionState((prev) => ({
			...prev,
			customerId: customer.id,
		}));
	};

	useEffect(() => {
		if (customerData?.external_id) {
			updateBreadcrumb(2, customerData.external_id);
		}
	}, [customerData, updateBreadcrumb]);

	// Initialize subscription state from existing subscription data
	useEffect(() => {
		if (subscriptionData?.details) {
			setSubscriptionState((prev) => ({
				...prev,
				selectedPlan: subscriptionData.details.plan_id,
				billingPeriod: subscriptionData.details.billing_period.toLowerCase() as BILLING_PERIOD,
				currency: subscriptionData.details.currency,
				billingCycle: subscriptionData.details.billing_cycle || BILLING_CYCLE.ANNIVERSARY,
				billingAnchor: undefined,
				startDate: subscriptionData.details.start_date,
				endDate: subscriptionData.details.end_date || undefined,
				commitmentAmount: subscriptionData.details.commitment_amount?.toString() ?? '',
				overageFactor: subscriptionData.details.overage_factor?.toString() ?? '',
				phases: [],
				selectedPhase: -1,
				phaseStates: [],
				isPhaseEditing: false,
				originalPhases: [],
				priceOverrides: {},
				linkedCoupon: null,
				lineItemCoupons: {},
				addons: [],
				customerId: urlCustomerId ?? '',
				tax_rate_overrides: [],
				entitlementOverrides: {},
				creditGrants: (subscriptionData.details.credit_grants || []).map(creditGrantToInternal),
				enable_true_up: (subscriptionData.details as any).enable_true_up ?? false,
				inheritanceCustomers: [],
				...(() => {
					const tpd = (subscriptionData.details as { trial_period_days?: number | null }).trial_period_days;
					if (typeof tpd === 'number' && tpd > 0) {
						return { subscriptionTrialPeriodDays: String(tpd) };
					}
					return { subscriptionTrialPeriodDays: '' };
				})(),
				...(() => {
					const ait = (subscriptionData.details as { auto_invoice_threshold?: number | null }).auto_invoice_threshold;
					if (typeof ait === 'number' && Number.isFinite(ait)) {
						return { autoInvoiceThreshold: String(ait) };
					}
					return { autoInvoiceThreshold: '' };
				})(),
				...(() => {
					const ait = (subscriptionData.details as { auto_invoice_threshold?: number | null }).auto_invoice_threshold;
					if (typeof ait === 'number' && Number.isFinite(ait)) {
						return { autoInvoiceThresholdEnabled: true, autoInvoiceThreshold: String(ait) };
					}
					return { autoInvoiceThresholdEnabled: false, autoInvoiceThreshold: '' };
				})(),
			}));
		}
	}, [subscriptionData, effectiveCustomerId]);

	// Sync plan details from usePlanDetails hook to state
	useEffect(() => {
		if (planDetails && prices) {
			const items = prices.items || [];
			const billingPeriods = uniqueRecurringBillingPeriodsFromPrices(items);
			const billingPeriodOptions = billingPeriods.map((period) => ({
				label: toSentenceCase(period as string),
				value: period,
			}));

			setSubscriptionState((prev) => {
				// Determine the billing period to use (recurring only; ONETIME is never selectable)
				const currentBillingPeriod = prev.billingPeriod;
				const isValidBillingPeriod =
					currentBillingPeriod && billingPeriods.some((bp) => (bp as string).toLowerCase() === currentBillingPeriod.toLowerCase());
				const selectedBillingPeriod = isValidBillingPeriod
					? currentBillingPeriod
					: ((billingPeriods[0] as string)?.toLowerCase() as BILLING_PERIOD) || currentBillingPeriod;

				// Currencies for the selected recurring period; if none (e.g. plan is one-time only), use one-time price currencies
				const recurringForPeriod = items.filter(
					(price) => !isOneTimePlanPrice(price) && price.billing_period.toLowerCase() === selectedBillingPeriod.toLowerCase(),
				);
				const currencySource = recurringForPeriod.length > 0 ? recurringForPeriod : items.filter(isOneTimePlanPrice);
				const availableCurrencies = [...new Set(currencySource.map((price) => price.currency))];

				const currentCurrency = prev.currency;
				const isValidCurrency = currentCurrency && availableCurrencies.includes(currentCurrency);
				const selectedCurrency = isValidCurrency ? currentCurrency : availableCurrencies[0] || currentCurrency;

				return {
					...prev,
					prices: prices,
					billingPeriodOptions,
					billingPeriod: selectedBillingPeriod,
					currency: selectedCurrency,
					commitmentDuration: selectedBillingPeriod.toUpperCase(),
				};
			});
		}
	}, [planDetails, prices]);

	const { mutate: createSubscription, isPending: isCreating } = useMutation({
		mutationKey: ['createSubscription'],
		mutationFn: async (data: CreateSubscriptionRequest) => {
			return await SubscriptionApi.createSubscription(data);
		},
		onSuccess: async (_, variables) => {
			const isDraft = variables.subscription_status === SUBSCRIPTION_STATUS.DRAFT;
			toast.success(isDraft ? t('subscriptionCreate.toast.draftSaved') : t('subscriptionCreate.toast.created'));

			refetchQueries(['debug-customers']);
			refetchQueries(['debug-subscriptions']);
			refetchQueries(['fetchSubscriptions']);

			navigateAfterAction();
		},
		onError: (error: Error) => {
			toast.error(error.message || t('subscriptionCreate.toast.error'));
		},
	});

	/**
	 * Validates subscription form data before submission
	 */
	const validateSubscriptionData = (): string | null => {
		const { billingPeriod, selectedPlan, startDate, phases } = subscriptionState;

		if (!billingPeriod || !selectedPlan) {
			return t('subscriptionCreate.validation.planAndPeriod');
		}

		if (!startDate) {
			return t('subscriptionCreate.validation.startDate');
		}

		for (let i = 0; i < phases.length; i++) {
			if (!phases[i].start_date) {
				return t('subscriptionCreate.validation.phaseStartDate', { phase: i + 1 });
			}
		}

		if (subscriptionState.isPhaseEditing) {
			return t('subscriptionCreate.validation.saveEditsFirst');
		}

		const trialRaw = subscriptionState.subscriptionTrialPeriodDays.trim();
		if (trialRaw !== '') {
			const n = parseInt(trialRaw, 10);
			if (!Number.isFinite(n) || n < 1) {
				return t('subscriptionCreate.validation.trialDays');
			}
		}

		const hasFixedCharges = subscriptionChargesHaveFixedPrice(
			subscriptionState.prices,
			subscriptionState.billingPeriod,
			subscriptionState.currency,
			isPriceActive,
		);
		const thresholdRaw = subscriptionState.autoInvoiceThreshold.trim();
		if (thresholdRaw !== '') {
			if (hasFixedCharges) {
				return t('subscriptionCreate.validation.autoThresholdFixed');
			}
			const n = parseFloat(thresholdRaw);
			if (!Number.isFinite(n) || n < 0) {
				return t('subscriptionCreate.validation.autoThresholdNonNegative');
			}
		}

		const hasEntitlementOverrides = Object.keys(subscriptionState.entitlementOverrides).length > 0;
		if (hasEntitlementOverrides && subscriptionState.prorationCreateLineItems) {
			return t('subscriptionCreate.validation.entitlementOverridesWithProration');
		}

		return null;
	};

	/**
	 * Sanitizes and prepares subscription data for API submission.
	 *
	 * IMPORTANT: During sanitization, quantity is automatically excluded from line item
	 * overrides for USAGE type prices. This is because usage-based prices calculate quantity
	 * dynamically from meter usage, and including a static quantity override would conflict
	 * with the usage-based billing model. The getLineItemOverrides helper function handles
	 * this exclusion automatically.
	 */
	const sanitizeSubscriptionData = () => {
		const {
			billingPeriod,
			selectedPlan,
			currency,
			billingCycle,
			billingAnchor,
			startDate,
			endDate,
			phases,
			priceOverrides,
			prices,
			linkedCoupon,
			lineItemCoupons,
			tax_rate_overrides,
			overageFactor,
			commitmentAmount,
			entitlementOverrides,
			creditGrants,
			invoicingCustomer,
			paymentTerms,
			addedSubscriptionLineItems,
			customerId: formCustomerId,
			inheritanceCustomers,
			subscriptionTrialPeriodDays,
			autoInvoiceThreshold,
			optedInAdditionalCadences,
		} = subscriptionState;

		const hasFixedSubscriptionChargePrice = subscriptionChargesHaveFixedPrice(prices, billingPeriod, currency, isPriceActive);

		let finalStartDate: string;
		let finalEndDate: string | undefined;
		let finalCoupons: string[] | undefined;
		let finalLineItemCoupons: Record<string, string[]> | undefined;
		let finalOverrideLineItems: OverrideLineItemRequest[] | undefined;
		let finalLineItemCommitments: Record<string, any> | undefined;
		let sanitizedPhases: SubscriptionPhaseCreateRequest[] | undefined;
		/**
		 * When user opted in additional-cadence prices, send the full authoritative list
		 * `[primary_ids + opted_in_ids]` so backend attaches exactly those. When user made
		 * no selection, omit — backend applies its default (exact cadence + ONETIME).
		 * Phases path is not opted into per-price selection in this iteration; leaves
		 * include_price_ids unset for phases (backend default per phase).
		 */
		let finalIncludePriceIds: string[] | undefined;

		if (phases.length > 0) {
			// Multi-phase subscription: extract data from phases
			const boundaries = extractSubscriptionBoundaries(phases);
			finalStartDate = boundaries.startDate;
			finalEndDate = boundaries.endDate;

			const firstPhaseData = extractFirstPhaseData(phases);
			finalCoupons = firstPhaseData.coupons;
			finalLineItemCoupons = firstPhaseData.line_item_coupons;
			finalOverrideLineItems = firstPhaseData.override_line_items;

			// Commitments are subscription-level only; phases do not have line_item_commitments per backend
			finalLineItemCommitments = undefined;

			// Sanitize phases (quantity exclusion for USAGE prices handled in PhaseList conversion)
			sanitizedPhases = phases.map((phase) => ({
				start_date: phase.start_date,
				end_date: phase.end_date || undefined,
				coupons: phase.coupons || undefined,
				line_item_coupons: phase.line_item_coupons || undefined,
				override_line_items: phase.override_line_items || undefined,
				metadata: phase.metadata || undefined,
			}));
		} else {
			// Single-phase subscription: use subscription-level data
			finalStartDate = new Date(startDate).toISOString();
			finalEndDate = endDate ? new Date(endDate).toISOString() : undefined;

			// Plan prices for selected recurring period + currency, plus all one-time plan prices in that currency
			const activeItems = prices?.items?.filter((price) => isPriceActive(price)) || [];
			const currentPrices = filterPlanPricesForSubscriptionCharges(activeItems, billingPeriod, currency);

			// Only send include_price_ids when the user opted in at least one additional-cadence
			// bucket. Full authoritative list = primary partition IDs + every additional price
			// whose (period, count) cadence key matches one of the opted-in cadences.
			if (optedInAdditionalCadences.length > 0) {
				const optedSet = new Set(optedInAdditionalCadences);
				const { primary, additional } = partitionPricesForSubscription(activeItems, billingPeriod, 1, currency);
				const optedInPrices = additional.filter((p) => optedSet.has(cadenceKey(p.billing_period, p.billing_period_count)));
				finalIncludePriceIds = [...primary.map((p) => p.id), ...optedInPrices.map((p) => p.id)];
			}

			// Convert price overrides to line item overrides
			// Note: getLineItemOverrides automatically excludes quantity for USAGE type prices
			finalOverrideLineItems = getLineItemOverrides(currentPrices, priceOverrides);

			// Extract line item commitments from price overrides (time buckets enriched for API)
			const commitments = extractLineItemCommitments(priceOverrides, { prices: currentPrices });
			finalLineItemCommitments = Object.keys(commitments).length > 0 ? commitments : undefined;

			finalCoupons = linkedCoupon ? [linkedCoupon.id] : undefined;
			finalLineItemCoupons =
				Object.keys(lineItemCoupons).length > 0
					? Object.fromEntries(Object.entries(lineItemCoupons).map(([priceId, coupon]) => [priceId, [coupon.id]]))
					: undefined;

			sanitizedPhases = undefined;
		}

		const addonsById = new Map((addonsData?.items ?? []).map((addon) => [addon.id, addon]));
		const sanitizedAddons =
			subscriptionState.addons && subscriptionState.addons.length > 0
				? subscriptionState.addons.map((addon: AddAddonToSubscriptionRequest) => {
						const addonDetails = addonsById.get(addon.addon_id);
						const prices = filterAddonPricesForSubscription(addonDetails?.prices as Price[] | undefined, billingPeriod, currency);
						const line_item_commitments = sanitizeAddonLineItemCommitmentsForApi(addon.line_item_commitments, prices);
						return {
							...addon,
							line_item_commitments,
						};
					})
				: undefined;

		const inheritanceExternalIds = inheritanceCustomers.map((c) => c.external_id?.trim()).filter((id): id is string => Boolean(id));

		const invoicingCustomerExternalId =
			invoicingCustomer?.id && invoicingCustomer.id !== formCustomerId && invoicingCustomer.external_id?.trim()
				? invoicingCustomer.external_id.trim()
				: undefined;

		const trialTrimmed = subscriptionTrialPeriodDays.trim();
		let trial_period_days: number | undefined;
		if (trialTrimmed !== '') {
			const n = parseInt(trialTrimmed, 10);
			if (Number.isFinite(n) && n >= 1) {
				trial_period_days = n;
			}
		}

		let auto_invoice_threshold: number | undefined;
		const thresholdTrimmed = autoInvoiceThreshold.trim();
		if (thresholdTrimmed !== '' && !hasFixedSubscriptionChargePrice) {
			const parsed = parseFloat(thresholdTrimmed);
			if (Number.isFinite(parsed) && parsed >= 0) {
				auto_invoice_threshold = parsed;
			}
		}

		return {
			billingPeriod,
			selectedPlan,
			currency,
			billingCycle,
			billingAnchor: billingAnchor ? new Date(billingAnchor) : undefined,
			finalStartDate,
			finalEndDate,
			finalCoupons,
			finalLineItemCoupons,
			finalOverrideLineItems,
			finalLineItemCommitments,
			sanitizedPhases,
			tax_rate_overrides,
			overageFactor,
			commitmentAmount,
			commitmentDuration: subscriptionState.commitmentDuration,
			entitlementOverrides,
			creditGrants,
			invoicingCustomerExternalId,
			paymentTerms,
			sanitizedAddons,
			addedSubscriptionLineItems,
			inheritanceExternalIds,
			trial_period_days,
			auto_invoice_threshold,
			finalIncludePriceIds,
		};
	};

	const handleSubscriptionSubmit = async (isDraftParam: boolean = false) => {
		// Validate form data
		const validationError = validateSubscriptionData();
		if (validationError) {
			toast.error(validationError);
			return;
		}

		// Sanitize subscription data
		const sanitized = sanitizeSubscriptionData();

		const { invoicingCustomer, customerId: formCustomerId } = subscriptionState;

		// Billing customer must be sent as inheritance.invoicing_customer_external_id. Search results
		// may omit external_id; resolve the full customer before building the payload.
		let invoicingCustomerExternalId = sanitized.invoicingCustomerExternalId;
		if (invoicingCustomer?.id && invoicingCustomer.id !== formCustomerId) {
			let ext: string | undefined = invoicingCustomer.external_id?.trim();
			if (!ext) {
				try {
					const full = await CustomerApi.getCustomerById(invoicingCustomer.id);
					ext = full.external_id?.trim() || undefined;
				} catch {
					toast.error(t('subscriptionCreate.billingCustomer.loadFailed'));
					return;
				}
			}
			invoicingCustomerExternalId = ext;
			if (!invoicingCustomerExternalId) {
				toast.error(t('subscriptionCreate.billingCustomer.missingExternalId'));
				return;
			}
		}

		const inheritancePayload: SubscriptionInheritanceConfig = {};
		if (sanitized.inheritanceExternalIds.length > 0) {
			inheritancePayload.external_customer_ids_to_inherit_subscription = sanitized.inheritanceExternalIds;
		}
		if (invoicingCustomerExternalId) {
			inheritancePayload.invoicing_customer_external_id = invoicingCustomerExternalId;
		}

		// Build API payload
		const payload: CreateSubscriptionRequest = {
			billing_period: sanitized.billingPeriod.toUpperCase() as BILLING_PERIOD,
			billing_period_count: 1,
			billing_cycle: sanitized.billingCycle,
			billing_anchor: sanitized.billingAnchor,
			currency: sanitized.currency.toLowerCase(),
			customer_id: effectiveCustomerId!,
			plan_id: sanitized.selectedPlan,
			start_date: sanitized.finalStartDate,
			end_date: sanitized.finalEndDate,
			commitment_amount:
				sanitized.commitmentAmount && sanitized.commitmentAmount.trim() !== '' ? parseFloat(sanitized.commitmentAmount) : undefined,
			overage_factor: sanitized.overageFactor && sanitized.overageFactor.trim() !== '' ? parseFloat(sanitized.overageFactor) : undefined,
			lookup_key: '',
			phases: sanitized.sanitizedPhases,
			override_line_items:
				sanitized.finalOverrideLineItems && sanitized.finalOverrideLineItems.length > 0 ? sanitized.finalOverrideLineItems : undefined,
			line_item_commitments: sanitized.finalLineItemCommitments,
			addons: sanitized.sanitizedAddons,
			coupons: sanitized.finalCoupons,
			line_item_coupons: sanitized.finalLineItemCoupons,
			tax_rate_overrides: sanitized.tax_rate_overrides.length > 0 ? sanitized.tax_rate_overrides : undefined,
			override_entitlements:
				Object.keys(sanitized.entitlementOverrides).length > 0 ? Object.values(sanitized.entitlementOverrides) : undefined,
			credit_grants:
				// If plan-level grants were modified, send the array (even if empty to override)
				subscriptionState.hasModifiedPlanCreditGrants
					? sanitized.creditGrants.map(internalToCreateRequest)
					: // Otherwise, only send if there are subscription-level grants
						sanitized.creditGrants.length > 0
						? sanitized.creditGrants.map(internalToCreateRequest)
						: undefined,
			enable_true_up: subscriptionState.enable_true_up,
			commitment_duration: sanitized.commitmentDuration ? (sanitized.commitmentDuration as BILLING_PERIOD) : undefined,
			subscription_status: isDraftParam ? SUBSCRIPTION_STATUS.DRAFT : undefined,
			proration_behavior: subscriptionState.prorationCreateLineItems
				? SUBSCRIPTION_PRORATION_BEHAVIOR.CREATE_PRORATIONS
				: SUBSCRIPTION_PRORATION_BEHAVIOR.NONE,
			payment_terms:
				sanitized.paymentTerms && sanitized.paymentTerms !== PAYMENT_TERMS_NONE ? (sanitized.paymentTerms as PAYMENT_TERMS) : undefined,
			line_items: (() => {
				if (sanitized.sanitizedPhases) return undefined;
				// Window commitment buckets are sanitized in AddSubscriptionChargeDialog (with meter context).
				const addedItems =
					sanitized.addedSubscriptionLineItems?.map(({ tempId: _tempId, ...req }) => stripDisplayMeterFromLineItemRequest(req)) ?? [];
				return addedItems.length > 0 ? addedItems : undefined;
			})(),
			inheritance: Object.keys(inheritancePayload).length > 0 ? inheritancePayload : undefined,
			...(sanitized.trial_period_days !== undefined ? { trial_period_days: sanitized.trial_period_days } : {}),
			...(sanitized.auto_invoice_threshold !== undefined ? { auto_invoice_threshold: sanitized.auto_invoice_threshold } : {}),
			...(sanitized.finalIncludePriceIds !== undefined ? { include_price_ids: sanitized.finalIncludePriceIds } : {}),
		};

		setIsDraft(isDraftParam);
		createSubscription(payload);
	};

	const handleDraftSubmit = () => {
		handleSubscriptionSubmit(true);
	};

	const handleRegularSubmit = () => {
		handleSubscriptionSubmit(false);
	};

	const navigateBack = navigateAfterAction;

	return (
		<div className={cn('flex gap-8 mt-5 relative mb-12')}>
			<ApiDocsContent tags={API_DOCS_TAGS.SubscriptionsOnly} />
			<div className='flex-[6] space-y-6 mb-12 overflow-y-auto pr-4'>
				{subscriptionData?.usage?.charges && subscriptionData.usage.charges.length > 0 && (
					<div>
						<UsageTable data={subscriptionData.usage} />
					</div>
				)}

				<SubscriptionForm
					state={subscriptionState}
					setState={setSubscriptionState}
					plans={plans}
					plansLoading={plansLoading}
					plansError={plansError}
					isLoadingPlanDetails={isLoadingPlanDetails}
					isPlanDetailsError={isPlanDetailsError}
					isDisabled={!!subscription_id}
					phases={subscriptionState.phases}
					onPhasesChange={(newPhases) => {
						setSubscriptionState((prev) => ({
							...prev,
							phases: newPhases,
						}));
					}}
					allCoupons={allCouponsData}
					subscriberCustomer={customerData}
					customerPicker={
						showCustomerPicker
							? {
									value: selectedCustomer,
									onChange: handleCustomerChange,
									hint: t('subscriptionCreate.selectCustomerHint'),
								}
							: undefined
					}
				/>

				{/* Sandbox Note */}
				{effectiveCustomerId && isDevelopment && subscriptionState.selectedPlan && subscriptionState.startDate && (
					<div className='w-full flex items-center gap-2.5 rounded-md border border-warning-line-strong bg-warning-muted/80 px-3 py-2.5'>
						<AlertTriangle className='h-4 w-4 flex-shrink-0 text-warning' />
						<span className='text-sm font-medium text-warning-deep leading-relaxed'>
							{t('subscriptionCreate.sandboxNotice', {
								date: new Date(
									new Date(subscriptionState.startDate).getTime() + SANDBOX_AUTO_CANCELLATION_DAYS * 24 * 60 * 60 * 1000,
								).toLocaleDateString('en-US', SANDBOX_END_DATE_FORMAT),
								days: SANDBOX_AUTO_CANCELLATION_DAYS,
							})}
						</span>
					</div>
				)}

				{effectiveCustomerId && subscriptionState.selectedPlan && !subscription_id && (
					<div className='flex items-center justify-between'>
						<div className='flex items-center space-x-4'>
							<Button onClick={navigateBack} variant={'outline'} disabled={isCreating}>
								{t('common:actions.cancel')}
							</Button>
							<Button onClick={handleDraftSubmit} isLoading={isCreating && isDraft} variant={'outline'} disabled={isCreating}>
								{t('subscriptionCreate.saveAsDraft')}
							</Button>
						</div>
						<Button onClick={handleRegularSubmit} isLoading={isCreating && !isDraft} disabled={isCreating}>
							{t('common:actions.add')}
						</Button>
					</div>
				)}
			</div>

			<div className='flex-[4]'></div>
		</div>
	);
};

export default CreateCustomerSubscriptionPage;
