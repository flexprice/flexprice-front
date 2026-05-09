import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, within } from '@storybook/test';
import { DataTable, DataTableColumn, FieldInput, FlexButton, InvoiceStatusBadge, StatusChip, invoiceRows, makeCustomerRows } from './components';
import { useFilterStore } from './useFilterStore';

type InvoiceRow = (typeof invoiceRows)[number];
type CustomerRow = ReturnType<typeof makeCustomerRows>[number];

const invoiceColumns: DataTableColumn<InvoiceRow>[] = [
	{ key: 'id', header: 'Invoice', sortable: true },
	{ key: 'customer', header: 'Customer', sortable: true },
	{ key: 'status', header: 'Status', render: (row) => <InvoiceStatusBadge status={row.status} /> },
	{ key: 'amount', header: 'Amount', sortable: true },
	{ key: 'due', header: 'Due date' },
];

const customerColumns: DataTableColumn<CustomerRow>[] = [
	{ key: 'id', header: 'Customer ID', width: 1.2, sortable: true },
	{ key: 'name', header: 'Name', sortable: true },
	{ key: 'plan', header: 'Plan', sortable: true },
	{ key: 'status', header: 'Status', render: (row) => <StatusChip status={row.status} /> },
	{ key: 'usage', header: 'Usage' },
	{ key: 'notes', header: 'Notes', width: 2, render: (row) => <span className='block whitespace-normal leading-5'>{row.notes}</span> },
];

const meta = {
	title: 'FlexPrice/Molecules/DataTable',
	component: DataTable<InvoiceRow>,
	parameters: { layout: 'padded' },
	tags: ['autodocs'],
	argTypes: {
		loading: { control: 'boolean' },
		virtualized: { control: 'boolean' },
		page: { control: 'number' },
		pageSize: { control: 'number' },
		height: { control: 'number' },
		rowEstimate: { control: 'number' },
		dynamicRowHeight: { control: 'boolean' },
	},
	args: {
		columns: invoiceColumns,
		rows: invoiceRows,
		page: 1,
		pageSize: 3,
		loading: false,
		virtualized: false,
		dynamicRowHeight: true,
	},
} satisfies Meta<typeof DataTable<InvoiceRow>>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await userEvent.click(canvas.getByRole('button', { name: /customer/i }));
		await expect(canvas.getByText('Northstar Cloud')).toBeInTheDocument();
	},
};

export const Variants: Story = {
	render: () => (
		<div className='grid gap-6'>
			<DataTable columns={invoiceColumns} rows={invoiceRows} pageSize={2} />
			<DataTable columns={invoiceColumns} rows={[]} emptyMessage='No invoices match the current filters' />
			<DataTable columns={invoiceColumns} rows={invoiceRows} loading />
		</div>
	),
};

export const VirtualizedTenThousandRows: Story = {
	render: () => <DataTable columns={customerColumns} rows={makeCustomerRows(10000)} virtualized height={520} rowEstimate={52} dynamicRowHeight />,
	parameters: {
		docs: {
			description: {
				story: 'Renders 10,000 rows with @tanstack/react-virtual. The notes column intentionally creates mixed row heights, and DataTable measures rows dynamically with measureElement.',
			},
		},
	},
};

const FilteredTableDemo = () => {
	const { filters, resetFilters, setFilter } = useFilterStore('/invoices');
	const search = String(filters.search ?? '');
	const status = String(filters.status ?? '');
	const rows = invoiceRows.filter((row) => {
		const matchesSearch = search ? row.customer.toLowerCase().includes(search.toLowerCase()) : true;
		const matchesStatus = status ? row.status === status : true;
		return matchesSearch && matchesStatus;
	});

	return (
		<div className='grid gap-3'>
			<div className='flex flex-wrap items-end gap-3 rounded-[6px] border border-zinc-200 bg-white p-3'>
				<FieldInput label='Customer search' placeholder='Search customer' value={search} onChange={(event) => setFilter('search', event.target.value)} />
				<FieldInput label='Status' placeholder='paid, draft, overdue' value={status} onChange={(event) => setFilter('status', event.target.value)} />
				<FlexButton variant='secondary' onClick={resetFilters}>
					Reset
				</FlexButton>
			</div>
			<DataTable columns={invoiceColumns} rows={rows} emptyMessage='No persisted-filter matches' />
			<p className='text-xs text-zinc-500'>Filters persist in sessionStorage under filters:invoices while only a shallow fingerprint is synced to the URL.</p>
		</div>
	);
};

export const WithFilterPersistence: Story = {
	render: () => <FilteredTableDemo />,
};
