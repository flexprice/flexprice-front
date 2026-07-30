import { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import FlexpriceTable, { ColumnData } from '@/components/molecules/Table';
import { AddButton, FormHeader, Button } from '@/components/atoms';
import Dialog from '@/components/atoms/Dialog';
import CustomerMultiSearchSelect from '@/components/molecules/Customer/CustomerMultiSearchSelect';
import { Customer } from '@/models';
import { Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface InheritedCustomersTableProps {
	data: Customer[];
	onChange: (customers: Customer[]) => void;
	disabled?: boolean;
	/** Subscription customer id — excluded from picker along with rows already in the table */
	subscriberCustomerId: string;
}

const InheritedCustomersTable: React.FC<InheritedCustomersTableProps> = ({ data, onChange, disabled = false, subscriberCustomerId }) => {
	const { t } = useTranslation(['customers', 'common']);
	const [dialogOpen, setDialogOpen] = useState(false);
	const [selectedCustomers, setSelectedCustomers] = useState<Customer[]>([]);

	useEffect(() => {
		if (!dialogOpen) {
			setSelectedCustomers([]);
		}
	}, [dialogOpen]);

	const excludeIds = useMemo(() => {
		const ids = [subscriberCustomerId, ...data.map((c) => c.id)].filter(Boolean);
		return ids;
	}, [subscriberCustomerId, data]);

	const handleAdd = () => {
		if (selectedCustomers.length === 0) return;
		const existingIds = new Set(data.map((c) => c.id));
		const toAdd = selectedCustomers.filter((c) => c.id && !existingIds.has(c.id));
		if (toAdd.length === 0) return;
		onChange([...data, ...toAdd]);
		setDialogOpen(false);
		setSelectedCustomers([]);
	};

	const handleRemove = useCallback(
		(customerId: string) => {
			onChange(data.filter((c) => c.id !== customerId));
		},
		[data, onChange],
	);

	const columns: ColumnData<Customer>[] = useMemo(
		() => [
			{
				title: t('inheritanceTable.columns.customer'),
				render: (row) => <span className='font-medium text-foreground'>{row.name || t('usageTable.featureTypes.dash')}</span>,
			},
			{
				title: t('inheritanceTable.columns.externalId'),
				render: (row) => <span className='text-muted-foreground'>{row.external_id || t('usageTable.featureTypes.dash')}</span>,
			},
			{
				fieldVariant: 'interactive',
				width: 56,
				align: 'right',
				hideOnEmpty: true,
				render: (row) => (
					<button
						type='button'
						disabled={disabled}
						data-interactive='true'
						className={cn(
							'inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground',
							'hover:bg-destructive/10 hover:text-destructive',
							'disabled:pointer-events-none disabled:opacity-40',
						)}
						aria-label={`${t('inheritanceTable.removeAriaPrefix')} ${row.name ?? ''}`}
						onClick={() => handleRemove(row.id)}>
						<Trash2 className='h-4 w-4' />
					</button>
				),
			},
		],
		[disabled, handleRemove, t],
	);

	return (
		<>
			<Dialog
				isOpen={dialogOpen}
				onOpenChange={setDialogOpen}
				title={t('inheritanceTable.addDialogTitle')}
				className='max-w-2xl sm:max-w-[42rem] w-[calc(100vw-2rem)]'
				descriptionClassName='mt-3'>
				<div className='space-y-5 min-w-0'>
					<CustomerMultiSearchSelect
						value={selectedCustomers}
						onChange={setSelectedCustomers}
						excludeId={excludeIds}
						limit={50}
						searchPlaceholder={t('select.searchByName')}
						display={{
							label: t('select.customersLabel'),
							placeholder: t('select.selectCustomers'),
							className: 'min-w-0',
							triggerClassName: 'min-h-11',
						}}
						options={{ modalPopover: true }}
						disabled={disabled}
					/>
					<div className='flex justify-end gap-2 pt-2'>
						<Button type='button' variant='outline' onClick={() => setDialogOpen(false)}>
							{t('common:actions.cancel')}
						</Button>
						<Button type='button' onClick={handleAdd} disabled={disabled || selectedCustomers.length === 0}>
							{selectedCustomers.length > 0
								? t('inheritanceTable.addSelected', { count: selectedCustomers.length })
								: t('inheritanceTable.add')}
						</Button>
					</div>
				</div>
			</Dialog>

			<div className='space-y-4'>
				<div className='flex items-center justify-between'>
					<FormHeader className='mb-0' title={t('inheritanceTable.sectionTitle')} variant='sub-header' />
					<AddButton onClick={() => setDialogOpen(true)} disabled={disabled} />
				</div>
				<div className='rounded-[6px] border border-gray-300'>
					<FlexpriceTable data={data} columns={columns} showEmptyRow />
				</div>
			</div>
		</>
	);
};

export default InheritedCustomersTable;
