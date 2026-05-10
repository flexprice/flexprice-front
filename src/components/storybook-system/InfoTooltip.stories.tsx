import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, waitFor, within } from '@storybook/test';
import { Info } from 'lucide-react';
import { InfoTooltip } from './components';

const meta = {
	title: 'FlexPrice/Atoms/Tooltip',
	component: InfoTooltip,
	parameters: { layout: 'centered' },
	tags: ['autodocs'],
	argTypes: {
		content: { control: 'text' },
		delayMs: { control: 'number' },
	},
	args: {
		content: 'Monthly recurring revenue includes active subscriptions only.',
		delayMs: 100,
		children: (
			<button type='button' aria-label='Revenue help' className='rounded-[6px] border border-zinc-200 p-2'>
				<Info className='size-4' />
			</button>
		),
	},
} satisfies Meta<typeof InfoTooltip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await userEvent.hover(canvas.getByRole('button', { name: /revenue help/i }));
		await waitFor(() => expect(canvas.getByRole('tooltip')).toBeInTheDocument());
	},
};

export const Variants: Story = {
	render: () => (
		<div className='flex gap-4'>
			<InfoTooltip content='Appears quickly for dense dashboards.' delayMs={50}>
				<button className='rounded-[6px] border px-3 py-2'>Fast</button>
			</InfoTooltip>
			<InfoTooltip content='Appears after a calmer delay.' delayMs={500}>
				<button className='rounded-[6px] border px-3 py-2'>Delayed</button>
			</InfoTooltip>
		</div>
	),
};
