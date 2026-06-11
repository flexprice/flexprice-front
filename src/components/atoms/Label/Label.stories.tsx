import type { Meta, StoryObj } from '@storybook/react';
import Label from './Label';

const meta: Meta<typeof Label> = {
	title: 'Atoms/Label',
	component: Label,
	parameters: {
		layout: 'centered',
	},
	tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		label: 'Email address',
		htmlFor: 'email',
	},
};

export const Disabled: Story = {
	args: {
		label: 'Plan name',
		htmlFor: 'plan-name',
		disabled: true,
	},
};
