import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import Toggle from './Toggle';

const meta: Meta<typeof Toggle> = {
	title: 'Atoms/Toggle',
	component: Toggle,
	parameters: {
		layout: 'padded',
	},
	tags: ['autodocs'],
	args: {
		onChange: () => {},
	},
};

export default meta;
type Story = StoryObj<typeof meta>;

const ToggleWithState = (args: Story['args']) => {
	const [checked, setChecked] = useState(Boolean(args?.checked));

	return <Toggle {...args} checked={checked} onChange={setChecked} />;
};

export const Off: Story = {
	render: (args) => <ToggleWithState {...args} />,
	args: {
		title: 'Notifications',
		label: 'Enable email notifications',
		description: 'Send billing and usage updates to the team inbox.',
		checked: false,
	},
};

export const On: Story = {
	render: (args) => <ToggleWithState {...args} />,
	args: {
		title: 'Notifications',
		label: 'Enable email notifications',
		description: 'Send billing and usage updates to the team inbox.',
		checked: true,
	},
};

export const Disabled: Story = {
	args: {
		title: 'Notifications',
		label: 'Enable email notifications',
		description: 'Send billing and usage updates to the team inbox.',
		checked: true,
		disabled: true,
	},
};
