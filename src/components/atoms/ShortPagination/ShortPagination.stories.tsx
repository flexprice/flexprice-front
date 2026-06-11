import type { Meta, StoryObj } from '@storybook/react';
import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router';
import ShortPagination from './ShortPagination';

const meta: Meta<typeof ShortPagination> = {
	title: 'Atoms/ShortPagination',
	component: ShortPagination,
	parameters: {
		layout: 'padded',
	},
	tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

const RouterWrapper = ({ children, initialEntries = ['/?page=1'] }: { children: ReactNode; initialEntries?: string[] }) => (
	<MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>
);

export const Default: Story = {
	render: () => (
		<RouterWrapper>
			<ShortPagination totalItems={120} pageSize={10} />
		</RouterWrapper>
	),
};

export const WithPageNumbers: Story = {
	render: () => (
		<RouterWrapper initialEntries={['/?page=4']}>
			<ShortPagination totalItems={120} pageSize={10} showPages />
		</RouterWrapper>
	),
};

export const PrefixedPagination: Story = {
	render: () => (
		<RouterWrapper initialEntries={['/?wallet_transactions_page=2']}>
			<ShortPagination totalItems={25} pageSize={5} showPages prefix='wallet_transactions' unit='records' />
		</RouterWrapper>
	),
};
