import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import { mockDatasets } from '@/api/fixtures/reports';
import { DatasetDefinition } from '@/types/dto/Reports';
import { renderWithProviders } from '../testUtils';
import { defaultDefinition } from './builderModel';
import ReportBuilder from './ReportBuilder';

const datasets = mockDatasets().items;
const invoices = datasets[0];
const usage = datasets[1];
const base = (patch: Partial<DatasetDefinition> = {}): DatasetDefinition => ({ ...defaultDefinition(invoices), ...patch });

const Harness = ({ initial }: { initial: DatasetDefinition }) => {
	const [def, setDef] = useState(initial);
	return <ReportBuilder datasets={datasets} value={def} onChange={setDef} />;
};

const open = (name: string) => fireEvent.keyDown(screen.getByLabelText(name), { key: 'Enter' });

describe('ReportBuilder', () => {
	it('resets to the default definition when the dataset changes', () => {
		const onChange = vi.fn();
		renderWithProviders(<ReportBuilder datasets={datasets} value={base({ dimensions: ['invoice_status'] })} onChange={onChange} />);
		open('Dataset');
		fireEvent.click(screen.getByRole('option', { name: /Usage/ }));
		expect(onChange).toHaveBeenCalledWith(defaultDefinition(usage));
	});

	it('adds measures up to five then disables add', () => {
		renderWithProviders(<Harness initial={base()} />);
		const add = screen.getByRole('button', { name: 'Add measure' });
		for (let i = 0; i < 4; i++) fireEvent.click(add);
		expect(screen.getByLabelText('Measure 5 aggregation')).toBeInTheDocument();
		expect(add).toBeDisabled();
		fireEvent.click(screen.getByRole('button', { name: 'Remove measure 5' }));
		expect(add).toBeEnabled();
	});

	it('sum lists only number fields', () => {
		renderWithProviders(
			<ReportBuilder datasets={datasets} value={base({ measures: [{ agg: 'sum', field: 'total' }] })} onChange={() => {}} />,
		);
		open('Measure 1 field');
		const names = screen.getAllByRole('option').map((o) => o.textContent);
		expect(names).toEqual(['Total', 'Amount due']);
	});

	it('disables the second group-by when a grain is set', () => {
		const def = base({ dimensions: ['invoice_status'] });
		const { unmount } = renderWithProviders(<ReportBuilder datasets={datasets} value={def} onChange={() => {}} />);
		expect(screen.getByLabelText('Group by 2')).toBeDisabled();
		unmount();
		renderWithProviders(<ReportBuilder datasets={datasets} value={{ ...def, time: { ...def.time, grain: '' } }} onChange={() => {}} />);
		expect(screen.getByLabelText('Group by 2')).toBeEnabled();
	});

	it('shows two inputs for between', () => {
		renderWithProviders(
			<ReportBuilder
				datasets={datasets}
				value={base({ filters: [{ field: 'total', op: 'between', value: ['1', '2'] }] })}
				onChange={() => {}}
			/>,
		);
		expect(screen.getByLabelText('Filter 1 minimum')).toHaveValue('1');
		expect(screen.getByLabelText('Filter 1 maximum')).toHaveValue('2');
	});

	it('shows the message for an invalid filter under filters', () => {
		renderWithProviders(
			<ReportBuilder datasets={datasets} value={base({ filters: [{ field: 'total', op: 'gt', value: ['abc'] }] })} onChange={() => {}} />,
		);
		const filters = screen.getByRole('region', { name: 'Filters' });
		expect(filters).toHaveTextContent('Filter values must be numbers.');
		expect(screen.getByRole('region', { name: 'Measures' })).not.toHaveTextContent('Filter values must be numbers.');
	});

	it('emits the full definition on change', () => {
		const onChange = vi.fn();
		const def = base();
		renderWithProviders(<ReportBuilder datasets={datasets} value={def} onChange={onChange} />);
		fireEvent.click(screen.getByRole('button', { name: 'Table' }));
		expect(onChange).toHaveBeenCalledWith({ ...def, display: 'table' });
		fireEvent.click(screen.getByRole('button', { name: 'Add filter' }));
		expect(onChange).toHaveBeenLastCalledWith({ ...def, filters: [{ field: 'customer_id', op: 'eq', value: [] }] });
	});

	it('hides compare for usage', () => {
		const { unmount } = renderWithProviders(<ReportBuilder datasets={datasets} value={base()} onChange={() => {}} />);
		expect(screen.getByLabelText('Compare')).toBeInTheDocument();
		unmount();
		renderWithProviders(<ReportBuilder datasets={datasets} value={defaultDefinition(usage)} onChange={() => {}} />);
		expect(screen.queryByLabelText('Compare')).not.toBeInTheDocument();
	});

	it('changing a measure from sum to count clears the field', () => {
		const onChange = vi.fn();
		renderWithProviders(
			<ReportBuilder datasets={datasets} value={base({ measures: [{ agg: 'sum', field: 'total' }] })} onChange={onChange} />,
		);
		open('Measure 1 aggregation');
		fireEvent.click(screen.getByRole('option', { name: 'Count' }));
		expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ measures: [{ agg: 'count' }] }));
	});

	it('changing a filter field resets op and value', () => {
		const onChange = vi.fn();
		renderWithProviders(
			<ReportBuilder datasets={datasets} value={base({ filters: [{ field: 'total', op: 'gt', value: ['5'] }] })} onChange={onChange} />,
		);
		open('Filter 1 field');
		fireEvent.click(screen.getByRole('option', { name: 'Customer' }));
		expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ filters: [{ field: 'customer_id', op: 'eq', value: [] }] }));
	});

	it('picking a grain keeps only the first group-by', () => {
		const onChange = vi.fn();
		const def = base({ dimensions: ['invoice_status', 'customer_id'], time: { ...base().time, grain: '' } });
		renderWithProviders(<ReportBuilder datasets={datasets} value={def} onChange={onChange} />);
		fireEvent.click(screen.getByRole('button', { name: 'Day' }));
		expect(onChange).toHaveBeenCalledWith({ ...def, dimensions: ['invoice_status'], time: { ...def.time, grain: 'day' } });
	});
});
