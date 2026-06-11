import type { Meta, StoryObj } from '@storybook/react';
import ComingSoonTag from './ComingSoon';

const meta: Meta<typeof ComingSoonTag> = {
	title: 'Atoms/ComingSoon',
	component: ComingSoonTag,
	parameters: {
		layout: 'centered',
	},
	tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
