import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import Checkbox from './Checkbox';

const meta: Meta<typeof Checkbox> = {
	title: 'Atoms/Checkbox',
	component: Checkbox,
	parameters: {
		layout: 'centered',
	},
	tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

const CheckboxWithState = (args: Story['args']) => {
	const [checked, setChecked] = useState(Boolean(args?.checked));

	return <Checkbox {...args} checked={checked} onCheckedChange={setChecked} />;
};

export const Unchecked: Story = {
	render: (args) => <CheckboxWithState {...args} />,
	args: {
		id: 'checkbox-unchecked',
		label: 'Enable notifications',
		description: 'Receive updates about billing and usage.',
	},
};

export const Checked: Story = {
	render: (args) => <CheckboxWithState {...args} />,
	args: {
		id: 'checkbox-checked',
		label: 'Enable notifications',
		description: 'Receive updates about billing and usage.',
		checked: true,
	},
};

export const Disabled: Story = {
	args: {
		id: 'checkbox-disabled',
		label: 'Disabled option',
		description: 'This option is unavailable.',
		checked: true,
	},
};
