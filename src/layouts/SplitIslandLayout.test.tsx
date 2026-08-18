import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import SplitIslandLayout from './SplitIslandLayout';

describe('SplitIslandLayout', () => {
	it('puts the photo inside a padded, clipped island — the same shell as MainLayout', () => {
		render(<SplitIslandLayout left={<div>form</div>} right={<div>photo</div>} />);

		const photo = screen.getByTestId('split-island-photo');
		expect(photo).toHaveTextContent('photo');
		expect(photo).toHaveClass('overflow-hidden');
		expect(photo).toHaveClass('rounded-[var(--fp-radius-shell)]');
		expect(photo.parentElement).toHaveClass('p-[var(--fp-shell-inset)]');
		expect(screen.getByText('form').parentElement).not.toContainElement(photo);
	});

	it('squares the photo start edge so it can meet the form as a straight line', () => {
		render(<SplitIslandLayout flushStart left={<div>form</div>} right={<div>photo</div>} />);

		const photo = screen.getByTestId('split-island-photo');
		expect(photo).toHaveClass('rounded-s-none');
		expect(photo).toHaveClass('rounded-e-[var(--fp-radius-shell)]');
		expect(photo.parentElement).toHaveClass('ps-0');
		expect(photo.parentElement).not.toHaveClass('p-[var(--fp-shell-inset)]');
	});
});
