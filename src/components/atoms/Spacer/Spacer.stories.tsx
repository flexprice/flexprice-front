/* eslint-disable i18next/no-literal-string */
import type { Meta, StoryObj } from '@storybook/react';
import Spacer from './Spacer';

const meta: Meta<typeof Spacer> = {
	title: 'Atoms/Spacer',
	component: Spacer,
	parameters: {
		layout: 'padded',
	},
	tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Vertical: Story = {
	render: () => (
		<div className='w-full max-w-sm rounded-md border p-4'>
			<div className='rounded bg-slate-100 p-3 text-sm'>Top block</div>
			<Spacer height={24} />
			<div className='rounded bg-slate-100 p-3 text-sm'>Bottom block</div>
		</div>
	),
};

export const Horizontal: Story = {
	render: () => (
		<div className='flex items-center rounded-md border p-4 text-sm'>
			<span className='rounded bg-slate-100 px-3 py-2'>Left</span>
			<Spacer width={32} />
			<span className='rounded bg-slate-100 px-3 py-2'>Right</span>
		</div>
	),
};
