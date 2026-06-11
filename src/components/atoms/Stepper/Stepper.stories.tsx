import type { Meta, StoryObj } from '@storybook/react';
import Stepper from './Stepper';

const meta: Meta<typeof Stepper> = {
	title: 'Atoms/Stepper',
	component: Stepper,
	parameters: {
		layout: 'padded',
	},
	tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

const steps = [{ label: 'Plan details' }, { label: 'Pricing' }, { label: 'Review' }, { label: 'Publish' }];

export const FirstStep: Story = {
	args: {
		steps,
		activeStep: 0,
	},
};

export const Midway: Story = {
	args: {
		steps,
		activeStep: 1,
	},
};

export const Completed: Story = {
	args: {
		steps,
		activeStep: 3,
	},
};
