import type { Meta, StoryObj } from '@storybook/react';
import Input from './Input';

const meta = {
	title: 'Atoms/Input',
	component: Input,
	parameters: {
		layout: 'centered',
	},
	tags: ['autodocs'],
	argTypes: {
		label: { control: 'text' },
		placeholder: { control: 'text' },
		error: { control: 'text' },
		disabled: { control: 'boolean' },
		variant: { control: 'select', options: ['text', 'number', 'formatted-number', 'integer'] },
	},
	args: {
		label: 'Email',
		placeholder: 'billing@example.com',
		variant: 'text',
	},
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Variants: Story = {
	render: () => (
		<div className='grid w-[360px] gap-4'>
			<Input label='Email' placeholder='billing@example.com' />
			<Input label='Usage limit' variant='integer' placeholder='10000' suffix='events' />
			<Input label='Monthly minimum' variant='formatted-number' inputPrefix='$' value='2500' />
			<Input label='API key' value='sk_live_...' disabled readOnly />
			<Input label='Billing email' placeholder='billing@example.com' error='Enter a valid email address' />
		</div>
	),
};
