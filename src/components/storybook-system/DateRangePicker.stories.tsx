import type { Meta, StoryObj } from '@storybook/react';
import { expect, fn, userEvent, within } from '@storybook/test';
import { DateRangePicker } from './components';

const meta = {
	title: 'FlexPrice/Molecules/DateRangePicker',
	component: DateRangePicker,
	parameters: { layout: 'centered' },
	tags: ['autodocs'],
	argTypes: {
		from: { control: 'text', description: 'Start date in YYYY-MM-DD format' },
		to: { control: 'text', description: 'End date in YYYY-MM-DD format' },
	},
	args: {
		from: '2026-05-01',
		to: '2026-05-09',
		onChange: fn(),
	},
} satisfies Meta<typeof DateRangePicker>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	play: async ({ args, canvasElement }) => {
		const canvas = within(canvasElement);
		await userEvent.clear(canvas.getByLabelText(/from/i));
		await userEvent.type(canvas.getByLabelText(/from/i), '2026-05-02');
		await expect(args.onChange).toHaveBeenCalled();
	},
};

export const Variants: Story = {
	render: () => (
		<div className='grid gap-4'>
			<DateRangePicker from='2026-05-01' to='2026-05-09' />
			<DateRangePicker from='2026-04-01' to='2026-04-30' />
		</div>
	),
};
