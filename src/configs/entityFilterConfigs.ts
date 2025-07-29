import { BaseEntityStatus } from '@/types/common';
import {
	DataType,
	DEFAULT_OPERATORS_PER_DATA_TYPE,
	FilterCondition,
	FilterField,
	FilterFieldType,
	FilterOperator,
	SortDirection,
	SortOption,
} from '@/types/common/QueryBuilder';
import { CustomerField, FeatureField, InvoiceField, PlanField } from '@/types/common/EntityFields';
import { FEATURE_TYPE } from '@/models/Feature';

/**
 * Feature entity filter and sort configurations
 */
export const featureFilterOptions: FilterField[] = [
	{
		field: FeatureField.NAME,
		label: 'Name',
		fieldType: FilterFieldType.INPUT,
		operators: DEFAULT_OPERATORS_PER_DATA_TYPE[DataType.STRING],
		dataType: DataType.STRING,
	},
	{
		field: FeatureField.CREATED_AT,
		label: 'Created At',
		fieldType: FilterFieldType.DATEPICKER,
		operators: DEFAULT_OPERATORS_PER_DATA_TYPE[DataType.DATE],
		dataType: DataType.DATE,
	},
	{
		field: FeatureField.STATUS,
		label: 'Status',
		fieldType: FilterFieldType.MULTI_SELECT,
		operators: [FilterOperator.IS_ANY_OF, FilterOperator.IS_NOT_ANY_OF],
		dataType: DataType.ARRAY,
		options: [
			{ value: BaseEntityStatus.PUBLISHED, label: 'Active' },
			{ value: BaseEntityStatus.ARCHIVED, label: 'Inactive' },
		],
	},
	{
		field: FeatureField.TYPE,
		label: 'Type',
		fieldType: FilterFieldType.MULTI_SELECT,
		operators: DEFAULT_OPERATORS_PER_DATA_TYPE[DataType.ARRAY],
		dataType: DataType.ARRAY,
		options: [
			{ value: FEATURE_TYPE.METERED, label: 'Metered' },
			{ value: FEATURE_TYPE.BOOLEAN, label: 'Boolean' },
			{ value: FEATURE_TYPE.STATIC, label: 'Static' },
		],
	},
];

export const featureSortOptions: SortOption[] = [
	{
		field: FeatureField.NAME,
		label: 'Name',
		direction: SortDirection.ASC,
	},
	{
		field: FeatureField.CREATED_AT,
		label: 'Created At',
		direction: SortDirection.DESC,
	},
	{
		field: FeatureField.UPDATED_AT,
		label: 'Updated At',
		direction: SortDirection.DESC,
	},
];

export const featureInitialFilters = [
	{
		field: FeatureField.NAME,
		operator: FilterOperator.CONTAINS,
		valueString: '',
		dataType: DataType.STRING,
		id: 'initial-name',
	},
	{
		field: FeatureField.STATUS,
		operator: FilterOperator.IS_ANY_OF,
		valueArray: [BaseEntityStatus.PUBLISHED],
		dataType: DataType.ARRAY,
		id: 'initial-status',
	},
];

export const featureInitialSorts = [
	{
		field: FeatureField.UPDATED_AT,
		label: 'Updated At',
		direction: SortDirection.DESC,
	},
];

/**
 * Customer entity filter and sort configurations
 */
export const customerFilterOptions: FilterField[] = [
	{
		field: CustomerField.NAME,
		label: 'Name',
		fieldType: FilterFieldType.INPUT,
		operators: DEFAULT_OPERATORS_PER_DATA_TYPE[DataType.STRING],
		dataType: DataType.STRING,
	},
	{
		field: CustomerField.EXTERNAL_ID,
		label: 'Lookup Key',
		fieldType: FilterFieldType.INPUT,
		operators: DEFAULT_OPERATORS_PER_DATA_TYPE[DataType.STRING],
		dataType: DataType.STRING,
	},
	{
		field: CustomerField.EMAIL,
		label: 'Email',
		fieldType: FilterFieldType.INPUT,
		operators: DEFAULT_OPERATORS_PER_DATA_TYPE[DataType.STRING],
		dataType: DataType.STRING,
	},
	{
		field: CustomerField.CREATED_AT,
		label: 'Created At',
		fieldType: FilterFieldType.DATEPICKER,
		operators: DEFAULT_OPERATORS_PER_DATA_TYPE[DataType.DATE],
		dataType: DataType.DATE,
	},
	{
		field: CustomerField.STATUS,
		label: 'Status',
		fieldType: FilterFieldType.MULTI_SELECT,
		operators: [FilterOperator.IS_ANY_OF, FilterOperator.IS_NOT_ANY_OF],
		dataType: DataType.ARRAY,
		options: [
			{ value: BaseEntityStatus.PUBLISHED, label: 'Active' },
			{ value: BaseEntityStatus.ARCHIVED, label: 'Inactive' },
		],
	},
];

export const customerSortOptions: SortOption[] = [
	{
		field: CustomerField.NAME,
		label: 'Name',
		direction: SortDirection.ASC,
	},
	{
		field: CustomerField.EMAIL,
		label: 'Email',
		direction: SortDirection.ASC,
	},
	{
		field: CustomerField.CREATED_AT,
		label: 'Created At',
		direction: SortDirection.DESC,
	},
	{
		field: CustomerField.UPDATED_AT,
		label: 'Updated At',
		direction: SortDirection.DESC,
	},
];

export const customerInitialFilters = [
	{
		field: CustomerField.NAME,
		operator: FilterOperator.CONTAINS,
		valueString: '',
		dataType: DataType.STRING,
		id: 'initial-name',
	},
	{
		field: CustomerField.EXTERNAL_ID,
		operator: FilterOperator.CONTAINS,
		valueString: '',
		dataType: DataType.STRING,
		id: 'initial-external-id',
	},
	{
		field: CustomerField.STATUS,
		operator: FilterOperator.IS_ANY_OF,
		valueArray: [BaseEntityStatus.PUBLISHED],
		dataType: DataType.ARRAY,
		id: 'initial-status',
	},
];

export const customerInitialSorts = [
	{
		field: CustomerField.UPDATED_AT,
		label: 'Updated At',
		direction: SortDirection.DESC,
	},
];

/**
 * Plan entity filter and sort configurations
 */
export const planFilterOptions: FilterField[] = [
	{
		field: PlanField.NAME,
		label: 'Name',
		fieldType: FilterFieldType.INPUT,
		operators: DEFAULT_OPERATORS_PER_DATA_TYPE[DataType.STRING],
		dataType: DataType.STRING,
	},
	{
		field: PlanField.LOOKUP_KEY,
		label: 'Lookup Key',
		fieldType: FilterFieldType.INPUT,
		operators: DEFAULT_OPERATORS_PER_DATA_TYPE[DataType.STRING],
		dataType: DataType.STRING,
	},
	{
		field: PlanField.DESCRIPTION,
		label: 'Description',
		fieldType: FilterFieldType.INPUT,
		operators: DEFAULT_OPERATORS_PER_DATA_TYPE[DataType.STRING],
		dataType: DataType.STRING,
	},
	{
		field: PlanField.CREATED_AT,
		label: 'Created At',
		fieldType: FilterFieldType.DATEPICKER,
		operators: DEFAULT_OPERATORS_PER_DATA_TYPE[DataType.DATE],
		dataType: DataType.DATE,
	},
	{
		field: PlanField.STATUS,
		label: 'Status',
		fieldType: FilterFieldType.MULTI_SELECT,
		operators: [FilterOperator.IS_ANY_OF, FilterOperator.IS_NOT_ANY_OF],
		dataType: DataType.ARRAY,
		options: [
			{ value: BaseEntityStatus.PUBLISHED, label: 'Active' },
			{ value: BaseEntityStatus.ARCHIVED, label: 'Inactive' },
		],
	},
];

export const planSortOptions: SortOption[] = [
	{
		field: PlanField.NAME,
		label: 'Name',
		direction: SortDirection.ASC,
	},
	{
		field: PlanField.CREATED_AT,
		label: 'Created At',
		direction: SortDirection.DESC,
	},
	{
		field: PlanField.UPDATED_AT,
		label: 'Updated At',
		direction: SortDirection.DESC,
	},
];

export const planInitialFilters: FilterCondition[] = [
	{
		field: PlanField.NAME,
		operator: FilterOperator.CONTAINS,
		valueString: '',
		dataType: DataType.STRING,
		id: 'initial-name',
	},
	{
		field: PlanField.STATUS,
		operator: FilterOperator.IS_ANY_OF,
		valueArray: [BaseEntityStatus.PUBLISHED],
		dataType: DataType.ARRAY,
		id: 'initial-status',
	},
];

export const planInitialSorts: SortOption[] = [
	{
		field: PlanField.UPDATED_AT,
		label: 'Updated At',
		direction: SortDirection.DESC,
	},
];

/**
 * Invoice entity filter and sort configurations
 */
export const invoiceFilterOptions: FilterField[] = [
	{
		field: InvoiceField.INVOICE_NUMBER,
		label: 'Invoice Number',
		fieldType: FilterFieldType.INPUT,
		operators: DEFAULT_OPERATORS_PER_DATA_TYPE[DataType.STRING],
		dataType: DataType.STRING,
	},
	{
		field: InvoiceField.CUSTOMER_ID,
		label: 'Customer ID',
		fieldType: FilterFieldType.INPUT,
		operators: DEFAULT_OPERATORS_PER_DATA_TYPE[DataType.STRING],
		dataType: DataType.STRING,
	},
	{
		field: InvoiceField.SUBSCRIPTION_ID,
		label: 'Subscription ID',
		fieldType: FilterFieldType.INPUT,
		operators: DEFAULT_OPERATORS_PER_DATA_TYPE[DataType.STRING],
		dataType: DataType.STRING,
	},
	{
		field: InvoiceField.DUE_DATE,
		label: 'Due Date',
		fieldType: FilterFieldType.DATEPICKER,
		operators: DEFAULT_OPERATORS_PER_DATA_TYPE[DataType.DATE],
		dataType: DataType.DATE,
	},
	{
		field: InvoiceField.INVOICE_STATUS,
		label: 'Invoice Status',
		fieldType: FilterFieldType.MULTI_SELECT,
		operators: [FilterOperator.IS_ANY_OF, FilterOperator.IS_NOT_ANY_OF],
		dataType: DataType.ARRAY,
		options: [
			{ value: 'draft', label: 'Draft' },
			{ value: 'open', label: 'Open' },
			{ value: 'paid', label: 'Paid' },
			{ value: 'void', label: 'Void' },
			{ value: 'uncollectible', label: 'Uncollectible' },
		],
	},
	{
		field: InvoiceField.PAYMENT_STATUS,
		label: 'Payment Status',
		fieldType: FilterFieldType.MULTI_SELECT,
		operators: [FilterOperator.IS_ANY_OF, FilterOperator.IS_NOT_ANY_OF],
		dataType: DataType.ARRAY,
		options: [
			{ value: 'unpaid', label: 'Unpaid' },
			{ value: 'paid', label: 'Paid' },
			{ value: 'partially_paid', label: 'Partially Paid' },
		],
	},
];

export const invoiceSortOptions: SortOption[] = [
	{
		field: InvoiceField.INVOICE_NUMBER,
		label: 'Invoice Number',
		direction: SortDirection.ASC,
	},
	{
		field: InvoiceField.DUE_DATE,
		label: 'Due Date',
		direction: SortDirection.DESC,
	},
	{
		field: InvoiceField.TOTAL,
		label: 'Total Amount',
		direction: SortDirection.DESC,
	},
	{
		field: InvoiceField.UPDATED_AT,
		label: 'Updated At',
		direction: SortDirection.DESC,
	},
];

export const invoiceInitialFilters = [
	{
		field: InvoiceField.INVOICE_NUMBER,
		operator: FilterOperator.CONTAINS,
		valueString: '',
		dataType: DataType.STRING,
		id: 'initial-invoice-number',
	},
	{
		field: InvoiceField.INVOICE_STATUS,
		operator: FilterOperator.IS_ANY_OF,
		valueArray: ['open'],
		dataType: DataType.ARRAY,
		id: 'initial-invoice-status',
	},
	{
		field: InvoiceField.STATUS,
		operator: FilterOperator.IS_ANY_OF,
		valueArray: [BaseEntityStatus.PUBLISHED],
		dataType: DataType.ARRAY,
		id: 'initial-status',
	},
];

export const invoiceInitialSorts = [
	{
		field: InvoiceField.UPDATED_AT,
		label: 'Updated At',
		direction: SortDirection.DESC,
	},
];
