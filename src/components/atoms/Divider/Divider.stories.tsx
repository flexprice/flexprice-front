/* eslint-disable i18next/no-literal-string */
import type { Meta, StoryObj } from '@storybook/react';
import Divider from './Divider';

const meta: Meta<typeof Divider> = {
	title: 'Atoms/Divider',
	component: Divider,
	parameters: {
		layout: 'padded',
	},
	tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Center: Story = {
	args: {
		alignment: 'center',
		width: '100%',
	},
	render: (args) => (
		<div className='w-full max-w-md space-y-3'>
			<p className='text-sm text-muted-foreground'>Centered divider</p>
			<Divider {...args} />
		</div>
	),
};

export const Left: Story = {
	args: {
		alignment: 'left',
		width: '60%',
	},
	render: (args) => (
		<div className='w-full max-w-md space-y-3'>
			<p className='text-sm text-muted-foreground'>Left aligned divider</p>
			<Divider {...args} />
		</div>
	),
};

export const Right: Story = {
	args: {
		alignment: 'right',
		width: '40%',
	},
	render: (args) => (
		<div className='w-full max-w-md space-y-3'>
			<p className='text-sm text-muted-foreground'>Right aligned divider</p>
			<Divider {...args} />
		</div>
	),
};
