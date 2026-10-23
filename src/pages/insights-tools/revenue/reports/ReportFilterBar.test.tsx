import { describe, expect, it, vi } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import { ReportCatalogEntry } from '@/types/dto/Reports';
import ReportFilterBar from './ReportFilterBar';
import { renderWithProviders } from './testUtils';

vi.mock('@/api/MeterApi', () => ({ MeterApi: { getAllActiveMeters: vi.fn().mockResolvedValue({ items: [] }) } }));

const base: Omit<ReportCatalogEntry, 'dimensions'> = {
	key: 'invoice_total',
	name: 'Total billing',
	description: '',
	category: 'billing',
	kind: 'flow',
	value_type: 'money',
	improvement: 'higher',
	shapes: ['scalar'],
	default_shape: 'scalar',
	grains: [],
	supports_compare: false,
};

describe('ReportFilterBar', () => {
	it('renders nothing for reports without filterable fields', () => {
		const { container } = renderWithProviders(<ReportFilterBar entry={{ ...base, dimensions: [] }} filters={[]} onChange={() => {}} />);
		expect(container).toBeEmptyDOMElement();
	});

	it('shows only the fields the report allows and removes a chip', () => {
		const onChange = vi.fn();
		renderWithProviders(
			<ReportFilterBar
				entry={{ ...base, dimensions: [{ key: 'invoice_type', label: 'Invoice type' }] }}
				filters={[{ field: 'invoice_type', op: 'eq', value: ['ONE_OFF'] }]}
				onChange={onChange}
			/>,
		);
		expect(screen.getByText('Invoice type: ONE_OFF')).toBeInTheDocument();
		expect(screen.queryByText(/Customer/)).not.toBeInTheDocument();
		fireEvent.click(screen.getByRole('button', { name: 'Remove Invoice type filter' }));
		expect(onChange).toHaveBeenCalledWith([]);
	});
});
