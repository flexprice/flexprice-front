import type { Meta, StoryObj } from '@storybook/react';
import Spinner from './Spinner';

const meta: Meta<typeof Spinner> = {
	title: 'Atoms/Spinner',
	component: Spinner,
	parameters: {
		layout: 'centered',
	},
	tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Small: Story = {
	args: {
		size: 16,
		className: 'text-primary',
	},
};

export const Default: Story = {
	args: {
		size: 24,
		className: 'text-primary',
	},
};

export const Large: Story = {
	args: {
		size: 40,
		className: 'text-primary',
	},
};
