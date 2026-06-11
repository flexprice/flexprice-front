import type { Meta, StoryObj } from '@storybook/react';
import Loader, { PageLoader } from './Loader';

const meta: Meta<typeof Loader> = {
	title: 'Atoms/Loader',
	component: Loader,
	parameters: {
		layout: 'fullscreen',
	},
	tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Inline: Story = {
	render: () => (
		<div className='h-[360px] w-full rounded-md border overflow-hidden'>
			<Loader />
		</div>
	),
};

export const Page: Story = {
	render: () => <PageLoader />,
};
