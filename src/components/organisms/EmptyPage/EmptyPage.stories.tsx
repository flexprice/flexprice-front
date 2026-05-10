import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { FileTextIcon, UsersIcon, LayersIcon } from 'lucide-react';
import { DocsProvider } from '@/context/DocsContext';
import { MemoryRouter } from 'react-router';
import EmptyPage from './EmptyPage';

/**
 * Full-page empty state displayed when a section has no data yet.
 * Includes an icon, heading, description, and optional CTA button.
 */
const meta: Meta<typeof EmptyPage> = {
	title: 'Organisms/EmptyState',
	component: EmptyPage,
	tags: ['autodocs'],
	parameters: {
		layout: 'fullscreen',
	},
	decorators: [
		(Story) =>
			React.createElement(
				MemoryRouter,
				{ initialEntries: ['/'] },
				React.createElement(DocsProvider, { children: React.createElement(Story) }),
			),
	],
};

export default meta;
type Story = StoryObj<typeof EmptyPage>;

export const NoInvoices: Story = {
	args: {
		heading: 'Invoices',
		addButtonLabel: 'Create Invoice',
		onAddClick: () => alert('Create invoice clicked'),
		emptyStateCard: {
			icon: <FileTextIcon size={40} className='text-gray-300' />,
			heading: 'No invoices yet',
			description: 'Invoices will appear here once your customers have active subscriptions.',
			buttonLabel: 'Create your first invoice',
			buttonAction: () => alert('Create invoice clicked'),
		},
	},
};

export const NoCustomers: Story = {
	args: {
		heading: 'Customers',
		addButtonLabel: 'Add Customer',
		onAddClick: () => alert('Add customer clicked'),
		emptyStateCard: {
			icon: <UsersIcon size={40} className='text-gray-300' />,
			heading: 'No customers yet',
			description: 'Add your first customer to start managing subscriptions and billing.',
			buttonLabel: 'Add your first customer',
			buttonAction: () => alert('Add customer clicked'),
		},
	},
};

export const NoPlans: Story = {
	args: {
		heading: 'Plans',
		addButtonLabel: 'Create Plan',
		onAddClick: () => alert('Create plan clicked'),
		emptyStateCard: {
			icon: <LayersIcon size={40} className='text-gray-300' />,
			heading: 'No plans configured',
			description: 'Create a pricing plan to start billing your customers.',
			buttonLabel: 'Create your first plan',
			buttonAction: () => alert('Create plan clicked'),
		},
	},
};

export const WithoutCTA: Story = {
	args: {
		heading: 'Reports',
		emptyStateCard: {
			icon: <FileTextIcon size={40} className='text-gray-300' />,
			heading: 'No reports available',
			description: 'Reports will be generated automatically once billing data is available.',
		},
	},
};
