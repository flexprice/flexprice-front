import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Search01Icon } from '@hugeicons/core-free-icons';
import HugeIcon from './HugeIcon';

describe('HugeIcon', () => {
	it('renders a static svg for a core-free icon', () => {
		const { container } = render(<HugeIcon icon={Search01Icon} data-testid='huge-icon' />);
		const svg = container.querySelector('svg');
		expect(svg).toBeInTheDocument();
		expect(svg).toHaveAttribute('width', '20');
		expect(svg).toHaveAttribute('height', '20');
	});
});
