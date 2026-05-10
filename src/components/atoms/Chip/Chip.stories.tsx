import type { Meta, StoryObj } from '@storybook/react';
import { CheckCircleIcon } from 'lucide-react';
import Chip from './Chip';

/**
 * Status chip / badge used to indicate the state of an entity (invoice, subscription, feature, etc.)
 */
const meta: Meta<typeof Chip> = {
	title: 'Atoms/Chip',
	component: Chip,
	tags: ['autodocs'],
	parameters: {
		layout: 'centered',
	},
	argTypes: {
		variant: {
			control: 'select',
			options: ['default', 'success', 'warning', 'failed', 'info'],
		},
		disabled: { control: 'boolean' },
	},
};

export default meta;
type Story = StoryObj<typeof Chip>;

export const Default: Story = {
	args: {
		label: 'Archived',
		variant: 'default',
	},
};

export const AllVariants: Story = {
	render: () => (
		<div className='flex flex-wrap gap-3'>
			<Chip label='Active' variant='success' />
			<Chip label='Draft' variant='warning' />
			<Chip label='Cancelled' variant='failed' />
			<Chip label='Pending' variant='info' />
			<Chip label='Archived' variant='default' />
		</div>
	),
};

export const WithIcon: Story = {
	render: () => (
		<div className='flex flex-wrap gap-3'>
			<Chip label='Paid' variant='success' icon={<CheckCircleIcon size={14} />} />
			<Chip label='Failed' variant='failed' icon={<CheckCircleIcon size={14} />} />
		</div>
	),
};

export const Disabled: Story = {
	args: {
		label: 'Disabled',
		variant: 'info',
		disabled: true,
	},
};
