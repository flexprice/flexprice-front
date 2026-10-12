import { describe, it, expect } from 'vitest';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import DeltaChip from './DeltaChip';

describe('DeltaChip', () => {
	it('renders label', () => {
		render(<DeltaChip display={{ label: '+8.4%', tone: 'success', kind: 'pct' }} />);
		expect(screen.getByText('+8.4%')).toBeInTheDocument();
	});
	it('renders nothing without a comparison', () => {
		const { container } = render(<DeltaChip display={null} />);
		expect(container).toBeEmptyDOMElement();
	});
});
