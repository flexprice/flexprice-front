export type ReportCategory = 'billing' | 'receivables' | 'customers' | 'credits' | 'usage';
export type ReportKind = 'flow' | 'ratio' | 'snapshot';
export type ReportValueType = 'money' | 'count' | 'days';
export type ReportShape = 'scalar' | 'timeseries' | 'breakdown' | 'histogram';
export type ReportGrain = 'day' | 'week' | 'month';
export type ReportCompare = 'previous_period' | 'previous_year';

export interface ReportDimension {
	key: string;
	label: string;
}

export interface ReportCatalogEntry {
	key: string;
	name: string;
	description: string;
	category: ReportCategory;
	kind: ReportKind;
	value_type: ReportValueType;
	improvement: 'higher' | 'lower';
	shapes: ReportShape[];
	default_shape: ReportShape;
	dimensions: ReportDimension[];
	grains: ReportGrain[];
	supports_compare: boolean;
	variant_of?: string;
	variant_label?: string;
	max_range_days?: number;
}

export interface ReportCatalogResponse {
	items: ReportCatalogEntry[];
}

export interface ReportFilter {
	field: string;
	op: 'eq' | 'in';
	value: string[];
}

export interface ReportSort {
	field: string;
	dir: 'asc' | 'desc';
}

export interface ReportQueryRequest {
	shape: ReportShape;
	range: string;
	dimensions?: string[];
	grain?: ReportGrain;
	currency?: string;
	filters?: ReportFilter[];
	compare?: ReportCompare;
	limit?: number;
	sort?: ReportSort[];
}

export interface ReportColumn {
	name: string;
	type: 'string' | 'decimal' | 'datetime';
	role: 'dimension' | 'metric';
	currency?: string;
}

export interface ReportQueryMeta {
	query_source: string;
	from?: string;
	to?: string;
	prev_from?: string;
	prev_to?: string;
}

export interface ReportQueryResult {
	columns: ReportColumn[];
	rows: string[][];
	meta: ReportQueryMeta;
}

export type ReportDisplay = 'chart' | 'table';

export interface CustomReportDefinition {
	family: 'report';
	metrics: string[];
	shape: ReportShape;
	dimensions?: string[];
	filters?: ReportFilter[];
	time: { range: string; grain?: ReportGrain | '' };
	compare?: ReportCompare;
	currency?: string;
	display?: ReportDisplay;
}

export interface CustomReport {
	id: string;
	name: string;
	version: number;
	definition: CustomReportDefinition;
	created_by?: string;
	created_at: string;
	updated_at: string;
}

export interface CustomReportListResponse {
	items: CustomReport[];
}
