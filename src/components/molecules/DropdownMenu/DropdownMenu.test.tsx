import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

	it('exposes a focusable nested submenu trigger that opens from pointer and keyboard', async () => {
		const user = userEvent.setup();
		const onSelect = vi.fn();
		render(
			<DropdownMenu
				trigger={<Button>Open</Button>}
				options={[{ label: 'More', children: [{ label: 'Nested', onSelect }] }]}
			/>,
		);

		await user.click(screen.getByRole('button', { name: 'Open' }));
		const submenuTrigger = await screen.findByRole('button', { name: /More/ });
		expect(submenuTrigger.tagName).toBe('BUTTON');

		submenuTrigger.focus();
		expect(submenuTrigger).toHaveFocus();
		await user.keyboard('{Enter}');
		expect(await screen.findByText('Nested')).toBeInTheDocument();

		await user.click(screen.getByText('Nested'));
		expect(onSelect).toHaveBeenCalled();
	});
});
