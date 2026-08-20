import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import StatusChip, { getFeatureTypeTone } from './StatusChip';

describe('StatusChip', () => {
	it('renders the label with a status dot', () => {
		render(<StatusChip status='Active' label='Active' />);
		expect(screen.getByText('Active')).toBeInTheDocument();
	});

	it('falls back to the status name when no label is provided', () => {
		render(<StatusChip status='Draft' />);
		expect(screen.getByText('Draft')).toBeInTheDocument();
	});

	it('maps Paid onto the success tone', () => {
		const { container } = render(<StatusChip status='Paid' />);
		expect(screen.getByText('Paid')).toBeInTheDocument();
		expect(container.querySelector('[aria-hidden]')).toHaveClass('bg-success-bright');
	});

	it('accepts an explicit tone and label', () => {
		render(<StatusChip tone='warning' label='Metered' />);
		expect(screen.getByText('Metered')).toBeInTheDocument();
	});

	it('maps Failed onto the danger tone', () => {
		const { container } = render(<StatusChip status='Failed' label='Failed' />);
		expect(screen.getByText('Failed')).toBeInTheDocument();
		expect(container.querySelector('[aria-hidden]')).toHaveClass('bg-danger-bright');
	});

	it('sizes the status dot from the chip token', () => {
		const { container } = render(<StatusChip status='Active' />);
		const dot = container.querySelector('[aria-hidden]');
		expect(dot).toHaveClass('size-[var(--fp-chip-dot)]');
	});
});

describe('getFeatureTypeTone', () => {
	it('maps boolean, metered, and config onto distinct tones', () => {
		expect(getFeatureTypeTone('boolean')).toBe('success');
		expect(getFeatureTypeTone('metered')).toBe('warning');
		expect(getFeatureTypeTone('config')).toBe('info');
		expect(getFeatureTypeTone('static')).toBe('neutral');
	});
});
