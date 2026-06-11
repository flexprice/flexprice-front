/* eslint-disable i18next/no-literal-string */
import type { Meta, StoryObj } from '@storybook/react';
import CustomTabs from './CustomTabs';

const meta: Meta<typeof CustomTabs> = {
	title: 'Molecules/Tabs/CustomTabs',
	component: CustomTabs,
	parameters: {
		layout: 'padded',
	},
	tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

const tabs = [
	{ value: 'overview', label: 'Overview', content: <div className='rounded-md border p-4 text-sm'>Overview content</div> },
	{ value: 'usage', label: 'Usage', content: <div className='rounded-md border p-4 text-sm'>Usage content</div> },
	{ value: 'billing', label: 'Billing', content: <div className='rounded-md border p-4 text-sm'>Billing content</div> },
];

export const Default: Story = {
	args: {
		tabs,
		defaultValue: 'overview',
	},
};

export const BillingActive: Story = {
	args: {
		tabs,
		defaultValue: 'billing',
	},
};
