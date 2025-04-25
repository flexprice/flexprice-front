import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import SortDropdown, { SortConfig } from './SortDropdown';

const meta: Meta<typeof SortDropdown> = {
	title: 'Molecules/QueryBuilder/SortDropdown',
	component: SortDropdown,
	parameters: {
		layout: 'centered',
		backgrounds: {
			default: 'light',
		},
	},
};

export default meta;
type Story = StoryObj<typeof SortDropdown>;

const options = [
	{ key: 'name', label: 'Name' },
	{ key: 'created_at', label: 'Created At' },
	{ key: 'updated_at', label: 'Updated At' },
	{ key: 'status', label: 'Status' },
	{ key: 'priority', label: 'Priority' },
	{ key: 'est_hours', label: 'Est. Hours' },
	{ key: 'assigned_to', label: 'Assigned To' },
	{ key: 'due_date', label: 'Due Date' },
];

const DefaultStory = () => {
	const [sorts, setSorts] = useState<SortConfig[]>([]);

	return (
		<div className='p-10'>
			<SortDropdown options={options} value={sorts} onChange={setSorts} />
		</div>
	);
};

const WithInitialSortsStory = () => {
	const [sorts, setSorts] = useState<SortConfig[]>([
		{ field: 'created_at', direction: 'desc' },
		{ field: 'priority', direction: 'asc' },
	]);

	return (
		<div className='p-10'>
			<SortDropdown options={options} value={sorts} onChange={setSorts} />
		</div>
	);
};

export const Default: Story = {
	render: () => <DefaultStory />,
};

export const WithInitialSorts: Story = {
	render: () => <WithInitialSortsStory />,
};
