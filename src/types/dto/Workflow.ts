/** Single workflow from the list API (matches GET /v1/workflows response) */
export interface WorkflowItem {
	workflow_id: string;
	run_id: string;
	workflow_type: string;
	task_queue: string;
	/** Workflow status, e.g. RUNNING, COMPLETED, FAILED */
	status: string;
	/** Start time as ISO string (e.g. 2026-02-10T19:00:02.975033Z) or milliseconds */
	start_time: string | number;
	/** Close time as ISO string or milliseconds (optional, e.g. when status is COMPLETED) */
	close_time?: string | number;
	/** Duration in milliseconds (optional) */
	duration_ms?: number;
}

/** Params for listing workflows (pagination + filters + sort) */
export interface ListWorkflowsParams {
	page?: number;
	page_size?: number;
	/** Filter by workflow type, e.g. PriceSyncWorkflow */
	workflow_type?: string;
	/** Filter by task queue, e.g. task, export */
	task_queue?: string;
	/** Filter by status: Running, Completed, Failed */
	workflow_status?: string;
	/** Filter by entity type: plan, customer, invoice */
	entity?: string;
	/** Filter by entity ID, e.g. plan_01ABC123 */
	entity_id?: string;
	/** Sort field, e.g. start_time, close_time, workflow_type, status */
	sort_by?: string;
	/** Sort direction */
	sort_order?: 'asc' | 'desc';
}

/** Raw API response: { workflows: WorkflowItem[], total?: number } */
export interface ListWorkflowsResponse {
	workflows: WorkflowItem[];
	total?: number;
}
