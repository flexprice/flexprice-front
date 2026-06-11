import type { Meta, StoryObj } from '@storybook/react';
import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router';
import Pagination from './Pagination';

const meta: Meta<typeof Pagination> = {
	title: 'Molecules/Pagination',
	component: Pagination,
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
			<Pagination totalPages={5} />
		</RouterWrapper>
	),
};

export const WithEllipsis: Story = {
	render: () => (
		<RouterWrapper initialEntries={['/?page=8']}>
			<Pagination totalPages={20} maxPagesBeforeTruncate={7} siblingCount={1} />
		</RouterWrapper>
	),
};
