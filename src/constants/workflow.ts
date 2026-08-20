import type { TypedBackendFilter } from '@/types/formatters/QueryBuilder';
import { DataType, FilterOperator } from '@/types/common/QueryBuilder';

/** Workflow type for plan price sync (POST /plans/:id/sync/subscriptions). */
export const PRICE_SYNC_WORKFLOW_TYPE = 'PriceSyncV2Workflow';

/** Filter for workflows/search: workflow_type eq PriceSyncV2Workflow. */
export const PRICE_SYNC_WORKFLOW_FILTER: TypedBackendFilter = {
	field: 'workflow_type',
	operator: FilterOperator.EQUAL,
	data_type: DataType.STRING,
	value: { string: PRICE_SYNC_WORKFLOW_TYPE },
};

/**
 * Filters for plan price sync workflow search: workflow_type eq PriceSyncV2Workflow and entity_id eq planId.
 * Use with POST /workflows/search. Response should be sorted by start_time desc so first item is latest.
 */
export function getPlanPriceSyncWorkflowFilters(planId: string): TypedBackendFilter[] {
	return [
		PRICE_SYNC_WORKFLOW_FILTER,
		{ field: 'entity_id', operator: FilterOperator.EQUAL, data_type: DataType.STRING, value: { string: planId } },
	];
}

/** API workflow_type → display name for UI. Usage: display = WORKFLOW_TYPE_DISPLAY_NAMES[workflow_type] ?? workflow_type */
export const WORKFLOW_TYPE_DISPLAY_NAMES: Record<string, string> = {
	PriceSyncV2Workflow: 'Price sync',
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
