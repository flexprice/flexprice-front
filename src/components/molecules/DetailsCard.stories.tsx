import type { Meta, StoryObj } from '@storybook/react';
import DetailsCard, { type Detail } from './DetailsCard/DetailsCard';

const meta: Meta<typeof DetailsCard> = {
	title: 'Molecules/DetailsCard',
	component: DetailsCard,
	parameters: {
		layout: 'padded',
	},
	tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

const baseData: Detail[] = [
	{ label: 'Plan name', value: 'Pro' },
	{ label: 'Status', value: 'Published', tag: { text: 'Live', variant: 'default' } },
	{ label: 'Seats', value: 'Unlimited' },
	{ variant: 'divider' },
	{ variant: 'heading', label: 'Billing' },
	{ label: 'Currency', value: 'USD' },
	{ label: 'Price', value: '$49 / month', labelStyle: 'semibold' },
];

export const Default: Story = {
	args: {
		title: 'Plan details',
		data: baseData,
	},
};

export const Stacked: Story = {
	args: {
		title: 'Plan details',
		variant: 'stacked',
		cardStyle: 'compact',
		gridCols: 3,
		data: baseData,
	},
};
