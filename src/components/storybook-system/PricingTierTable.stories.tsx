import type { Meta, StoryObj } from '@storybook/react';
import { PricingTierTable } from './components';

const tiers = [
	{ from: 1, to: 10000, unitPrice: 0, type: 'tiered' as const },
	{ from: 10001, to: 100000, unitPrice: 0.002, type: 'tiered' as const },
	{ from: 100001, unitPrice: 0.0012, type: 'tiered' as const },
];

const meta = {
	title: 'FlexPrice/Organisms/PricingTierTable',
	component: PricingTierTable,
	parameters: { layout: 'centered' },
	tags: ['autodocs'],
	argTypes: {
		currency: { control: 'select', options: ['USD', 'EUR', 'INR'] },
	},
	args: {
		currency: 'USD',
		tiers,
	},
} satisfies Meta<typeof PricingTierTable>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Variants: Story = {
	render: () => (
		<div className='grid w-[620px] gap-6'>
			<PricingTierTable tiers={tiers} />
			<PricingTierTable
				currency='INR'
				tiers={[
					{ from: 1, to: 50, unitPrice: 499, type: 'graduated' },
					{ from: 51, to: 250, unitPrice: 399, type: 'graduated' },
					{ from: 251, unitPrice: 299, type: 'graduated' },
				]}
			/>
		</div>
	),
};
