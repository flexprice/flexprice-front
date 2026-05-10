import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import DateRangePicker from './DateRangePicker';

/**
 * Calendar date range picker with timezone support and clear button.
 */
const meta: Meta<typeof DateRangePicker> = {
	title: 'Atoms/DateRangePicker',
	component: DateRangePicker,
	tags: ['autodocs'],
	parameters: {
		layout: 'centered',
		docs: { story: { height: '460px' } },
	},
	decorators: [
		(Story) => (
			<div className='bg-white p-6 rounded-lg min-h-[420px]'>
				<Story />
			</div>
		),
	],
	argTypes: { disabled: { control: 'boolean' } },
};

export default meta;
type Story = StoryObj<typeof DateRangePicker>;

const ControlledPicker = ({ startDate, endDate, disabled }: { startDate?: Date; endDate?: Date; disabled?: boolean }) => {
	const [dates, setDates] = useState<{ startDate?: Date; endDate?: Date }>({ startDate, endDate });
	return (
		<div className='flex flex-col gap-2'>
			<DateRangePicker
				startDate={dates.startDate}
				endDate={dates.endDate}
				onChange={setDates}
				disabled={disabled}
				placeholder='Select date range'
			/>
			{dates.startDate && dates.endDate && (
				<p className='text-xs text-muted-foreground'>
					{dates.startDate.toDateString()} → {dates.endDate.toDateString()}
				</p>
			)}
		</div>
	);
};

export const Default: Story = { render: () => <ControlledPicker /> };

export const WithPresets: Story = {
	render: () => {
		const now = new Date();
		const thirtyDaysAgo = new Date(now);
		thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
		return <ControlledPicker startDate={thirtyDaysAgo} endDate={now} />;
	},
};

export const Disabled: Story = {
	render: () => {
		const now = new Date();
		const weekAgo = new Date(now);
		weekAgo.setDate(weekAgo.getDate() - 7);
		return <ControlledPicker startDate={weekAgo} endDate={now} disabled />;
	},
};
