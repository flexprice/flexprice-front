import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import MonthRangePicker, { MonthYear } from './MonthRangePicker';

/**
 * Month-range picker with a scrollable year list and a 3×4 month grid.
 * Designed for selecting ranges like "March last year → January this year"
 * without clicking through individual months.
 *
 * Interaction: click Start → pick year from list → pick month from grid →
 * automatically moves to End → pick year → pick month → done.
 */
const meta: Meta<typeof MonthRangePicker> = {
	title: 'Molecules/MonthRangePicker',
	component: MonthRangePicker,
	tags: ['autodocs'],
	parameters: {
		layout: 'centered',
		docs: { story: { height: '380px' } },
	},
	decorators: [
		(Story) => (
			<div className='bg-white p-8 rounded-lg min-h-[340px] flex flex-col gap-4'>
				<Story />
			</div>
		),
	],
	argTypes: { disabled: { control: 'boolean' } },
};

export default meta;
type Story = StoryObj<typeof MonthRangePicker>;

const Controlled = ({ from, to }: { from?: MonthYear; to?: MonthYear }) => {
	const [range, setRange] = useState<{ from?: MonthYear; to?: MonthYear }>({ from, to });
	const fmt = (my?: MonthYear) =>
		my ? `${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][my.month]} ${my.year}` : '—';
	return (
		<div className='space-y-3'>
			<MonthRangePicker from={range.from} to={range.to} onChange={setRange} />
			<p className='text-xs text-muted-foreground'>
				{fmt(range.from)} → {fmt(range.to)}
			</p>
		</div>
	);
};

export const Default: Story = { render: () => <Controlled /> };

export const PreSelected: Story = {
	render: () => <Controlled from={{ year: 2025, month: 2 }} to={{ year: 2026, month: 0 }} />,
};

export const Disabled: Story = {
	args: { disabled: true, from: { year: 2026, month: 4 }, to: { year: 2026, month: 9 } },
};
