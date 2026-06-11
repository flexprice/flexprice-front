/* eslint-disable i18next/no-literal-string */
import type { Meta, StoryObj } from '@storybook/react';
import NoDataCard from './NoDataCard';

const meta: Meta<typeof NoDataCard> = {
	title: 'Atoms/NoDataCard',
	component: NoDataCard,
	parameters: {
		layout: 'centered',
	},
	tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		title: 'No plans yet',
		subtitle: 'Create your first plan to start selling usage-based pricing.',
		cta: <button className='rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground'>Create plan</button>,
	},
};
