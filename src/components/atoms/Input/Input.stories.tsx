import type { Meta, StoryObj } from '@storybook/react';
import { userEvent, within, expect } from '@storybook/test';
import { useState } from 'react';
import Input from './Input';

/**
 * Text and number input field used across forms in FlexPrice.
 */
const meta: Meta<typeof Input> = {
	title: 'Atoms/Input',
	component: Input,
	tags: ['autodocs'],
	parameters: {
		layout: 'centered',
	},
	argTypes: {
		variant: {
			control: 'select',
			options: ['text', 'number', 'formatted-number', 'integer'],
		},
		disabled: { control: 'boolean' },
	},
};

export default meta;
type Story = StoryObj<typeof Input>;

export const Default: Story = {
	args: {
		placeholder: 'Enter text here',
		label: 'Name',
	},
};

export const WithLabel: Story = {
	args: {
		label: 'Email Address',
		placeholder: 'name@company.com',
		type: 'email',
	},
};

export const WithError: Story = {
	args: {
		label: 'Password',
		type: 'password',
		error: 'Password must be at least 8 characters',
		placeholder: 'Enter your password',
	},
};

// ─── Currency prefix with live selector ───────────────────────────────────────
const CURRENCIES: Record<string, string> = {
	USD: '$',
	EUR: '€',
	GBP: '£',
	INR: '₹',
	JPY: '¥',
	AED: 'د.إ',
	SGD: 'S$',
	CAD: 'CA$',
};

const CurrencyAmountInput = () => {
	const [currency, setCurrency] = useState('USD');
	const [amount, setAmount] = useState('');

	return (
		<div className='w-72 space-y-3'>
			<div className='space-y-1'>
				<label className='text-sm font-medium text-zinc-950'>Currency</label>
				<select
					className='w-full h-9 px-3 rounded-[6px] border border-input bg-background text-sm outline-none focus:border-black'
					value={currency}
					onChange={(e) => setCurrency(e.target.value)}>
					{Object.keys(CURRENCIES).map((code) => (
						<option key={code} value={code}>
							{code} — {CURRENCIES[code]}
						</option>
					))}
				</select>
			</div>

			<Input
				label='Amount'
				placeholder='0.00'
				inputPrefix={<span className='text-muted-foreground text-sm font-medium min-w-[1.5rem] text-center'>{CURRENCIES[currency]}</span>}
				value={amount}
				onChange={setAmount}
				variant='formatted-number'
			/>

			{amount && (
				<p className='text-xs text-muted-foreground'>
					{CURRENCIES[currency]}
					{amount} {currency}
				</p>
			)}
		</div>
	);
};

/**
 * The currency symbol in the prefix updates live when you switch currency.
 * Covers USD $, EUR €, GBP £, INR ₹, JPY ¥ and more.
 */
export const WithCurrencyPrefix: Story = {
	render: () => <CurrencyAmountInput />,
};

export const NumberInput: Story = {
	args: {
		label: 'Quantity',
		placeholder: '0',
		variant: 'integer',
	},
};

export const Disabled: Story = {
	args: {
		label: 'Read-only Value',
		value: 'flexprice-plan-001',
		disabled: true,
	},
};

const ControlledInput = () => {
	const [value, setValue] = useState('');
	return (
		<div className='w-64'>
			<Input label='Type here' placeholder='Start typing…' value={value} onChange={setValue} />
			<p className='text-sm text-muted-foreground mt-2'>Value: {value || '(empty)'}</p>
		</div>
	);
};

export const TypeInteraction: Story = {
	render: () => <ControlledInput />,
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const input = canvas.getByRole('textbox');
		await userEvent.type(input, 'hello');
		await expect(input).toHaveValue('hello');
	},
};
