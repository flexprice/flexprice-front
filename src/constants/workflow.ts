import type { TypedBackendFilter } from '@/types/formatters/QueryBuilder';
import { DataType, FilterOperator } from '@/types/common/QueryBuilder';

/** Workflow type value for plan price sync (POST /plans/:id/sync/subscriptions). */
export const PRICE_SYNC_WORKFLOW_TYPE = 'PriceSyncWorkflow';

/** Filter for workflows/search: workflow_type eq PriceSyncWorkflow. */
export const PRICE_SYNC_WORKFLOW_FILTER: TypedBackendFilter = {
	field: 'workflow_type',
	operator: FilterOperator.EQUAL,
	data_type: DataType.STRING,
	value: { string: PRICE_SYNC_WORKFLOW_TYPE },
};

/**
 * Filters for fetching plan price sync workflow runs.
 * Includes workflow_type = PriceSyncWorkflow and optional entity_id = planId (if backend supports it).
 */
export function getPlanPriceSyncWorkflowFilters(planId: string): TypedBackendFilter[] {
	const filters: TypedBackendFilter[] = [PRICE_SYNC_WORKFLOW_FILTER];
	filters.push({
		field: 'entity_id',
		operator: FilterOperator.EQUAL,
		data_type: DataType.STRING,
		value: { string: planId },
	});
	return filters;
}

/** API workflow_type → display name for UI. Usage: display = WORKFLOW_TYPE_DISPLAY_NAMES[workflow_type] ?? workflow_type */
export const WORKFLOW_TYPE_DISPLAY_NAMES: Record<string, string> = {
	PriceSyncWorkflow: 'Price sync',
	QuickBooksPriceSyncWorkflow: 'QuickBooks price sync',
	TaskProcessingWorkflow: 'Task processing',
	SubscriptionChangeWorkflow: 'Subscription change',
	SubscriptionCreationWorkflow: 'Subscription creation',
	StripeIntegrationWorkflow: 'Stripe integration',
	ExecuteExportWorkflow: 'Data export',
	HubSpotDealSyncWorkflow: 'HubSpot deal sync',
	HubSpotInvoiceSyncWorkflow: 'HubSpot invoice sync',
	HubSpotQuoteSyncWorkflow: 'HubSpot quote sync',
	NomodInvoiceSyncWorkflow: 'Nomod invoice sync',
	MoyasarInvoiceSyncWorkflow: 'Moyasar invoice sync',
	CustomerOnboardingWorkflow: 'Customer onboarding',
	PrepareProcessedEventsWorkflow: 'Prepare processed events',
	ScheduleSubscriptionBillingWorkflow: 'Schedule subscription billing',
	ProcessSubscriptionBillingWorkflow: 'Process subscription billing',
	ProcessInvoiceWorkflow: 'Process invoice',
	ReprocessEventsWorkflow: 'Reprocess events',
	ReprocessRawEventsWorkflow: 'Reprocess raw events',
	ReprocessEventsForPlanWorkflow: 'Reprocess events for plan',
};
