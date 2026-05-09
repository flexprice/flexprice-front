import type { Meta, StoryObj } from '@storybook/react';
import { MetricCard } from './components';

const meta = {
	title: 'FlexPrice/Molecules/MetricCard',
	component: MetricCard,
	parameters: { layout: 'centered' },
	tags: ['autodocs'],
	argTypes: {
		label: { control: 'text' },
		value: { control: 'text' },
		trend: { control: 'number' },
		helperText: { control: 'text' },
	},
	args: {
		label: 'Monthly recurring revenue',
		value: '$128,420',
		trend: 12,
		helperText: 'Compared with the previous 30 days',
	},
} satisfies Meta<typeof MetricCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Variants: Story = {
	render: () => (
		<div className='grid w-[760px] grid-cols-3 gap-4'>
			<MetricCard label='MRR' value='$128,420' trend={12} helperText='Up from April' />
			<MetricCard label='Failed invoices' value='18' trend={-8} helperText='Needs collection follow-up' />
			<MetricCard label='Usage events' value='4.8M' helperText='Current billing period' />
		</div>
	),
};
