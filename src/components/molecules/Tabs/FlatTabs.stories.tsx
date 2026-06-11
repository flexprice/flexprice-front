/* eslint-disable i18next/no-literal-string */
import type { Meta, StoryObj } from '@storybook/react';
import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router';
import FlatTabs from './FlatTabs';

const meta: Meta<typeof FlatTabs> = {
	title: 'Molecules/Tabs/FlatTabs',
	component: FlatTabs,
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

const RouterWrapper = ({ children, initialEntries = ['/?tab=overview'] }: { children: ReactNode; initialEntries?: string[] }) => (
	<MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>
);

export const Default: Story = {
	render: () => (
		<RouterWrapper>
			<FlatTabs tabs={tabs} defaultValue='overview' />
		</RouterWrapper>
	),
};

export const UsageActive: Story = {
	render: () => (
		<RouterWrapper initialEntries={['/?tab=usage']}>
			<FlatTabs tabs={tabs} defaultValue='overview' />
		</RouterWrapper>
	),
};
