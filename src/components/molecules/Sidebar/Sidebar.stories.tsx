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
	decorators: [
		(Story) =>
			React.createElement(
				MemoryRouter,
				{ initialEntries: ['/home'] },
				React.createElement(SidebarProvider, {}, React.createElement('div', { className: 'flex h-screen' }, React.createElement(Story))),
			),
	],
};

export default meta;
type Story = StoryObj<typeof AppSidebar>;

export const Default: Story = {};

export const WithActivePath: Story = {
	decorators: [
		(Story) =>
			React.createElement(
				MemoryRouter,
				{ initialEntries: ['/billing/invoices'] },
				React.createElement(SidebarProvider, {}, React.createElement('div', { className: 'flex h-screen' }, React.createElement(Story))),
			),
	],
};
