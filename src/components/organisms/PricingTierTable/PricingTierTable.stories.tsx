import type { Meta, StoryObj } from '@storybook/react';
import PricingTierTable, { PricingTier } from './PricingTierTable';

/**
 * Displays pricing tiers for a plan. Supports flat, per-unit, tiered, graduated, and volume pricing models.
 */
const meta: Meta<typeof PricingTierTable> = {
	title: 'Organisms/PricingTierTable',
	component: PricingTierTable,
	tags: ['autodocs'],
	parameters: {
		layout: 'centered',
	},
	argTypes: {
		model: {
			control: 'select',
			options: ['flat', 'per_unit', 'tiered', 'graduated', 'volume'],
		},
		currency: { control: 'text' },
	},
};

export default meta;
type Story = StoryObj<typeof PricingTierTable>;

export const FlatRate: Story = {
	args: {
		model: 'flat',
		currency: 'USD',
		tiers: [{ from: 0, to: null, unitPrice: 99.0 }] satisfies PricingTier[],
	},
};

export const TieredPricing: Story = {
	args: {
		model: 'tiered',
		currency: 'USD',
		unitLabel: 'event',
		tiers: [
			{ from: 0, to: 1000, unitPrice: 0.01 },
			{ from: 1001, to: 10000, unitPrice: 0.008 },
			{ from: 10001, to: null, unitPrice: 0.005 },
		] satisfies PricingTier[],
	},
};

export const GraduatedPricing: Story = {
	args: {
		model: 'graduated',
		currency: 'USD',
		unitLabel: 'call',
		tiers: [
			{ from: 0, to: 500, unitPrice: 0.02, flatFee: 0 },
			{ from: 501, to: 5000, unitPrice: 0.015, flatFee: 10 },
			{ from: 5001, to: null, unitPrice: 0.01, flatFee: 50 },
		] satisfies PricingTier[],
	},
};

export const VolumeDiscounts: Story = {
	args: {
		model: 'volume',
		currency: 'USD',
		unitLabel: 'seat',
		tiers: [
			{ from: 1, to: 10, unitPrice: 25.0 },
			{ from: 11, to: 50, unitPrice: 20.0 },
			{ from: 51, to: 200, unitPrice: 15.0 },
			{ from: 201, to: null, unitPrice: 10.0 },
		] satisfies PricingTier[],
	},
};
