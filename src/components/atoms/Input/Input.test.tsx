import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom';
import Input from './Input';

describe('Input Component', () => {
	// Basic Rendering Tests
	describe('Basic Rendering', () => {
		it('should render a basic input', () => {
			render(<Input />);
			const inputElement = screen.getByRole('textbox');
			expect(inputElement).toBeInTheDocument();
		});

		it('should render input with label', () => {
			render(<Input label='Test Label' />);
			const labelElement = screen.getByText('Test Label');
			expect(labelElement).toBeInTheDocument();
		});

		it('should render input with description', () => {
			render(<Input description='Test Description' />);
			const descriptionElement = screen.getByText('Test Description');
			expect(descriptionElement).toBeInTheDocument();
		});

		it('should render input with error', () => {
			render(<Input error='Test Error' />);
			const errorElement = screen.getByText('Test Error');
			expect(errorElement).toBeInTheDocument();
		});
	});

	// Prop Handling Tests
	describe('Prop Handling', () => {
		it('should apply custom className', () => {
			render(<Input className='custom-class' />);
			const inputWrapper = screen.getByRole('textbox').closest('div');
			expect(inputWrapper).toHaveClass('custom-class');
		});

		it('should apply disabled state', () => {
			render(<Input disabled />);
			const inputElement = screen.getByRole('textbox');
			expect(inputElement).toBeDisabled();
		});

		it('should render input with placeholder', () => {
			render(<Input placeholder='Enter text' />);
			const inputElement = screen.getByPlaceholderText('Enter text');
			expect(inputElement).toBeInTheDocument();
		});

		it('should render input with prefix', () => {
			render(<Input inputPrefix={<span>$</span>} />);
			const prefixElement = screen.getByText('$');
			expect(prefixElement).toBeInTheDocument();
		});

		it('should render input with suffix', () => {
			render(<Input suffix={<span>USD</span>} />);
			const suffixElement = screen.getByText('USD');
			expect(suffixElement).toBeInTheDocument();
		});
	});

	// Number Input Variants Tests
	describe('Number Input Variants', () => {
		it('should format integer input correctly', () => {
			const onChangeMock = vi.fn();
			render(<Input variant='integer' onChange={onChangeMock} />);
			const inputElement = screen.getByRole('textbox');

			fireEvent.change(inputElement, { target: { value: '1234' } });
			expect(onChangeMock).toHaveBeenCalledWith('1234');

			fireEvent.change(inputElement, { target: { value: '12.34' } });
			expect(onChangeMock).not.toHaveBeenCalledWith('12.34');
		});

		it('should format number input with thousand separators', () => {
			const onChangeMock = vi.fn();
			render(<Input variant='formatted-number' onChange={onChangeMock} value='1234567' />);
			const inputElement = screen.getByRole('textbox');

			expect(inputElement).toHaveValue('1,234,567');
		});

		it('should handle negative number input', () => {
			const onChangeMock = vi.fn();
			render(
				<Input
					variant='number'
					onChange={onChangeMock}
					formatOptions={{
						allowNegative: true,
						thousandSeparator: ',',
						decimalSeparator: '.',
					}}
				/>,
			);
			const inputElement = screen.getByRole('textbox');

			fireEvent.change(inputElement, { target: { value: '-1234' } });
			expect(onChangeMock).toHaveBeenCalledWith('-1234');
		});
	});

	// Interaction Tests
	describe('Interaction', () => {
		it('should call onChange when input value changes', () => {
			const onChangeMock = vi.fn();
			render(<Input onChange={onChangeMock} />);
			const inputElement = screen.getByRole('textbox');

			fireEvent.change(inputElement, { target: { value: 'test input' } });
			expect(onChangeMock).toHaveBeenCalledWith('test input');
		});

		it('should prevent invalid input for number variants', () => {
			const onChangeMock = vi.fn();
			render(<Input variant='integer' onChange={onChangeMock} />);
			const inputElement = screen.getByRole('textbox');

			fireEvent.change(inputElement, { target: { value: 'abc' } });
			expect(onChangeMock).not.toHaveBeenCalled();
		});
	});

	// Accessibility Tests
	describe('Accessibility', () => {
		it('should have associated label when id is provided', () => {
			render(<Input id='test-input' label='Test Label' />);
			const inputElement = screen.getByLabelText('Test Label');
			expect(inputElement).toBeInTheDocument();
			expect(inputElement).toHaveAttribute('id', 'test-input');
		});

		it('should render label with correct htmlFor attribute', () => {
			render(<Input id='unique-input' label='Unique Label' />);
			const labelElement = screen.getByText('Unique Label');
			expect(labelElement).toHaveAttribute('for', 'unique-input');
		});
	});
});
