import type { Meta, StoryObj } from '@storybook/react';
import { userEvent, within, expect } from '@storybook/test';
import { PlusIcon, TrashIcon } from 'lucide-react';
import Button from './Button';

/**
 * Primary action button used across FlexPrice — Create Plan, Save, Export, etc.
 */
const meta: Meta<typeof Button> = {
	title: 'Atoms/Button',
	component: Button,
	tags: ['autodocs'],
	parameters: {
		layout: 'centered',
	},
	argTypes: {
		variant: {
			control: 'select',
			options: ['default', 'black', 'destructive', 'outline', 'secondary', 'ghost', 'link'],
		},
		size: {
			control: 'select',
			options: ['default', 'sm', 'lg', 'icon', 'xs'],
		},
		isLoading: { control: 'boolean' },
		disabled: { control: 'boolean' },
	},
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Default: Story = {
	args: {
		variant: 'default',
		size: 'default',
		children: 'Create Plan',
	},
};

export const AllVariants: Story = {
	render: () => (
		<div className='flex flex-wrap gap-3'>
			<Button variant='default'>Default</Button>
			<Button variant='black'>Black</Button>
			<Button variant='destructive'>Destructive</Button>
			<Button variant='outline'>Outline</Button>
			<Button variant='secondary'>Secondary</Button>
			<Button variant='ghost'>Ghost</Button>
			<Button variant='link'>Link</Button>
		</div>
	),
};

export const AllSizes: Story = {
	render: () => (
		<div className='flex flex-wrap items-center gap-3'>
			<Button size='xs'>Extra Small</Button>
			<Button size='sm'>Small</Button>
			<Button size='default'>Default</Button>
			<Button size='lg'>Large</Button>
			<Button size='icon'>
				<PlusIcon />
			</Button>
		</div>
	),
};

export const Loading: Story = {
	args: {
		variant: 'default',
		isLoading: true,
		children: 'Saving…',
	},
};

export const Disabled: Story = {
	args: {
		variant: 'default',
		disabled: true,
		children: 'Disabled Button',
	},
};

export const WithIcons: Story = {
	render: () => (
		<div className='flex flex-wrap gap-3'>
			<Button prefixIcon={<PlusIcon />}>Add Customer</Button>
			<Button suffixIcon={<TrashIcon />} variant='destructive'>
				Delete Plan
			</Button>
			<Button prefixIcon={<PlusIcon />} suffixIcon={<TrashIcon />} variant='outline'>
				Both Icons
			</Button>
		</div>
	),
};

export const ClickTest: Story = {
	args: {
		variant: 'default',
		children: 'Click me',
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const button = canvas.getByRole('button');
		await userEvent.click(button);
		await expect(button).toBeInTheDocument();
	},
};

export const LoadingDisablesButton: Story = {
	args: {
		variant: 'default',
		isLoading: true,
		children: 'Loading…',
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const button = canvas.getByRole('button');
		await expect(button).toBeDisabled();
	},
};
