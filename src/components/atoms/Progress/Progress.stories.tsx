import type { Meta, StoryObj } from '@storybook/react';
import Progress from './Progress';

const meta: Meta<typeof Progress> = {
	title: 'Atoms/Progress',
	component: Progress,
	parameters: {
		layout: 'padded',
	},
	tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Low: Story = {
	args: {
		value: 20,
		label: 'Usage at 20%',
	},
};

export const Half: Story = {
	args: {
		value: 50,
		label: 'Usage at 50%',
	},
};

export const Complete: Story = {
	args: {
		value: 100,
		label: 'Usage complete',
	},
};
