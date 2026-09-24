import { useTranslation } from 'react-i18next';
import { FC } from 'react';
import FlexpriceTable, { ColumnData, RedirectCell, TooltipCell } from '../Table';
import { TaxApplied } from '@/models/Tax';
import { formatDateShort } from '@/utils/common/helper_functions';
import { TAX_BEHAVIOR, TAX_RATE_TYPE, TAX_TRANSACTION_TYPE } from '@/models/Tax';
import { useQuery } from '@tanstack/react-query';
import TaxApi from '@/api/TaxApi';
import { TaxRateResponse } from '@/types/dto/tax';
import { formatAmount } from '@/constants/common';
import { RouteNames } from '@/core/routes/Routes';

interface Props {
	data: TaxApplied[];
}

const getTaxTypeLabel = (type: TAX_RATE_TYPE) => {
	switch (type) {
		case TAX_RATE_TYPE.PERCENTAGE:
			return 'Percentage';
		case TAX_RATE_TYPE.FIXED:
			return 'Fixed';
		default:
			return '--';
	}
};

const formatTaxValue = (taxRate: TaxRateResponse | undefined, currency: string = 'USD') => {
	if (!taxRate) return '--';

	if (taxRate.tax_rate_type === TAX_RATE_TYPE.PERCENTAGE && taxRate.percentage_value !== undefined) {
		return `${taxRate.percentage_value}%`;
	}
	if (taxRate.tax_rate_type === TAX_RATE_TYPE.FIXED && taxRate.fixed_value !== undefined) {
		return formatAmount(taxRate.fixed_value, currency);
	}
	return '--';
};

// An external engine resolved the rate itself, so the row carries the answer and there is no
// Flexprice rate to look up.
const isExternal = (row: TaxApplied) => Boolean(row.external_tax_details);

const AppliedTaxesTable: FC<Props> = ({ data: rows }) => {
	const { t } = useTranslation('common');
	// A reversal records tax being un-filed when the invoice was voided, not a tax it charges.
	const data = rows.filter((row) => row.tax_transaction_type !== TAX_TRANSACTION_TYPE.REVERSAL);
	// Fetch tax rate details for each applied tax. External rows have no rate id, and asking
	// for one would be a request per row that can only 404.
	const taxRateIds = [...new Set(data.map((tax) => tax.tax_rate_id).filter((id): id is string => Boolean(id)))];

	const { data: taxRatesData } = useQuery({
		queryKey: ['fetchTaxRatesForApplied', taxRateIds],
		queryFn: async () => {
			const taxRates: TaxRateResponse[] = [];
			for (const taxRateId of taxRateIds) {
				try {
					const taxRate = await TaxApi.getTaxRate(taxRateId);
					taxRates.push(taxRate);
				} catch (error) {
					console.error(`Failed to fetch tax rate ${taxRateId}:`, error);
				}
			}
			return taxRates;
		},
		enabled: taxRateIds.length > 0,
	});

	// Create a map for quick lookup
	const taxRatesMap = new Map<string, TaxRateResponse>();
	taxRatesData?.forEach((taxRate) => {
		taxRatesMap.set(taxRate.id, taxRate);
	});

	const columns: ColumnData<TaxApplied>[] = [
		{
			title: 'Tax Name',
			render: (row) => {
				if (isExternal(row)) {
					return row.external_tax_details?.display_name || '--';
				}
				const taxRate = taxRatesMap.get(row.tax_rate_id!);
				return <RedirectCell redirectUrl={`${RouteNames.taxes}/${row.tax_rate_id}`}>{taxRate?.name || row.tax_rate_id}</RedirectCell>;
			},
		},
		{
			title: 'Code',
			render: (row) => {
				const code = isExternal(row) ? row.external_tax_details?.tax_code : taxRatesMap.get(row.tax_rate_id!)?.code;
				return <TooltipCell tooltipContent={code || '--'} tooltipText={code || '--'} />;
			},
		},
		{
			title: 'Jurisdiction',
			render: (row) => row.external_tax_details?.jurisdiction?.display_name || '--',
		},
		{
			title: 'Type',
			render: (row) => {
				if (isExternal(row)) {
					// The engine reports a percentage or nothing at all, and an assumed
					// percentage would claim a rate that was never imposed.
					return row.external_tax_details?.percentage ? getTaxTypeLabel(TAX_RATE_TYPE.PERCENTAGE) : '--';
				}
				const taxRate = taxRatesMap.get(row.tax_rate_id!);
				return taxRate ? getTaxTypeLabel(taxRate.tax_rate_type) : '--';
			},
		},
		{
			title: 'Rate',
			render: (row) => {
				if (isExternal(row)) {
					// Stripe sends "18.0"; drop the trailing zero without touching a real 8.375.
					const percentage = row.external_tax_details?.percentage;
					return percentage ? `${parseFloat(percentage)}%` : '--';
				}
				return formatTaxValue(taxRatesMap.get(row.tax_rate_id!));
			},
		},
		{
			title: 'Behavior',
			render: (row) =>
				row.tax_behavior === TAX_BEHAVIOR.INCLUSIVE ? t('taxAssociation.taxBehaviorInclusive') : t('taxAssociation.taxBehaviorExclusive'),
		},
		{
			title: 'Taxable Amount',
			render: (row) => formatAmount(Number(row.taxable_amount), row.currency),
		},
		{
			title: 'Tax Amount',
			render: (row) => formatAmount(Number(row.tax_amount), row.currency),
		},
		{
			title: 'Applied At',
			render: (row) => formatDateShort(row.applied_at),
		},
	];

	if (data?.length === 0) {
		return (
			<div className='my-6'>
				<div className='text-center text-content-muted py-8'>
					<p className='text-sm'>{t('labels.noTaxesApplied')}</p>
				</div>
			</div>
		);
	}

	return (
		<div>
			<FlexpriceTable variant='no-bordered' showEmptyRow={false} columns={columns} data={data} />
		</div>
	);
};

export default AppliedTaxesTable;
