import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom';
import { fireEvent, screen } from '@testing-library/react';
import { mockCatalog } from '@/api/fixtures/reports';
import ReportControlsBar from './ReportControlsBar';
import { defaultControls } from './reportMath';
import { renderWithProviders } from './testUtils';

const byKey = (k: string) => mockCatalog().items.find((e) => e.key === k)!;

describe('ReportControlsBar', () => {
	it('hides grain and compare for snapshot reports', () => {
		const entry = byKey('total_receivables');
		renderWithProviders(<ReportControlsBar entry={entry} controls={defaultControls(entry)} currencies={['usd']} onChange={() => {}} />);
		expect(screen.queryByText('Grain')).not.toBeInTheDocument();
		expect(screen.queryByText('Compare')).not.toBeInTheDocument();
	});

	it('changes grain', () => {
		const entry = byKey('invoice_total');
		const onChange = vi.fn();
		renderWithProviders(<ReportControlsBar entry={entry} controls={defaultControls(entry)} currencies={['usd']} onChange={onChange} />);
		fireEvent.click(screen.getByRole('button', { name: 'Week' }));
		expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ grain: 'week' }));
	});

	it('toggles chart and table', () => {
		const entry = byKey('invoice_total');
		const onChange = vi.fn();
		renderWithProviders(<ReportControlsBar entry={entry} controls={defaultControls(entry)} currencies={['usd']} onChange={onChange} />);
		fireEvent.click(screen.getByRole('button', { name: 'Table' }));
		expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ view: 'table' }));
	});

	it('group-by is mandatory for breakdown-only reports', () => {
		const entry = byKey('receivables_aging');
		renderWithProviders(<ReportControlsBar entry={entry} controls={defaultControls(entry)} currencies={['usd']} onChange={() => {}} />);
		const trigger = screen.getByLabelText('Group by');
		expect(trigger).toHaveTextContent('Aging bucket');
		fireEvent.keyDown(trigger, { key: 'Enter' });
		expect(screen.queryByText('None')).not.toBeInTheDocument();
	});

	it('disables presets above max_range_days with a hint', () => {
		const entry = byKey('events_volume');
		renderWithProviders(<ReportControlsBar entry={entry} controls={defaultControls(entry)} currencies={[]} onChange={() => {}} />);
		const trigger = screen.getByLabelText('Date range');
		expect(trigger).toHaveTextContent('Last 7 days');
		fireEvent.keyDown(trigger, { key: 'Enter' });
		expect(screen.getByRole('option', { name: /Last 30 days/ })).toHaveAttribute('aria-disabled', 'true');
		expect(screen.getByRole('option', { name: /This year/ })).toHaveAttribute('aria-disabled', 'true');
		expect(screen.getAllByText('Up to 7 days for this report').length).toBeGreaterThan(0);
	});
});
