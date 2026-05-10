import type { Meta, StoryObj } from '@storybook/react';
import { expect, fn, userEvent, within } from '@storybook/test';
import { SelectDropdown } from './components';

const options = [
	{ label: 'Starter', value: 'starter', description: 'Self-serve plan' },
	{ label: 'Growth', value: 'growth', description: 'Usage-based team plan' },
	{ label: 'Scale', value: 'scale', description: 'Enterprise commitments' },
];

const meta = {
	title: 'FlexPrice/Atoms/SelectDropdown',
	component: SelectDropdown,
	parameters: { layout: 'centered' },
	tags: ['autodocs'],
	argTypes: {
		searchable: { control: 'boolean' },
		placeholder: { control: 'text' },
		value: { control: 'select', options: ['starter', 'growth', 'scale'] },
	},
	args: {
		label: 'Plan',
		options,
		placeholder: 'Select plan',
		searchable: true,
		onValueChange: fn(),
	},
} satisfies Meta<typeof SelectDropdown>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	play: async ({ args, canvasElement }) => {
		const canvas = within(canvasElement);
		await userEvent.click(canvas.getByRole('button', { name: /select plan/i }));
		await userEvent.type(canvas.getByLabelText(/search options/i), 'growth');
		await userEvent.click(canvas.getByRole('option', { name: /growth/i }));
		await expect(args.onValueChange).toHaveBeenCalledWith('growth');
	},
};

export const Variants: Story = {
	render: () => (
		<div className='grid w-[260px] gap-4'>
			<SelectDropdown label='Searchable plan' options={options} searchable placeholder='Choose plan' />
			<SelectDropdown label='Selected plan' options={options} value='scale' />
		</div>
	),
};
