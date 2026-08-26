import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import TableAvatar, { getTableAvatarInitials } from './TableAvatar';

describe('TableAvatar', () => {
	it('renders two-letter initials from a multi-word name', () => {
		render(<TableAvatar name='Acme Corporation' />);
		expect(screen.getByText('AC')).toBeInTheDocument();
	});

	it('uses the first two letters of a single token', () => {
		expect(getTableAvatarInitials('Globex')).toBe('GL');
	});

	it('is a full circle with a hairline border', () => {
		const { container } = render(<TableAvatar name='Acme Corporation' />);
		const tile = container.querySelector('span');
		expect(tile?.className).toContain('rounded-full');
		expect(tile?.className).toContain('border-line-zinc');
	});

	it('carries no fill, so the disc reads as chrome rather than a colour signal', () => {
		const { container } = render(<TableAvatar name='Acme Corporation' />);
		const tile = container.querySelector('span');
		expect(tile?.className).not.toMatch(/\bbg-/);
	});

	it('uses a slightly larger tile when size is md', () => {
		const { container } = render(<TableAvatar name='Acme Corporation' size='md' />);
		expect(container.querySelector('span')?.className).toContain('size-8');
	});
});
