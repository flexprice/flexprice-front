import { FC, useState } from 'react';
import FlexpriceTable, { ColumnData } from '../Table';
import { TaxRateOverride } from '@/types/dto/tax';
import { Chip, ActionButton, AddButton, FormHeader } from '@/components/atoms';
import TaxAssociationDialog from '../TaxAssociationDialog/TaxAssociationDialog';
import { TAXRATE_ENTITY_TYPE } from '@/models/Tax';
import { useTranslation } from 'react-i18next';

interface Props {
	data: TaxRateOverride[];
	onChange: (data: TaxRateOverride[]) => void;
	disabled?: boolean;
}

const SubscriptionTaxAssociationTable: FC<Props> = ({ data, onChange, disabled }) => {
	const { t } = useTranslation('common');
	const [isOpen, setIsOpen] = useState(false);
	const [selectedTaxOverride, setSelectedTaxOverride] = useState<TaxRateOverride | null>(null);

	const handleSave = (taxAssociationRequest: any) => {
		// Convert CreateTaxAssociationRequest to TaxRateOverride
		const newTaxOverride: TaxRateOverride = {
			tax_rate_code: taxAssociationRequest.tax_rate_code,
			priority: taxAssociationRequest.priority,
			currency: taxAssociationRequest.currency.toLowerCase(),
			auto_apply: taxAssociationRequest.auto_apply,
		};

		if (selectedTaxOverride) {
			// Edit existing tax override
			onChange(data.map((tax) => (tax.tax_rate_code === selectedTaxOverride.tax_rate_code ? newTaxOverride : tax)));
		} else {
			// Add new tax override
			onChange([...data, newTaxOverride]);
		}
		setIsOpen(false);
		setSelectedTaxOverride(null);
	};

	const handleDelete = async (taxRateCode: string) => {
		onChange(data.filter((tax) => tax.tax_rate_code !== taxRateCode));
	};

	const handleEdit = (taxOverride: TaxRateOverride) => {
		setSelectedTaxOverride(taxOverride);
		setIsOpen(true);
	};

	const columns: ColumnData<TaxRateOverride>[] = [
		{
			title: 'Tax Rate',
			render: (row) => {
				return <div>{row.tax_rate_code}</div>;
			},
		},
		{
			title: 'Priority',
			render: (row) => row.priority || '--',
		},
		{
			title: 'Auto Apply',
			render: (row) => <Chip variant={row.auto_apply ? 'success' : 'default'} label={row.auto_apply ? t('labels.yes') : t('labels.no')} />,
		},
		{
			title: 'Currency',
			render: (row) => row.currency,
		},
		{
			fieldVariant: 'interactive',
			hideOnEmpty: true,
			render: (row) => (
				<ActionButton
					id={row.tax_rate_code}
					copyId={{ entityType: 'Tax Rate' }}
					deleteMutationFn={() => handleDelete(row.tax_rate_code)}
					refetchQueryKey='subscription_tax_overrides'
					entityName={`Tax Override ${row.tax_rate_code}`}
					edit={{
						enabled: !disabled,
						onClick: () => handleEdit(row),
					}}
					archive={{
						enabled: !disabled,
						text: t('actions.delete'),
					}}
				/>
			),
		},
	];

	return (
		<div>
			<TaxAssociationDialog
				open={isOpen}
				onOpenChange={setIsOpen}
				entityType={TAXRATE_ENTITY_TYPE.SUBSCRIPTION}
				entityId='temp'
				onSave={handleSave}
				data={{
					tax_rate_code: selectedTaxOverride?.tax_rate_code || '',
					entity_type: TAXRATE_ENTITY_TYPE.SUBSCRIPTION,
					entity_id: 'temp',
					priority: selectedTaxOverride?.priority || 1,
					currency: selectedTaxOverride?.currency || 'usd',
					auto_apply: selectedTaxOverride?.auto_apply || true,
				}}
				onCancel={() => {
					setIsOpen(false);
					setSelectedTaxOverride(null);
				}}
			/>
			<div className='space-y-4'>
				<div className='flex items-center justify-between'>
					<FormHeader className='mb-0' title={t('labels.taxes')} variant='sub-header' />
					<AddButton
						onClick={() => {
							setSelectedTaxOverride(null);
							setIsOpen(true);
						}}
						disabled={disabled}
					/>
				</div>
				<div className='rounded-[6px] border border-line-strong'>
					<FlexpriceTable data={data} columns={columns} showEmptyRow />
				</div>
			</div>
		</div>
	);
};

export default SubscriptionTaxAssociationTable;
