import type { Meta, StoryObj } from '@storybook/react';
import Spinner from './Spinner';

/**
 * Animated SVG spinner used to indicate loading state throughout FlexPrice.
 */
const meta: Meta<typeof Spinner> = {
	title: 'Atoms/Spinner',
	component: Spinner,
	tags: ['autodocs'],
	parameters: {
		layout: 'centered',
	},
	argTypes: {
		size: { control: 'number' },
	},
};

export default meta;
type Story = StoryObj<typeof Spinner>;

export const Small: Story = {
	args: { size: 16 },
};

export const Default: Story = {
	args: { size: 24 },
};

export const Large: Story = {
	args: { size: 48 },
};

export const AllSizes: Story = {
	render: () => (
		<div className='flex items-center gap-6'>
			<div className='flex flex-col items-center gap-2'>
				<Spinner size={16} />
				<span className='text-xs text-muted-foreground'>16px</span>
			</div>
			<div className='flex flex-col items-center gap-2'>
				<Spinner size={24} />
				<span className='text-xs text-muted-foreground'>24px</span>
			</div>
			<div className='flex flex-col items-center gap-2'>
				<Spinner size={48} />
				<span className='text-xs text-muted-foreground'>48px</span>
			</div>
		</div>
	),
};
