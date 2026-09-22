import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import SegmentedControl from './SegmentedControl';

const options = [
	{ label: 'Absolute', value: 'absolute' as const },
	{ label: 'Percentage', value: 'percentage' as const },
];

describe('SegmentedControl', () => {
	it('renders every option as a button with its label', () => {
		render(<SegmentedControl options={options} value='absolute' onChange={vi.fn()} />);
		expect(screen.getByRole('button', { name: 'Absolute' })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Percentage' })).toBeInTheDocument();
	});

	it('marks the active option pressed and the other one not', () => {
		render(<SegmentedControl options={options} value='percentage' onChange={vi.fn()} />);
		expect(screen.getByRole('button', { name: 'Absolute' })).toHaveAttribute('aria-pressed', 'false');
		expect(screen.getByRole('button', { name: 'Percentage' })).toHaveAttribute('aria-pressed', 'true');
	});

	it('calls onChange with the clicked option value', () => {
		const onChange = vi.fn();
		render(<SegmentedControl options={options} value='absolute' onChange={onChange} />);
		fireEvent.click(screen.getByRole('button', { name: 'Percentage' }));
		expect(onChange).toHaveBeenCalledWith('percentage');
	});

	it('does not call onChange when clicking the already-active option', () => {
		const onChange = vi.fn();
		render(<SegmentedControl options={options} value='absolute' onChange={onChange} />);
		fireEvent.click(screen.getByRole('button', { name: 'Absolute' }));
		expect(onChange).not.toHaveBeenCalled();
	});

	it('disables every option and stops onChange from firing when disabled', () => {
		const onChange = vi.fn();
		render(<SegmentedControl options={options} value='absolute' onChange={onChange} disabled />);
		const percentageButton = screen.getByRole('button', { name: 'Percentage' });
		expect(percentageButton).toBeDisabled();
		fireEvent.click(percentageButton);
		expect(onChange).not.toHaveBeenCalled();
	});
});
