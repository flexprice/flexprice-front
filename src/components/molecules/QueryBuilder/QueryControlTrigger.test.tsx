import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { FilterIcon } from '@hugeicons/core-free-icons';
import QueryControlTrigger from './QueryControlTrigger';

describe('QueryControlTrigger', () => {
	it('hides the count badge when nothing is active', () => {
		render(<QueryControlTrigger icon={FilterIcon} label='Filter' count={0} />);
		expect(screen.queryByText('0')).not.toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Filter' })).toBeInTheDocument();
	});

	it('shows the blue count badge when filters are active', () => {
		render(<QueryControlTrigger icon={FilterIcon} label='Filter' count={2} />);
		expect(screen.getByText('2')).toBeInTheDocument();
	});

	it('forwards click handlers so a popover trigger can open', async () => {
		const onClick = vi.fn();
		render(<QueryControlTrigger icon={FilterIcon} label='Filter' count={0} onClick={onClick} />);
		await userEvent.click(screen.getByRole('button', { name: 'Filter' }));
		expect(onClick).toHaveBeenCalled();
	});
});
