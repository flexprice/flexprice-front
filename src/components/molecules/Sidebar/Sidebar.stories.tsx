import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { MemoryRouter } from 'react-router';
import { SidebarProvider } from '@/components/ui/sidebar';
import AppSidebar from './Sidebar';

/**
 * Main application navigation sidebar with collapsible sections and route-based active state.
 */
const meta: Meta<typeof AppSidebar> = {
	title: 'Organisms/SidebarNav',
	component: AppSidebar,
	tags: ['autodocs'],
	parameters: {
		layout: 'fullscreen',
	},
};

export default meta;
type Story = StoryObj<typeof AppSidebar>;

const withSidebarLayout = (initialRoute: string) => (Story: React.ComponentType) =>
	React.createElement(
		MemoryRouter,
		{ initialEntries: [initialRoute] },
		React.createElement(SidebarProvider, {}, React.createElement('div', { className: 'flex h-screen' }, React.createElement(Story))),
	);

export const Default: Story = {
	decorators: [withSidebarLayout('/home')],
};

export const WithActivePath: Story = {
	decorators: [withSidebarLayout('/billing/invoices')],
};
