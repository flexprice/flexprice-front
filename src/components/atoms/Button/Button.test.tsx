import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Button from './Button';

describe('Button', () => {
	it('renders children', () => {
		render(<Button>Click me</Button>);
		expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
	});

	it('calls onClick when clicked', () => {
		const onClick = vi.fn();
		render(<Button onClick={onClick}>Click me</Button>);
		fireEvent.click(screen.getByRole('button'));
		expect(onClick).toHaveBeenCalledTimes(1);
	});

	it('shows spinner when isLoading is true', () => {
		render(<Button isLoading>Save</Button>);
		// When loading, it renders a loader icon (svg)
		const button = screen.getByRole('button');
		expect(button.querySelector('svg')).toBeTruthy();
	});

	it('is disabled when isLoading is true', () => {
		render(<Button isLoading>Save</Button>);
		expect(screen.getByRole('button')).toBeDisabled();
	});

	it('is disabled when disabled prop is true', () => {
		render(<Button disabled>Submit</Button>);
		expect(screen.getByRole('button')).toBeDisabled();
	});

	it('does not call onClick when disabled', () => {
		const onClick = vi.fn();
		render(
			<Button disabled onClick={onClick}>
				Submit
			</Button>,
		);
		fireEvent.click(screen.getByRole('button'));
		expect(onClick).not.toHaveBeenCalled();
	});

	it('applies the correct variant class', () => {
		render(<Button variant='destructive'>Delete</Button>);
		const button = screen.getByRole('button');
		expect(button.className).toContain('bg-destructive');
	});
});
