/* eslint-disable i18next/no-literal-string */
import type { Meta, StoryObj } from '@storybook/react';
import { Plus } from 'lucide-react';
import { fn } from '@storybook/test';
import Button from './Button';
import { AddButton } from '.';

const meta: Meta<typeof Button> = {
	title: 'Atoms/Button',
	component: Button,
	parameters: {
		layout: 'centered',
	},
	tags: ['autodocs'],
	args: {
		onClick: fn(),
		children: 'Button',
	},
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
	args: {
		variant: 'default',
		children: 'Primary',
	},
};

export const Secondary: Story = {
	args: {
		variant: 'secondary',
		children: 'Secondary',
	},
};

export const Disabled: Story = {
	args: {
		variant: 'outline',
		children: 'Disabled',
		disabled: true,
	},
};

export const Loading: Story = {
	args: {
		variant: 'default',
		children: 'Loading',
		isLoading: true,
	},
};

export const WithIcons: Story = {
	args: {
		variant: 'outline',
		children: 'Add item',
		prefixIcon: <Plus />,
		suffixIcon: <Plus className='rotate-45' />,
	},
};

export const AddAction: Story = {
	render: () => <AddButton label='Add plan' onClick={fn()} />,
};
