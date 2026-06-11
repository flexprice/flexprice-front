import type { Meta, StoryObj } from '@storybook/react';
import MetricCard from './MetricCard';

const meta: Meta<typeof MetricCard> = {
	title: 'Molecules/MetricCard',
	component: MetricCard,
	parameters: {
		layout: 'centered',
	},
	tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Revenue: Story = {
	args: {
		title: 'Monthly revenue',
		value: 12450.5,
		currency: 'USD',
		showChangeIndicator: true,
	},
};

export const ConversionRate: Story = {
	args: {
		title: 'Conversion rate',
		value: 8.42,
		isPercent: true,
		showChangeIndicator: true,
	},
};

export const NegativeTrend: Story = {
	args: {
		title: 'Refund rate',
		value: 2.18,
		isPercent: true,
		showChangeIndicator: true,
		isNegative: true,
	},
};
