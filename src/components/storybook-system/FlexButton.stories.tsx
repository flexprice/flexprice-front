import type { Meta, StoryObj } from '@storybook/react';
import { expect, fn, userEvent, within } from '@storybook/test';
import { Plus } from 'lucide-react';
import { FlexButton } from './components';

const meta = {
	title: 'FlexPrice/Atoms/Button',
	component: FlexButton,
	parameters: { layout: 'centered' },
	tags: ['autodocs'],
	argTypes: {
		variant: { control: 'select', options: ['primary', 'secondary', 'ghost', 'danger'] },
		size: { control: 'select', options: ['sm', 'md', 'lg'] },
		loading: { control: 'boolean' },
		disabled: { control: 'boolean' },
	},
	args: {
		children: 'Create plan',
		onClick: fn(),
	},
} satisfies Meta<typeof FlexButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		variant: 'primary',
		size: 'md',
	},
	play: async ({ args, canvasElement }) => {
		const canvas = within(canvasElement);
		await userEvent.click(canvas.getByRole('button', { name: /create plan/i }));
		await expect(args.onClick).toHaveBeenCalled();
	},
};

export const Variants: Story = {
	render: () => (
		<div className='flex flex-wrap items-center gap-3'>
			<FlexButton variant='primary'>Primary</FlexButton>
			<FlexButton variant='secondary'>Secondary</FlexButton>
			<FlexButton variant='ghost'>Ghost</FlexButton>
			<FlexButton variant='danger'>Danger</FlexButton>
			<FlexButton loading>Saving</FlexButton>
			<FlexButton disabled>Disabled</FlexButton>
		</div>
	),
};

export const Sizes: Story = {
	render: () => (
		<div className='flex items-center gap-3'>
			<FlexButton size='sm' icon={<Plus />}>
				Small
			</FlexButton>
			<FlexButton size='md' icon={<Plus />}>
				Medium
			</FlexButton>
			<FlexButton size='lg' icon={<Plus />}>
				Large
			</FlexButton>
		</div>
	),
};
