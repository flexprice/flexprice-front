// Data layer for the pricing widget's dashboard container.
//
// This hook owns all network access (plans, prices, entitlements, credit grants) so the UI
// components stay prop-only. When the widget is later published for external consumers, this
// hook is what gets swapped for an injected API client + publishable key.

import { useQuery } from '@tanstack/react-query';
import { PlanApi, type GetAllPlansResponse } from '@/api/PlanApi';
import { PriceApi } from '@/api/PriceApi';
import EntitlementApi from '@/api/EntitlementApi';
import CreditGrantApi from '@/api/CreditGrantApi';
import { FilterOperator, DataType } from '@/types/common/QueryBuilder';
import { PriceResponse, EntitlementResponse } from '@/types';
import { PRICE_ENTITY_TYPE, ENTITLEMENT_ENTITY_TYPE, ENTITY_STATUS, CREDIT_GRANT_SCOPE, type CreditGrant } from '@/models';
import { generateExpandQueryParams } from '@/utils/common/api_helper';
import { EXPAND } from '@/models/expand';
import {
	validateResponseItems,
	planItemSchema,
	priceItemSchema,
	entitlementItemSchema,
	creditGrantItemSchema,
} from './pricingResponseSchemas';

const PAGE_SIZE = 500;
/** Per-plan list calls match PlanCreditGrantsTab; multi-ID GET can be unreliable on some backends. */
const PLAN_CREDIT_GRANT_FETCH_CHUNK = 12;
const PLAN_CREDIT_GRANT_LIST_LIMIT = 500;
/** Hard cap on paginated page requests so a misbehaving backend can't loop forever. */
const MAX_PAGES = 40;

export interface UsePricingDataResult {
	plansData?: GetAllPlansResponse;
	allPrices: PriceResponse[];
	allEntitlements: EntitlementResponse[];
	creditGrants: CreditGrant[];
	isLoading: boolean;
	isError: boolean;
}

export function usePricingData(): UsePricingDataResult {
	const {
		data: plansData,
		isLoading: isLoadingPlans,
		isError: isErrorPlans,
	} = useQuery<GetAllPlansResponse>({
		queryKey: ['fetchPlansPricingCard'],
		queryFn: async () => {
			const items: GetAllPlansResponse['items'] = [];
			let pageOffset = 0;
			let pagination: GetAllPlansResponse['pagination'] | undefined;
			for (let p = 0; p < MAX_PAGES; p++) {
				const response = await PlanApi.getPlansByFilter({
					limit: PAGE_SIZE,
					offset: pageOffset,
					filters: [{ field: 'status', operator: FilterOperator.EQUAL, data_type: DataType.STRING, value: { string: 'published' } }],
					sort: [],
				});
				items.push(...(response.items ?? []));
				pagination = response.pagination;
				if ((response.items ?? []).length < PAGE_SIZE) break;
				const total = response.pagination?.total;
				if (total != null && pageOffset + response.items.length >= total) break;
				pageOffset += PAGE_SIZE;
			}
			return { items, pagination: pagination ?? {} };
		},
	});

	const planIds = plansData?.items?.map((p) => p.id) ?? [];
	const hasPlans = planIds.length > 0;

	const {
		data: allPricesData,
		isLoading: isLoadingPrices,
		isError: isErrorPrices,
	} = useQuery({
		queryKey: ['fetchAllPricesForPlans', planIds],
		queryFn: async () => {
			const items: PriceResponse[] = [];
			let pageOffset = 0;
			for (let p = 0; p < MAX_PAGES; p++) {
				const response = await PriceApi.searchPrices({
					filters: [
						{ field: 'entity_type', operator: FilterOperator.EQUAL, data_type: DataType.STRING, value: { string: PRICE_ENTITY_TYPE.PLAN } },
						{ field: 'entity_id', operator: FilterOperator.IN, data_type: DataType.ARRAY, value: { array: planIds } },
						{ field: 'status', operator: FilterOperator.EQUAL, data_type: DataType.STRING, value: { string: ENTITY_STATUS.PUBLISHED } },
					],
					limit: PAGE_SIZE,
					offset: pageOffset,
				});
				items.push(...response.items);
				if (response.items.length < PAGE_SIZE) break;
				const total = response.pagination?.total;
				if (total != null && pageOffset + response.items.length >= total) break;
				pageOffset += PAGE_SIZE;
			}
			return { items };
		},
		enabled: hasPlans,
	});

	const {
		data: allEntitlementsData,
		isLoading: isLoadingEntitlements,
		isError: isErrorEntitlements,
	} = useQuery({
		queryKey: ['fetchAllEntitlementsForPlans', planIds],
		queryFn: async () => {
			const items: EntitlementResponse[] = [];
			let pageOffset = 0;
			for (let p = 0; p < MAX_PAGES; p++) {
				const response = await EntitlementApi.search({
					filters: [
						{
							field: 'entity_type',
							operator: FilterOperator.EQUAL,
							data_type: DataType.STRING,
							value: { string: ENTITLEMENT_ENTITY_TYPE.PLAN },
						},
						{ field: 'entity_id', operator: FilterOperator.IN, data_type: DataType.ARRAY, value: { array: planIds } },
					],
					status: ENTITY_STATUS.PUBLISHED,
					limit: PAGE_SIZE,
					offset: pageOffset,
					expand: generateExpandQueryParams([EXPAND.FEATURES]),
				});
				items.push(...response.items);
				if (response.items.length < PAGE_SIZE) break;
				const total = response.pagination?.total;
				if (total != null && pageOffset + response.items.length >= total) break;
				pageOffset += PAGE_SIZE;
			}
			return { items };
		},
		enabled: hasPlans,
	});

	const planIdsForGrantsKey = planIds.join('\0');

	const {
		data: planCreditGrantsData,
		isLoading: isLoadingPlanCreditGrants,
		isError: isErrorPlanCreditGrants,
	} = useQuery({
		queryKey: ['fetchPlanCreditGrantsForPricingWidgets', planIdsForGrantsKey],
		queryFn: async () => {
			const merged: CreditGrant[] = [];
			for (let i = 0; i < planIds.length; i += PLAN_CREDIT_GRANT_FETCH_CHUNK) {
				const chunk = planIds.slice(i, i + PLAN_CREDIT_GRANT_FETCH_CHUNK);
				const chunkResults = await Promise.all(
					chunk.map(async (planId) => {
						const res = await CreditGrantApi.list({
							plan_ids: [planId],
							scope: CREDIT_GRANT_SCOPE.PLAN,
							limit: PLAN_CREDIT_GRANT_LIST_LIMIT,
							offset: 0,
						});
						return { planId, res };
					}),
				);
				for (const { planId, res } of chunkResults) {
					for (const grant of res.items) {
						merged.push({ ...grant, plan_id: grant.plan_id ?? planId } as CreditGrant);
					}
				}
			}
			return { items: merged };
		},
		enabled: hasPlans,
	});

	// Validate each API response before it enters the adapters/transforms. Malformed rows are
	// dropped (logged in dev) rather than crashing the pricing page.
	const validatedPlans = validateResponseItems(planItemSchema, plansData, 'plans');

	return {
		// Casts go through `unknown`: the lenient validation schemas intentionally don't restate the
		// full domain types — they gate the crash-prone fields and pass everything else through.
		plansData: plansData ? ({ ...plansData, items: validatedPlans } as unknown as GetAllPlansResponse) : undefined,
		allPrices: validateResponseItems(priceItemSchema, allPricesData, 'prices') as unknown as PriceResponse[],
		allEntitlements: validateResponseItems(entitlementItemSchema, allEntitlementsData, 'entitlements') as unknown as EntitlementResponse[],
		creditGrants: validateResponseItems(creditGrantItemSchema, planCreditGrantsData, 'creditGrants') as unknown as CreditGrant[],
		isLoading: isLoadingPlans || isLoadingPrices || isLoadingEntitlements || isLoadingPlanCreditGrants,
		isError: isErrorPlans || isErrorPrices || isErrorEntitlements || isErrorPlanCreditGrants,
	};
}
