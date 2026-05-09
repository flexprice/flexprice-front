import type { Meta, StoryObj } from '@storybook/react';
import { InvoiceStatusBadge } from './components';

const meta = {
	title: 'FlexPrice/Molecules/InvoiceStatusBadge',
	component: InvoiceStatusBadge,
	parameters: { layout: 'centered' },
	tags: ['autodocs'],
	argTypes: {
		status: { control: 'select', options: ['paid', 'draft', 'void', 'overdue'] },
	},
	args: {
		status: 'paid',
	},
} satisfies Meta<typeof InvoiceStatusBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Variants: Story = {
	render: () => (
		<div className='flex gap-2'>
			<InvoiceStatusBadge status='paid' />
			<InvoiceStatusBadge status='draft' />
			<InvoiceStatusBadge status='overdue' />
			<InvoiceStatusBadge status='void' />
		</div>
	),
};
