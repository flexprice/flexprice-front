import type { Meta, StoryObj } from '@storybook/react';
import MeterProgress from './MeterProgress';

/**
 * Progress bar component for displaying usage vs total quota.
 * Color-coded: blue (<70%), amber (70–90%), red (>90%).
 */
const meta: Meta<typeof MeterProgress> = {
	title: 'Molecules/MeterProgress',
	component: MeterProgress,
	tags: ['autodocs'],
	parameters: {
		layout: 'padded',
	},
	argTypes: {
		showPercentage: { control: 'boolean' },
	},
};

export default meta;
type Story = StoryObj<typeof MeterProgress>;

export const Default: Story = {
	args: {
		label: 'API Calls',
		used: 75,
		total: 1000,
		unit: 'calls',
		showPercentage: true,
	},
};

export const LowUsage: Story = {
	args: {
		label: 'API Calls',
		used: 75,
		total: 1000,
		unit: 'calls',
	},
};

export const WarningUsage: Story = {
	args: {
		label: 'Storage',
		used: 750,
		total: 1000,
		unit: 'GB',
	},
};

export const CriticalUsage: Story = {
	args: {
		label: 'Seats',
		used: 950,
		total: 1000,
		unit: 'seats',
	},
};

export const MultipleMeters: Story = {
	render: () => (
		<div className='space-y-4 w-96'>
			<MeterProgress label='API Calls' used={75} total={1000} unit='calls' />
			<MeterProgress label='Storage' used={750} total={1000} unit='GB' />
			<MeterProgress label='Active Seats' used={950} total={1000} unit='seats' />
			<MeterProgress label='Events Processed' used={12000} total={50000} unit='events' />
		</div>
	),
};
