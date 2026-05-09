import type { Meta, StoryObj } from '@storybook/react';
import { MeterProgress } from './components';

const meta = {
	title: 'FlexPrice/Molecules/MeterProgress',
	component: MeterProgress,
	parameters: { layout: 'centered' },
	tags: ['autodocs'],
	argTypes: {
		label: { control: 'text' },
		used: { control: 'number' },
		entitled: { control: 'number' },
		unit: { control: 'text' },
	},
	args: {
		label: 'API events',
		used: 7400,
		entitled: 10000,
		unit: 'events',
	},
} satisfies Meta<typeof MeterProgress>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Variants: Story = {
	render: () => (
		<div className='grid w-[520px] gap-5'>
			<MeterProgress label='Credits' used={3200} entitled={10000} unit='credits' />
			<MeterProgress label='Metered events' used={7800} entitled={10000} unit='events' />
			<MeterProgress label='Included seats' used={96} entitled={100} unit='seats' />
		</div>
	),
};
