import type { Meta, StoryObj } from '@storybook/react';
import { expect, within } from '@storybook/test';
import { SidebarNav, sidebarItems } from './components';

const meta = {
	title: 'FlexPrice/Organisms/SidebarNav',
	component: SidebarNav,
	parameters: { layout: 'fullscreen' },
	tags: ['autodocs'],
	argTypes: {
		activePath: { control: 'select', options: sidebarItems.map((item) => item.path) },
		collapsed: { control: 'boolean' },
	},
	args: {
		activePath: '/invoices',
		collapsed: false,
		items: sidebarItems,
	},
} satisfies Meta<typeof SidebarNav>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await expect(canvas.getByRole('link', { name: /invoices/i })).toHaveAttribute('href', '/invoices');
	},
};

export const Variants: Story = {
	render: () => (
		<div className='flex h-[520px] bg-zinc-50'>
			<SidebarNav items={sidebarItems} activePath='/dashboard' />
			<SidebarNav items={sidebarItems} activePath='/customers' collapsed />
		</div>
	),
};
