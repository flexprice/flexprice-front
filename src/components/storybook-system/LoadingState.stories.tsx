import type { Meta, StoryObj } from '@storybook/react';
import { LoadingState } from './components';

const meta = {
	title: 'FlexPrice/Atoms/LoadingState',
	component: LoadingState,
	parameters: { layout: 'centered' },
	tags: ['autodocs'],
	argTypes: {
		label: { control: 'text' },
		size: { control: 'select', options: ['sm', 'md', 'lg'] },
	},
	args: {
		label: 'Loading invoices',
		size: 'md',
	},
} satisfies Meta<typeof LoadingState>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Variants: Story = {
	render: () => (
		<div className='grid gap-4'>
			<LoadingState label='Fetching' size='sm' />
			<LoadingState label='Reconciling invoice lines' size='md' />
			<LoadingState label='Preparing usage import' size='lg' />
		</div>
	),
};
