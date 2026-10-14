import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom';
import { fireEvent, screen } from '@testing-library/react';
import { mockCatalog, mockDatasets } from '@/api/fixtures/reports';
import { ReportFamilyCustom } from '@/types/dto/Reports';
import ReportList from './ReportList';
import { renderWithProviders } from './testUtils';

describe('ReportList', () => {
	const entries = mockCatalog().items;
	const none = {
		customReports: [] as ReportFamilyCustom[],
		customError: false,
		selectedCustomId: '',
		onSelectCustom: () => {},
		datasets: mockDatasets().items,
		onNewCustom: () => {},
	};
	const acme: ReportFamilyCustom = {
		id: 'v1',
		name: 'Acme billing',
		version: 1,
		created_at: '',
		updated_at: '',
		definition: { family: 'report', metrics: ['invoice_total'], shape: 'scalar', time: { range: 'this_month' } },
	};

	it('groups by category and selects on click', () => {
		const onSelect = vi.fn();
		renderWithProviders(<ReportList entries={entries} selectedKey='invoice_total' onSelect={onSelect} {...none} />);
		expect(screen.getByText('Receivables')).toBeInTheDocument();
		fireEvent.click(screen.getByRole('button', { name: 'Days to pay' }));
		expect(onSelect).toHaveBeenCalledWith('days_to_pay');
	});

	it('filters by search', () => {
		renderWithProviders(<ReportList entries={entries} selectedKey='' onSelect={() => {}} {...none} customReports={[acme]} />);
		fireEvent.change(screen.getByPlaceholderText('Search reports'), { target: { value: 'aging' } });
		expect(screen.getByRole('button', { name: 'Receivables aging' })).toBeInTheDocument();
		expect(screen.queryByRole('button', { name: 'Total billing' })).not.toBeInTheDocument();
		expect(screen.queryByRole('button', { name: /Acme billing/ })).not.toBeInTheDocument();
		fireEvent.change(screen.getByPlaceholderText('Search reports'), { target: { value: 'acme' } });
		expect(screen.getByRole('button', { name: /Acme billing/ })).toBeInTheDocument();
	});

	it('hides variant entries', () => {
		renderWithProviders(<ReportList entries={entries} selectedKey='' onSelect={() => {}} {...none} />);
		expect(screen.getByRole('button', { name: 'ARPU' })).toBeInTheDocument();
		expect(screen.queryByRole('button', { name: 'ARPU (billed)' })).not.toBeInTheDocument();
	});

	it('lists custom reports with their base report and selects one', () => {
		const onSelectCustom = vi.fn();
		renderWithProviders(
			<ReportList
				entries={entries}
				selectedKey=''
				onSelect={() => {}}
				customError={false}
				selectedCustomId=''
				onSelectCustom={onSelectCustom}
				customReports={[acme]}
				datasets={none.datasets}
				onNewCustom={() => {}}
			/>,
		);
		expect(screen.getByText('Custom reports')).toBeInTheDocument();
		expect(screen.getByRole('button', { name: /Acme billing/ })).toHaveTextContent('Total billing');
		fireEvent.click(screen.getByRole('button', { name: /Acme billing/ }));
		expect(onSelectCustom).toHaveBeenCalledWith('v1');
	});

	it('marks only the open custom report as current', () => {
		renderWithProviders(
			<ReportList
				entries={entries}
				selectedKey='invoice_total'
				onSelect={() => {}}
				{...none}
				customReports={[acme]}
				selectedCustomId='v1'
			/>,
		);
		expect(screen.getByRole('button', { name: /Acme billing/ })).toHaveAttribute('aria-current', 'true');
		expect(screen.getByRole('button', { name: 'Total billing' })).not.toHaveAttribute('aria-current');
	});

	it('shows the empty hint when there are no custom reports', () => {
		renderWithProviders(<ReportList entries={entries} selectedKey='' onSelect={() => {}} {...none} />);
		expect(screen.getByText('Save any report to reuse it here')).toBeInTheDocument();
	});

	it('shows a load error for custom reports', () => {
		renderWithProviders(<ReportList entries={entries} selectedKey='' onSelect={() => {}} {...none} customError />);
		expect(screen.getByText("Couldn't load custom reports")).toBeInTheDocument();
	});
});
