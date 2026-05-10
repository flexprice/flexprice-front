import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import FlexPriceSelect from './Select';

/**
 * Dropdown select used for single-value selection across FlexPrice forms.
 */
const meta: Meta<typeof FlexPriceSelect> = {
	title: 'Atoms/Select',
	component: FlexPriceSelect,
	tags: ['autodocs'],
	parameters: {
		layout: 'centered',
		// Ensure dropdown renders with solid white bg and enough canvas height
		docs: { story: { height: '260px' } },
		backgrounds: { default: 'light' },
	},
	decorators: [
		(Story) => (
			<div className='bg-white p-6 rounded-lg min-h-[220px] w-72'>
				<Story />
			</div>
		),
	],
	argTypes: {
		disabled: { control: 'boolean' },
		isRadio: { control: 'boolean' },
	},
};

export default meta;
type Story = StoryObj<typeof FlexPriceSelect>;

const BILLING_PERIOD_OPTIONS = [
	{ value: 'monthly', label: 'Monthly' },
	{ value: 'quarterly', label: 'Quarterly' },
	{ value: 'annual', label: 'Annual' },
	{ value: 'weekly', label: 'Weekly' },
];

export const Default: Story = {
	args: {
		label: 'Billing Period',
		placeholder: 'Select billing period',
		options: BILLING_PERIOD_OPTIONS,
		// contentClassName forces solid white on the portal-rendered dropdown
		contentClassName: 'bg-white',
	},
};

const ControlledSelect = () => {
	const [value, setValue] = useState('');
	return (
		<div className='w-64'>
			<FlexPriceSelect
				label='Billing Period'
				placeholder='Select billing period'
				options={BILLING_PERIOD_OPTIONS}
				value={value}
				onChange={setValue}
			/>
		</div>
	);
};

export const Controlled: Story = {
	render: () => <ControlledSelect />,
};

const RadioSelect = () => {
	const [value, setValue] = useState('');
	return (
		<div className='w-64'>
			<FlexPriceSelect
				label='Plan Type'
				placeholder='Select plan type'
				options={[
					{ value: 'flat', label: 'Flat Rate', description: 'One price for all usage' },
					{ value: 'per_unit', label: 'Per Unit', description: 'Price per unit consumed' },
					{ value: 'tiered', label: 'Tiered', description: 'Different prices per tier' },
				]}
				value={value}
				onChange={setValue}
				isRadio
			/>
		</div>
	);
};

export const WithRadio: Story = {
	render: () => <RadioSelect />,
};

export const WithError: Story = {
	args: {
		label: 'Currency',
		placeholder: 'Select currency',
		options: BILLING_PERIOD_OPTIONS,
		error: 'Please select a currency',
	},
};

export const Disabled: Story = {
	args: {
		label: 'Billing Period',
		placeholder: 'Select billing period',
		options: BILLING_PERIOD_OPTIONS,
		value: 'monthly',
		disabled: true,
	},
};
