import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import TableAvatar, { getTableAvatarInitials, getTableAvatarToneIndex } from './TableAvatar';

describe('TableAvatar', () => {
	it('renders two-letter initials from a multi-word name', () => {
		render(<TableAvatar name='Acme Corporation' />);
		expect(screen.getByText('AC')).toBeInTheDocument();
	});

	it('uses the first two letters of a single token', () => {
		expect(getTableAvatarInitials('Globex')).toBe('GL');
	});

	it('uses the avatar token classes so dark-mode overrides can affect the tile', () => {
		const { container } = render(<TableAvatar name='Acme Corporation' />);
		const tile = container.querySelector('span');
		expect(tile?.className).toMatch(/bg-\[rgb\(var\(--fp-avatar-\d\)\)\]/);
	});

	it('uses a slightly larger tile when size is md', () => {
		const { container } = render(<TableAvatar name='Acme Corporation' size='md' />);
		expect(container.querySelector('span')?.className).toContain('size-7');
	});

	it('spreads names across six distinct primaries instead of clustering on purple/pink', () => {
		const names = ['Acme', 'Globex', 'Initech', 'Umbrella', 'Stark', 'Wayne', 'Soylent', 'Hooli'];
		const tones = new Set(names.map((name) => getTableAvatarToneIndex(name)));
		expect(tones.size).toBeGreaterThanOrEqual(4);
		expect(Math.max(...names.map((name) => getTableAvatarToneIndex(name)))).toBeLessThan(6);
	});
});
