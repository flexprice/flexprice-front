import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import Chip from './Chip';

const meta: Meta<typeof Chip> = {
	title: 'Atoms/Chip',
	component: Chip,
	parameters: {
		layout: 'centered',
	},
	tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		label: 'Default',
	},
};

export const Success: Story = {
	args: {
		label: 'Success',
		variant: 'success',
	},
};

export const Warning: Story = {
	args: {
		label: 'Warning',
		variant: 'warning',
	},
};

export const Failed: Story = {
	args: {
		label: 'Failed',
		variant: 'failed',
	},
};

export const Info: Story = {
	args: {
		label: 'Info',
		variant: 'info',
	},
};

export const Clickable: Story = {
	args: {
		label: 'Clickable chip',
		onClick: fn(),
	},
};

export const Disabled: Story = {
	args: {
		label: 'Disabled chip',
		onClick: fn(),
		disabled: true,
	},
};
