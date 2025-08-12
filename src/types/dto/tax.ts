import { FilterCondition } from '@/components/molecules/QueryBuilder';
import { SortOption } from '@/components/molecules/Table/Toolbar';
import { Pagination } from '@/models/Pagination';
import { TAX_RATE_TYPE, TAX_RATE_STATUS, TAX_RATE_SCOPE, TAXRATE_ENTITY_TYPE, TaxRate } from '@/models/Tax';
import { ENTITY_STATUS } from '@/models/base';
import { QueryFilter } from './base';

// CreateTaxRateRequest represents the request to create a tax rate
export interface CreateTaxRateRequest {
	// name is the human-readable name for the tax rate (required)
	name: string;

	// code is the unique alphanumeric case sensitive identifier for the tax rate (required)
	code: string;

	// description is an optional text description providing details about the tax rate
	description?: string;

	// percentage_value is the percentage value (0-100) when tax_rate_type is "percentage"
	percentage_value?: number;

	// fixed_value is the fixed monetary amount when tax_rate_type is "fixed"
	fixed_value?: number;

	// tax_rate_type determines how the tax is calculated ("percentage" or "fixed")
	tax_rate_type: TAX_RATE_TYPE;

	// scope defines where this tax rate applies
	scope?: TAX_RATE_SCOPE;

	// metadata contains additional key-value pairs for storing extra information
	metadata?: Record<string, string>;
}

// UpdateTaxRateRequest represents the request to update a tax rate
export interface UpdateTaxRateRequest {
	// name is the updated human-readable name for the tax rate
	name?: string;

	// code is the updated unique alphanumeric identifier for the tax rate
	code?: string;

	// description is the updated text description for the tax rate
	description?: string;

	// metadata contains updated key-value pairs that will replace existing metadata
	metadata?: Record<string, string>;

	// tax_rate_status determines the status of the tax rate
	tax_rate_status?: TAX_RATE_STATUS;
}

// TaxRateResponse represents the response for tax rate operations
export interface TaxRateResponse {
	id: string;
	name: string;
	description: string;
	code: string;
	tax_rate_status: TAX_RATE_STATUS;
	tax_rate_type: TAX_RATE_TYPE;
	scope: TAX_RATE_SCOPE;
	percentage_value?: number;
	fixed_value?: number;
	metadata?: Record<string, string>;
	environment_id: string;
	tenant_id: string;
	created_at: string;
	updated_at: string;
	created_by: string;
	updated_by: string;
}

// ListTaxRatesResponse represents the response for listing tax rates
export interface ListTaxRatesResponse {
	items: TaxRateResponse[];
	pagination: Pagination;
}

// CreateTaxAssociationRequest represents the request to create a tax association
export interface CreateTaxAssociationRequest {
	// tax_rate_code is the code of the tax rate to associate
	tax_rate_code: string;

	// entity_type is the type of entity to associate the tax rate with
	entity_type: TAXRATE_ENTITY_TYPE;

	// entity_id is the ID of the entity to associate the tax rate with
	entity_id: string;

	// priority determines the order of application when multiple tax rates apply
	priority?: number;

	// currency is the currency for the tax association
	currency?: string;

	// auto_apply determines if the tax should be automatically applied
	auto_apply?: boolean;

	// metadata contains additional key-value pairs for storing extra information
	metadata?: Record<string, string>;
}

// TaxAssociationUpdateRequest represents the request to update a tax association
export interface TaxAssociationUpdateRequest {
	// priority determines the order of application when multiple tax rates apply
	priority?: number;

	// auto_apply determines if the tax should be automatically applied
	auto_apply?: boolean;

	// metadata contains updated key-value pairs that will replace existing metadata
	metadata?: Record<string, string>;
}

// TaxAssociationResponse represents the response for tax association operations
export interface TaxAssociationResponse {
	id: string;
	tax_rate_id: string;
	entity_type: TAXRATE_ENTITY_TYPE;
	entity_id: string;
	priority: number;
	auto_apply: boolean;
	valid_from?: string;
	valid_to?: string;
	currency: string;
	metadata?: Record<string, string>;
	environment_id: string;
	tenant_id: string;
	status: ENTITY_STATUS;
	created_at: string;
	updated_at: string;
	created_by: string;
	updated_by: string;
	tax_rate?: TaxRate;
}

// TaxRateOverride represents a tax rate override configuration
export interface TaxRateOverride {
	// tax_rate_code is the code of the tax rate to override
	tax_rate_code: string;

	// priority determines the order of application when multiple tax rates apply
	priority?: number;

	// currency is the currency for the tax override (required)
	currency: string;

	// auto_apply determines if the tax should be automatically applied
	auto_apply?: boolean;

	// metadata contains additional key-value pairs for storing extra information
	metadata?: Record<string, string>;
}

// TaxRateFilter represents the filter for querying tax rates
export interface TaxRateFilter extends QueryFilter {
	// filters contains filter conditions for the query
	filters?: FilterCondition[];

	// taxrate_ids is an array of tax rate IDs to filter by
	taxrate_ids?: string[];

	// taxrate_codes is an array of tax rate codes to filter by
	taxrate_codes?: string[];

	// scope is the tax rate scope to filter by
	scope?: TAX_RATE_SCOPE;
}

// CreateTaxAppliedRequest represents the request to create a tax applied record
export interface CreateTaxAppliedRequest {
	// tax_rate_id is the ID of the tax rate being applied
	tax_rate_id: string;

	// entity_type is the type of entity the tax is applied to
	entity_type: TAXRATE_ENTITY_TYPE;

	// entity_id is the ID of the entity the tax is applied to
	entity_id: string;

	// tax_association_id is the ID of the tax association (optional)
	tax_association_id?: string;

	// taxable_amount is the amount on which tax is calculated
	taxable_amount: number;

	// tax_amount is the calculated tax amount
	tax_amount: number;

	// currency is the currency for the tax applied record
	currency: string;

	// metadata contains additional key-value pairs for storing extra information
	metadata?: Record<string, string>;
}

// TaxAppliedResponse represents the response for tax applied operations
export interface TaxAppliedResponse {
	id: string;
	tax_rate_id: string;
	entity_type: TAXRATE_ENTITY_TYPE;
	entity_id: string;
	tax_association_id?: string;
	taxable_amount: number;
	tax_amount: number;
	currency: string;
	applied_at: string;
	metadata?: Record<string, string>;
	environment_id: string;
	tenant_id: string;
	created_at: string;
	updated_at: string;
	created_by: string;
	updated_by: string;
}

// ListTaxAppliedResponse represents the response for listing tax applied records
export interface ListTaxAppliedResponse {
	items: TaxAppliedResponse[];
	pagination: Pagination;
}

// TaxAppliedFilter represents the filter for querying tax applied records
export interface TaxAppliedFilter {
	// filters contains filter conditions for the query
	filters?: FilterCondition[];

	// sort contains sort conditions for the query
	sort?: SortOption[];

	// tax_rate_ids is an array of tax rate IDs to filter by
	tax_rate_ids?: string[];

	// entity_type is the type of entity to filter by
	entity_type?: TAXRATE_ENTITY_TYPE;

	// entity_id is the ID of the entity to filter by
	entity_id?: string;

	// tax_association_id is the ID of the tax association to filter by
	tax_association_id?: string;
}

// TaxAssociationFilter represents the filter for querying tax associations
export interface TaxAssociationFilter extends QueryFilter {
	// filters contains filter conditions for the query
	filters?: FilterCondition[];

	// sort contains sort conditions for the query
	// sort?: SortOption[];

	// tax_rate_ids is an array of tax rate IDs to filter by
	tax_rate_ids?: string[];

	// entity_type is the type of entity to filter by
	entity_type?: TAXRATE_ENTITY_TYPE;

	// entity_id is the ID of the entity to filter by
	entity_id?: string;

	// auto_apply determines if the tax should be automatically applied
	auto_apply?: boolean;
}

// ListTaxAssociationsResponse represents the response for listing tax associations
export interface ListTaxAssociationsResponse {
	items: TaxAssociationResponse[];
	pagination: Pagination;
}

// LinkTaxRateToEntityRequest represents the request to link tax rates to an entity
export interface LinkTaxRateToEntityRequest {
	// entity_type is the type of entity to link tax rates to
	entity_type: TAXRATE_ENTITY_TYPE;

	// entity_id is the ID of the entity to link tax rates to
	entity_id: string;

	// tax_rate_overrides is an array of tax rate overrides
	tax_rate_overrides?: TaxRateOverride[];

	// existing_tax_associations is an array of existing tax associations to link
	existing_tax_associations?: {
		tax_rate_id: string;
		priority?: number;
		auto_apply?: boolean;
		currency?: string;
		metadata?: Record<string, string>;
	}[];
}

// CreateInvoiceRequest represents the request to create an invoice (partial for tax operations)
export interface CreateInvoiceRequest {
	// subscription_id is the ID of the subscription (optional)
	subscription_id?: string;

	// tax_rate_overrides is an array of tax rate overrides
	tax_rate_overrides?: TaxRateOverride[];
}

// TaxCalculationResult represents the result of tax calculations
export interface TaxCalculationResult {
	total_tax_amount: number;
	tax_applied_records: TaxAppliedResponse[];
	tax_rates: TaxRateResponse[];
}
