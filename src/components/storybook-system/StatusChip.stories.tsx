import type { Meta, StoryObj } from '@storybook/react';
import { StatusChip } from './components';

const meta = {
	title: 'FlexPrice/Atoms/StatusChip',
	component: StatusChip,
	parameters: { layout: 'centered' },
	tags: ['autodocs'],
	argTypes: {
		status: {
			control: 'select',
			options: ['active', 'archived', 'paid', 'draft', 'void', 'overdue', 'trialing', 'canceled', 'past_due'],
		},
		showDot: { control: 'boolean' },
	},
	args: {
		status: 'active',
		showDot: true,
	},
} satisfies Meta<typeof StatusChip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Variants: Story = {
	render: () => (
		<div className='flex flex-wrap gap-2'>
			{(['active', 'archived', 'paid', 'draft', 'void', 'overdue', 'trialing', 'canceled', 'past_due'] as const).map((status) => (
				<StatusChip key={status} status={status} />
			))}
		</div>
	),
};
