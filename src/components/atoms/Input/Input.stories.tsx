import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import Input from './Input';

const meta: Meta<typeof Input> = {
	title: 'Atoms/Input',
	component: Input,
	parameters: {
		layout: 'centered',
	},
	tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

const ControlledInput = (args: Story['args']) => {
	const [value, setValue] = useState(String(args?.value ?? ''));

	return <Input {...args} value={value} onChange={setValue} />;
};

export const Default: Story = {
	render: (args) => <ControlledInput {...args} />,
	args: {
		placeholder: 'Enter text here',
	},
};

export const WithLabel: Story = {
	render: (args) => <ControlledInput {...args} />,
	args: {
		label: 'Email',
		placeholder: 'Enter your email',
		type: 'email',
	},
};

export const WithError: Story = {
	render: (args) => <ControlledInput {...args} />,
	args: {
		label: 'Password',
		type: 'password',
		error: 'Password must be at least 8 characters',
		placeholder: 'Enter your password',
	},
};

export const Disabled: Story = {
	render: (args) => <ControlledInput {...args} />,
	args: {
		label: 'Username',
		placeholder: 'Enter your username',
		disabled: true,
	},
};

export const FormattedNumber: Story = {
	render: (args) => <ControlledInput {...args} />,
	args: {
		label: 'Amount',
		placeholder: 'Enter amount',
		variant: 'formatted-number',
		value: '1234567.89',
	},
};
