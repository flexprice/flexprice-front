import type { Meta, StoryObj } from '@storybook/react';
import { expect, fn, userEvent, within } from '@storybook/test';
import { FilePlus2 } from 'lucide-react';
import { EmptyState } from './components';

const meta = {
	title: 'FlexPrice/Organisms/EmptyState',
	component: EmptyState,
	parameters: { layout: 'padded' },
	tags: ['autodocs'],
	argTypes: {
		headline: { control: 'text' },
		subtext: { control: 'text' },
		ctaLabel: { control: 'text' },
	},
	args: {
		headline: 'No pricing plans yet',
		subtext: 'Create a plan with recurring, usage, or credit-based charges to start billing customers.',
		ctaLabel: 'Create plan',
		onCtaClick: fn(),
	},
} satisfies Meta<typeof EmptyState>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	play: async ({ args, canvasElement }) => {
		const canvas = within(canvasElement);
		await userEvent.click(canvas.getByRole('button', { name: /create plan/i }));
		await expect(args.onCtaClick).toHaveBeenCalled();
	},
};

export const Variants: Story = {
	render: () => (
		<div className='grid gap-6'>
			<EmptyState headline='No customers yet' subtext='Add your first customer before creating a subscription.' ctaLabel='Add customer' icon={<FilePlus2 className='size-9' />} />
			<EmptyState headline='No invoices match this filter' subtext='Try clearing the status or date range filters.' ctaLabel='Reset filters' />
		</div>
	),
};
