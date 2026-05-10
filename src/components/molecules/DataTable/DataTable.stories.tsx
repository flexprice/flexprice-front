import type { Meta, StoryObj } from '@storybook/react';
import { ColumnDef } from '@tanstack/react-table';
import InvoiceStatusBadge, { InvoiceStatus } from '../InvoiceStatusBadge/InvoiceStatusBadge';
import DataTable from './DataTable';

/**
 * Generic sortable, paginated data table built on @tanstack/react-table.
 * Skeleton loading keeps the table shape visible so users know what's coming.
 */
const meta: Meta<typeof DataTable> = {
	title: 'Molecules/DataTable',
	component: DataTable,
	tags: ['autodocs'],
	parameters: {
		layout: 'padded',
	},
};

export default meta;
type Story = StoryObj<typeof DataTable>;

// ─── Invoice table (matches reference design) ─────────────────────────────────
interface Invoice {
	id: string;
	customer: string;
	plan: string;
	status: InvoiceStatus;
	amount: number;
	issued: string;
}

const ALL_INVOICES: Invoice[] = [
	{ id: 'INV-1001', customer: 'Acme Corp', plan: 'Scale', status: 'paid', amount: 4820, issued: '2026-05-01' },
	{ id: 'INV-1002', customer: 'Northstar Labs', plan: 'Launch', status: 'draft', amount: 940, issued: '2026-05-03' },
	{ id: 'INV-1003', customer: 'Orbit Analytics', plan: 'Enterprise', status: 'finalized', amount: 12400, issued: '2026-05-05' },
	{ id: 'INV-1004', customer: 'Helio Systems', plan: 'Scale', status: 'void', amount: 2100, issued: '2026-05-06' },
	{ id: 'INV-1005', customer: 'Vertex Cloud', plan: 'Growth', status: 'paid', amount: 3300, issued: '2026-05-07' },
	{ id: 'INV-1006', customer: 'Pulsar Inc', plan: 'Starter', status: 'draft', amount: 250, issued: '2026-05-08' },
	{ id: 'INV-1007', customer: 'Redshift Co', plan: 'Enterprise', status: 'paid', amount: 18750, issued: '2026-05-09' },
	{ id: 'INV-1008', customer: 'Nova Payments', plan: 'Launch', status: 'uncollectible', amount: 1100, issued: '2026-05-10' },
];

const INVOICE_COLUMNS: ColumnDef<Invoice>[] = [
	{
		accessorKey: 'id',
		header: 'Invoice',
		cell: ({ getValue }) => <span className='font-medium text-gray-900'>{getValue() as string}</span>,
	},
	{
		accessorKey: 'customer',
		header: 'Customer',
	},
	{
		accessorKey: 'plan',
		header: 'Plan',
		enableSorting: false,
	},
	{
		accessorKey: 'status',
		header: 'Status',
		enableSorting: false,
		cell: ({ getValue }) => <InvoiceStatusBadge status={getValue() as InvoiceStatus} />,
	},
	{
		accessorKey: 'amount',
		header: 'Amount',
		cell: ({ getValue }) => `$${(getValue() as number).toLocaleString()}`,
	},
	{
		accessorKey: 'issued',
		header: 'Issued',
	},
];

export const Default: Story = {
	render: () => <DataTable columns={INVOICE_COLUMNS} data={ALL_INVOICES} pageSize={4} />,
};

export const Loading: Story = {
	render: () => (
		<div className='space-y-2'>
			<p className='text-xs text-muted-foreground'>Skeleton preserves the table shape — user knows data is on its way.</p>
			<DataTable columns={INVOICE_COLUMNS} data={[]} isLoading />
		</div>
	),
};

export const Empty: Story = {
	render: () => (
		<DataTable
			columns={INVOICE_COLUMNS}
			data={[]}
			emptyState={
				<div className='flex flex-col items-center gap-1 py-4'>
					<p className='font-medium text-gray-700'>No invoices found</p>
					<p className='text-sm text-muted-foreground'>Invoices appear here once subscriptions are active.</p>
				</div>
			}
		/>
	),
};

export const Sortable: Story = {
	render: () => (
		<div className='space-y-2'>
			<p className='text-xs text-muted-foreground'>Click a column header to sort. Active sort highlights in blue.</p>
			<DataTable columns={INVOICE_COLUMNS} data={ALL_INVOICES} pageSize={4} />
		</div>
	),
};

// ─── Simple customer table ─────────────────────────────────────────────────────
interface Customer {
	id: string;
	name: string;
	email: string;
	plan: string;
	mrr: number;
}

const CUSTOMERS: Customer[] = Array.from({ length: 18 }, (_, i) => ({
	id: `cust_${i + 1}`,
	name: `Customer ${i + 1}`,
	email: `customer${i + 1}@example.com`,
	plan: ['Starter', 'Growth', 'Enterprise'][i % 3],
	mrr: Math.round((i + 1) * 312 + 100),
}));

const CUSTOMER_COLUMNS: ColumnDef<Customer>[] = [
	{ accessorKey: 'name', header: 'Name' },
	{ accessorKey: 'email', header: 'Email' },
	{ accessorKey: 'plan', header: 'Plan' },
	{
		accessorKey: 'mrr',
		header: 'MRR (USD)',
		cell: ({ getValue }) => `$${(getValue() as number).toLocaleString()}`,
	},
];

export const WithPagination: Story = {
	render: () => (
		<div className='space-y-2'>
			<p className='text-xs text-muted-foreground'>18 rows, 5 per page — footer shows row count and page controls.</p>
			<DataTable columns={CUSTOMER_COLUMNS} data={CUSTOMERS} pageSize={5} />
		</div>
	),
};

// ─── Challenge B: Virtualised 10k rows ─────────────────────────────────────────
interface Row {
	id: number;
	name: string;
	value: number;
	category: string;
	status: string;
}

const LARGE_DATASET: Row[] = Array.from({ length: 10000 }, (_, i) => ({
	id: i + 1,
	name: `Item ${i + 1}`,
	value: Math.round((i + 1) * 1.7 + 50),
	category: ['Alpha', 'Beta', 'Gamma'][i % 3],
	status: ['active', 'inactive', 'pending'][i % 3],
}));

const LARGE_COLUMNS: ColumnDef<Row>[] = [
	{ accessorKey: 'id', header: 'ID' },
	{ accessorKey: 'name', header: 'Name' },
	{ accessorKey: 'value', header: 'Value', cell: ({ getValue }) => `$${(getValue() as number).toLocaleString()}` },
	{ accessorKey: 'category', header: 'Category' },
	{ accessorKey: 'status', header: 'Status' },
];

export const Virtualised: Story = {
	render: () => (
		<div className='space-y-2'>
			<p className='text-xs text-muted-foreground'>10,000 rows rendered with virtualisation — scroll is smooth and instant.</p>
			<DataTable columns={LARGE_COLUMNS} data={LARGE_DATASET} virtualise rowHeight={52} />
		</div>
	),
};
