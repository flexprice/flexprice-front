import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import QueryBuilder from './QueryBuilder';

vi.mock('@/components/molecules', () => ({ FilterPopover: () => null, SortDropdown: () => null }));

describe('QueryBuilder', () => {
	it('does not loop when selectedSorts is omitted and the parent re-renders', () => {
		const err = vi.spyOn(console, 'error').mockImplementation(() => {});
		const onFilterChange = vi.fn();
		const { rerender } = render(<QueryBuilder filterOptions={[]} filters={[]} onFilterChange={onFilterChange} />);
		expect(() => rerender(<QueryBuilder filterOptions={[]} filters={[]} onFilterChange={onFilterChange} />)).not.toThrow();
		expect(err.mock.calls.flat().join(' ')).not.toMatch(/Maximum update depth/);
		err.mockRestore();
	});
});
