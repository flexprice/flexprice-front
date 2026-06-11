import type { Meta, StoryObj } from '@storybook/react';
import { CopyIdButton } from './CopyIdButton';

const meta: Meta<typeof CopyIdButton> = {
	title: 'Atoms/CopyIdButton',
	component: CopyIdButton,
	parameters: {
		layout: 'centered',
	},
	tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		id: 'plan_01HZY4B1N7P4Z7Q7M2H4X0Y3AB',
		entityType: 'Plan',
	},
};

export const CustomToast: Story = {
	args: {
		id: 'customer_01HZY4B1N7P4Z7Q7M2H4X0Y3AB',
		entityType: 'Customer',
		toastMessage: 'Customer ID copied to clipboard',
	},
};
