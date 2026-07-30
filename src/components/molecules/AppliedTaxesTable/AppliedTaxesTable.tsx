import { useTranslation } from 'react-i18next';
import { FC } from 'react';
import FlexpriceTable, { ColumnData, RedirectCell, TooltipCell } from '../Table';
import { TaxApplied } from '@/models/Tax';
import { formatDateShort } from '@/utils/common/helper_functions';
import { TAX_RATE_TYPE } from '@/models/Tax';
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

const AppliedTaxesTable: FC<Props> = ({ data }) => {
	const { t } = useTranslation('common');
	// Fetch tax rate details for each applied tax
	const taxRateIds = [...new Set(data.map((tax) => tax.tax_rate_id))];

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
				const taxRate = taxRatesMap.get(row.tax_rate_id);
				return <RedirectCell redirectUrl={`${RouteNames.taxes}/${row.tax_rate_id}`}>{taxRate?.name || row.tax_rate_id}</RedirectCell>;
			},
		},
		{
			title: 'Code',
			render: (row) => {
				const taxRate = taxRatesMap.get(row.tax_rate_id);
				return <TooltipCell tooltipContent={taxRate?.code || '--'} tooltipText={taxRate?.code || '--'} />;
			},
		},
		{
			title: 'Type',
			render: (row) => {
				const taxRate = taxRatesMap.get(row.tax_rate_id);
				return getTaxTypeLabel(taxRate?.tax_rate_type || TAX_RATE_TYPE.PERCENTAGE);
			},
		},
		{
			title: 'Rate',
			render: (row) => {
				const taxRate = taxRatesMap.get(row.tax_rate_id);
				return formatTaxValue(taxRate);
			},
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
				<div className='text-center text-gray-500 py-8'>
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
