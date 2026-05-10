import type { Meta, StoryObj } from '@storybook/react';
import { userEvent, within, expect, waitFor } from '@storybook/test';
import { useState } from 'react';
import SearchBar from './SearchBar';

/**
 * Debounced search input composed from Input + Spinner + clear button.
 */
const meta: Meta<typeof SearchBar> = {
	title: 'Molecules/SearchBar',
	component: SearchBar,
	tags: ['autodocs'],
	parameters: {
		layout: 'centered',
	},
	argTypes: {
		isLoading: { control: 'boolean' },
		debounceMs: { control: 'number' },
	},
};

export default meta;
type Story = StoryObj<typeof SearchBar>;

export const Default: Story = {
	args: {
		placeholder: 'Search customers…',
		debounceMs: 300,
	},
};

export const Loading: Story = {
	args: {
		placeholder: 'Searching…',
		isLoading: true,
		value: 'growth plan',
	},
};

const ControlledSearchBar = () => {
	const [query, setQuery] = useState('FlexPrice');
	return (
		<div className='w-72 space-y-2'>
			<SearchBar value={query} onChange={setQuery} placeholder='Search…' debounceMs={300} />
			<p className='text-xs text-muted-foreground'>Query: {query || '(empty)'}</p>
		</div>
	);
};

export const WithValue: Story = {
	render: () => <ControlledSearchBar />,
};

const DebounceDemo = () => {
	const [fired, setFired] = useState<string[]>([]);
	return (
		<div className='w-72 space-y-2'>
			<SearchBar placeholder='Type something…' onChange={(v) => setFired((prev) => [...prev, v])} debounceMs={300} />
			<p className='text-xs text-muted-foreground'>onChange fired: {fired.length} time(s)</p>
			<p className='text-xs text-muted-foreground'>Last value: {fired.at(-1) ?? '—'}</p>
		</div>
	);
};

export const DebounceInteraction: Story = {
	render: () => <DebounceDemo />,
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const input = canvas.getByRole('textbox');
		await userEvent.type(input, 'hello');
		await waitFor(() => expect(input).toHaveValue('hello'), { timeout: 2000 });
	},
};
