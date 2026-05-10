import type { Meta, StoryObj } from '@storybook/react';
import InvoiceStatusBadge, { InvoiceStatus } from './InvoiceStatusBadge';

/**
 * Displays an invoice status as a colored chip composed from Chip + Lucide icon.
 */
const meta: Meta<typeof InvoiceStatusBadge> = {
	title: 'Molecules/InvoiceStatusBadge',
	component: InvoiceStatusBadge,
	tags: ['autodocs'],
	parameters: {
		layout: 'centered',
	},
	argTypes: {
		status: {
			control: 'select',
			options: ['draft', 'finalized', 'paid', 'void', 'uncollectible'] satisfies InvoiceStatus[],
		},
		showLabel: { control: 'boolean' },
	},
};

export default meta;
type Story = StoryObj<typeof InvoiceStatusBadge>;

export const Default: Story = {
	args: {
		status: 'paid',
		showLabel: true,
	},
};

export const AllStatuses: Story = {
	render: () => (
		<div className='flex flex-wrap gap-3'>
			<InvoiceStatusBadge status='draft' />
			<InvoiceStatusBadge status='finalized' />
			<InvoiceStatusBadge status='paid' />
			<InvoiceStatusBadge status='void' />
			<InvoiceStatusBadge status='uncollectible' />
		</div>
	),
};

export const IconOnly: Story = {
	render: () => (
		<div className='flex flex-wrap gap-3'>
			<InvoiceStatusBadge status='draft' showLabel={false} />
			<InvoiceStatusBadge status='finalized' showLabel={false} />
			<InvoiceStatusBadge status='paid' showLabel={false} />
			<InvoiceStatusBadge status='void' showLabel={false} />
			<InvoiceStatusBadge status='uncollectible' showLabel={false} />
		</div>
	),
};
