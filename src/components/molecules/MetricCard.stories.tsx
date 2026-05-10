import type { Meta, StoryObj } from '@storybook/react';
import MetricCard from './MetricCard';

/**
 * Summary card displaying a key metric with optional currency, percentage, and trend indicator.
 * `showChangeIndicator` is on by default so toggling `isNegative` immediately shows the effect.
 */
const meta: Meta<typeof MetricCard> = {
	title: 'Molecules/MetricCard',
	component: MetricCard,
	tags: ['autodocs'],
	parameters: {
		layout: 'centered',
	},
	// showChangeIndicator=true by default so isNegative has a visible effect
	args: {
		showChangeIndicator: true,
		isNegative: false,
	},
	argTypes: {
		showChangeIndicator: { control: 'boolean' },
		isNegative: { control: 'boolean' },
		isPercent: { control: 'boolean' },
	},
};

export default meta;
type Story = StoryObj<typeof MetricCard>;

export const Default: Story = {
	args: {
		title: 'Total Customers',
		value: 1284,
		showChangeIndicator: true,
		isNegative: false,
	},
};

export const WithCurrency: Story = {
	args: {
		title: 'Monthly Revenue',
		value: 48320,
		currency: 'USD',
		showChangeIndicator: true,
		isNegative: false,
	},
};

export const WithPercent: Story = {
	args: {
		title: 'Conversion Rate',
		value: 73.5,
		isPercent: true,
		showChangeIndicator: true,
		isNegative: false,
	},
};

export const TrendUp: Story = {
	args: {
		title: 'New Subscriptions',
		value: 342,
		showChangeIndicator: true,
		isNegative: false,
	},
};

export const TrendDown: Story = {
	args: {
		title: 'Churn Rate',
		value: 2.4,
		isPercent: true,
		showChangeIndicator: true,
		isNegative: true,
	},
};

export const AllCards: Story = {
	render: () => (
		<div className='grid grid-cols-2 gap-4 w-[600px]'>
			<MetricCard title='Monthly Revenue' value={48320} currency='USD' showChangeIndicator isNegative={false} />
			<MetricCard title='Active Customers' value={1284} showChangeIndicator isNegative={false} />
			<MetricCard title='Churn Rate' value={2.4} isPercent showChangeIndicator isNegative />
			<MetricCard title='Avg. MRR' value={37.6} currency='USD' showChangeIndicator isNegative={false} />
		</div>
	),
};
