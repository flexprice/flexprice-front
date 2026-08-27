import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import '@testing-library/jest-dom';
import Select from './Select';

/**
 * The atom's contract with assistive tech and with the E2E suite: the visible label is the
 * combobox's accessible name, so `getByLabelText` / `getByRole('combobox', { name })` reach
 * the control without walking the DOM.
 */

const options = [
	{ value: 'metered', label: 'Metered' },
	{ value: 'boolean', label: 'Boolean' },
];

describe('Select', () => {
	it('associates the visible label with the trigger', () => {
		render(<Select options={options} label='Feature type' />);

		expect(screen.getByLabelText('Feature type')).toBe(screen.getByRole('combobox'));
	});

	it('includes the required marker in the accessible name', () => {
		render(<Select options={options} label='Feature type' required />);

		expect(screen.getByRole('combobox', { name: 'Feature type *' })).toBeInTheDocument();
	});

	it('points the label at a caller-supplied id', () => {
		render(<Select options={options} label='Feature type' id='feature-type' />);

		const trigger = screen.getByRole('combobox');
		expect(trigger).toHaveAttribute('id', 'feature-type');
		expect(screen.getByText('Feature type')).toHaveAttribute('for', 'feature-type');
	});

	it('gives each instance its own generated id', () => {
		render(
			<>
				<Select options={options} label='First' />
				<Select options={options} label='Second' />
			</>,
		);

		const [first, second] = screen.getAllByRole('combobox');
		expect(first.id).toBeTruthy();
		expect(first.id).not.toBe(second.id);
		expect(screen.getByLabelText('First')).toBe(first);
		expect(screen.getByLabelText('Second')).toBe(second);
	});

	it('names the trigger with ariaLabel when there is no visible label', () => {
		render(<Select options={options} ariaLabel='Feature type' />);

		expect(screen.getByRole('combobox', { name: 'Feature type' })).toBeInTheDocument();
	});

	it('keeps the visible label as the accessible name when both are given', () => {
		render(<Select options={options} label='Feature type' ariaLabel='Something else' />);

		expect(screen.getByRole('combobox', { name: 'Feature type' })).toBeInTheDocument();
	});
});
