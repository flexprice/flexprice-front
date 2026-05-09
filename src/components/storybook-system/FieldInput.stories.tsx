import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, within } from '@storybook/test';
import { FieldInput } from './components';

const meta = {
	title: 'FlexPrice/Atoms/Input',
	component: FieldInput,
	parameters: { layout: 'centered' },
	tags: ['autodocs'],
	argTypes: {
		type: { control: 'select', options: ['text', 'number', 'email'] },
		disabled: { control: 'boolean' },
		error: { control: 'text' },
		label: { control: 'text' },
		placeholder: { control: 'text' },
	},
	args: {
		label: 'Customer name',
		placeholder: 'Acme AI',
		type: 'text',
	},
} satisfies Meta<typeof FieldInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await userEvent.type(canvas.getByLabelText(/customer name/i), 'Acme AI');
		await expect(canvas.getByDisplayValue('Acme AI')).toBeInTheDocument();
	},
};

export const Variants: Story = {
	render: () => (
		<div className='grid w-[360px] gap-4'>
			<FieldInput label='Plan name' placeholder='Growth' />
			<FieldInput label='Seats' type='number' placeholder='25' suffix='seats' />
			<FieldInput label='Monthly minimum' type='number' prefix='$' placeholder='500' />
			<FieldInput label='API key' value='sk_live_...' disabled readOnly />
			<FieldInput label='Billing email' error='Enter a valid billing email' placeholder='billing@example.com' />
		</div>
	),
};
