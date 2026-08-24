import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom';
import { Button } from '@/components/atoms';
import DropdownMenu from './DropdownMenu';

describe('DropdownMenu', () => {
	it('does not nest a button inside the trigger when a Button is passed as trigger', () => {
		render(
			<DropdownMenu
				options={[{ label: 'Edit', onSelect: vi.fn() }]}
				trigger={
					<Button variant='outline' size='icon' aria-label='More actions'>
						Menu
					</Button>
				}
			/>,
		);

		const trigger = screen.getByRole('button', { name: 'More actions' });
		expect(trigger.closest('button')?.parentElement?.closest('button')).toBeNull();
		expect(document.querySelectorAll('button button')).toHaveLength(0);
	});

	it('still renders a single button when using the default icon trigger', () => {
		render(<DropdownMenu options={[{ label: 'Edit', onSelect: vi.fn() }]} />);
		expect(screen.getAllByRole('button')).toHaveLength(1);
		expect(document.querySelectorAll('button button')).toHaveLength(0);
	});
});
