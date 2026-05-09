import type { Meta, StoryObj } from '@storybook/react';
import { expect, fn, userEvent, waitFor, within } from '@storybook/test';
import { SearchBar } from './components';

const meta = {
	title: 'FlexPrice/Molecules/SearchBar',
	component: SearchBar,
	parameters: { layout: 'centered' },
	tags: ['autodocs'],
	argTypes: {
		placeholder: { control: 'text' },
		debounceMs: { control: 'number' },
	},
	args: {
		placeholder: 'Search invoices...',
		debounceMs: 50,
		onSearch: fn(),
	},
} satisfies Meta<typeof SearchBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	play: async ({ args, canvasElement }) => {
		const canvas = within(canvasElement);
		await userEvent.type(canvas.getByPlaceholderText(/search invoices/i), 'acme');
		await waitFor(() => expect(args.onSearch).toHaveBeenCalledWith('acme'));
		await userEvent.click(canvas.getByRole('button', { name: /clear search/i }));
		await waitFor(() => expect(args.onSearch).toHaveBeenCalledWith(''));
	},
};

export const Variants: Story = {
	render: () => (
		<div className='grid gap-4'>
			<SearchBar placeholder='Search customers...' />
			<SearchBar placeholder='Search invoices...' debounceMs={800} />
		</div>
	),
};
