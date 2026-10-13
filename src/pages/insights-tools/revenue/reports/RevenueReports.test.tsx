import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import RevenueReports from './RevenueReports';
import { renderWithProviders } from './testUtils';
import { render } from '@testing-library/react';
import { createInstance } from 'i18next';
import { I18nextProvider } from 'react-i18next';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import enSettings from '@/i18n/locales/en/settings.json';
import ReportsApi from '@/api/ReportsApi';

describe('RevenueReports', () => {
	beforeEach(() => vi.stubEnv('VITE_REPORTS_MOCK', 'true'));
	afterEach(() => {
		vi.unstubAllEnvs();
		vi.restoreAllMocks();
	});

	it('renders the catalog and selects the first report', async () => {
		renderWithProviders(<RevenueReports />);
		expect(await screen.findByRole('heading', { name: 'Total billing' })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Receivables aging' })).toBeInTheDocument();
	});

	it('switching report runs that report', async () => {
		const spy = vi.spyOn(ReportsApi, 'runReport');
		renderWithProviders(<RevenueReports />);
		fireEvent.click(await screen.findByRole('button', { name: 'Days to pay' }));
		await waitFor(() => expect(spy).toHaveBeenCalledWith('days_to_pay', expect.objectContaining({ shape: 'timeseries' })));
		expect(await screen.findByRole('heading', { name: 'Days to pay' })).toBeInTheDocument();
	});

	describe('basis', () => {
		it('appears only for reports with variants', async () => {
			renderWithProviders(<RevenueReports />);
			await screen.findByRole('heading', { name: 'Total billing' });
			expect(screen.queryByRole('group', { name: 'Basis' })).not.toBeInTheDocument();
			fireEvent.click(screen.getByRole('button', { name: 'ARPU' }));
			expect(await screen.findByRole('group', { name: 'Basis' })).toBeInTheDocument();
		});

		it('switching basis runs the variant key', async () => {
			const spy = vi.spyOn(ReportsApi, 'runReport');
			renderWithProviders(<RevenueReports />);
			fireEvent.click(await screen.findByRole('button', { name: 'ARPU' }));
			fireEvent.click(await screen.findByRole('button', { name: 'Paid' }));
			expect(await screen.findByRole('heading', { name: 'ARPU (paid)' })).toBeInTheDocument();
			await waitFor(() => expect(spy).toHaveBeenCalledWith('arpu_paid', expect.objectContaining({ shape: 'timeseries' })));
		});

		it('switching report resets basis', async () => {
			renderWithProviders(<RevenueReports />);
			fireEvent.click(await screen.findByRole('button', { name: 'ARPU' }));
			fireEvent.click(await screen.findByRole('button', { name: 'Paid' }));
			await screen.findByRole('heading', { name: 'ARPU (paid)' });
			fireEvent.click(screen.getByRole('button', { name: 'Days to pay' }));
			fireEvent.click(await screen.findByRole('button', { name: 'ARPU' }));
			expect(await screen.findByRole('heading', { name: 'ARPU' })).toBeInTheDocument();
			expect(screen.getByRole('button', { name: 'Billed' })).toHaveAttribute('aria-pressed', 'true');
		});
	});

	it('shows the server message when a report fails', async () => {
		vi.spyOn(ReportsApi, 'runReport').mockRejectedValue(new Error('financial reports are not enabled'));
		renderWithProviders(<RevenueReports />);
		expect(await screen.findByText('Could not load this report')).toBeInTheDocument();
		expect(screen.getAllByText('financial reports are not enabled').length).toBeGreaterThan(0);
	});

	it('snapshot report shows point-in-time caption, no compare control', async () => {
		renderWithProviders(<RevenueReports />);
		fireEvent.click(await screen.findByRole('button', { name: 'Total receivables' }));
		expect(await screen.findByRole('heading', { name: 'Total receivables' })).toBeInTheDocument();
		expect(screen.getAllByText('Point-in-time · no comparison').length).toBeGreaterThan(0);
	});

	it('shows the server message when the catalog fails', async () => {
		vi.spyOn(ReportsApi, 'listReports').mockRejectedValue(new Error('reports are not available'));
		renderWithProviders(<RevenueReports />);
		expect(await screen.findByText('Could not load this report')).toBeInTheDocument();
		expect(screen.getByText('reports are not available')).toBeInTheDocument();
	});

	it('does not retry a failed report with default query retry', async () => {
		const spy = vi.spyOn(ReportsApi, 'runReport').mockRejectedValue(new Error('forbidden'));
		const i18n = createInstance();
		i18n.init({ lng: 'en', ns: ['settings'], defaultNS: 'settings', resources: { en: { settings: enSettings } } });
		render(
			<QueryClientProvider client={new QueryClient()}>
				<I18nextProvider i18n={i18n}>
					<RevenueReports />
				</I18nextProvider>
			</QueryClientProvider>,
		);
		expect(await screen.findByText('Could not load this report')).toBeInTheDocument();
		const main = spy.mock.calls.filter(([, req]) => req.shape !== 'scalar');
		expect(main).toHaveLength(1);
	});

	it('currency is a client-side filter, never sent', async () => {
		Element.prototype.scrollIntoView = vi.fn();
		const spy = vi.spyOn(ReportsApi, 'runReport').mockResolvedValue({
			columns: [
				{ name: 'bucket', type: 'datetime', role: 'dimension' },
				{ name: 'currency', type: 'string', role: 'dimension' },
				{ name: 'invoice_total', type: 'decimal', role: 'metric' },
			],
			rows: [
				['2026-09-01T00:00:00Z', 'usd', '100'],
				['2026-09-01T00:00:00Z', 'eur', '70'],
			],
			meta: { query_source: 'mock' },
		});
		renderWithProviders(<RevenueReports />);
		const trigger = await screen.findByLabelText('Currency');
		fireEvent.keyDown(trigger, { key: 'Enter' });
		fireEvent.click(await screen.findByRole('option', { name: 'EUR' }));
		await waitFor(() => expect(screen.getByLabelText('Currency')).toHaveTextContent('EUR'));
		fireEvent.keyDown(screen.getByLabelText('Currency'), { key: 'Enter' });
		expect(await screen.findByRole('option', { name: 'USD' })).toBeInTheDocument();
		expect(screen.getByRole('option', { name: 'EUR' })).toBeInTheDocument();
		expect(spy.mock.calls.every(([, req]) => !('currency' in req))).toBe(true);
	});

	it('drops the previous report rows while a switched report loads', async () => {
		const { mockRun } = await import('@/api/fixtures/reports');
		vi.spyOn(ReportsApi, 'runReport').mockImplementation((key, req) =>
			key === 'days_to_pay' ? new Promise(() => {}) : Promise.resolve(mockRun(key, req)),
		);
		renderWithProviders(<RevenueReports />);
		expect(await screen.findByRole('table')).toBeInTheDocument();
		fireEvent.click(screen.getByRole('button', { name: 'Days to pay' }));
		expect(await screen.findByRole('heading', { name: 'Days to pay' })).toBeInTheDocument();
		await waitFor(() => expect(screen.queryByRole('table')).not.toBeInTheDocument());
	});

	describe('summary cards', () => {
		const pick = async (label: string, option: string) => {
			fireEvent.keyDown(await screen.findByLabelText(label), { key: 'Enter' });
			fireEvent.click(await screen.findByRole('option', { name: option }));
		};
		const calls = (spy: { mock: { calls: Parameters<typeof ReportsApi.runReport>[] } }, scalar: boolean) =>
			spy.mock.calls.filter(([, req]) => (req.shape === 'scalar') === scalar).map(([key, req]) => JSON.stringify([key, req]));

		it('report controls do not change the cards', async () => {
			Element.prototype.scrollIntoView = vi.fn();
			const spy = vi.spyOn(ReportsApi, 'runReport');
			renderWithProviders(<RevenueReports />);
			await screen.findByRole('table');
			const cards = calls(spy, true);
			expect(cards.length).toBeGreaterThan(0);
			const reportCalls = calls(spy, false).length;
			await pick('Date range', 'Last 7 days');
			await waitFor(() => expect(calls(spy, false).length).toBeGreaterThan(reportCalls));
			expect(calls(spy, true)).toEqual(cards);
		});

		it('card range re-queries only the cards', async () => {
			Element.prototype.scrollIntoView = vi.fn();
			const spy = vi.spyOn(ReportsApi, 'runReport');
			renderWithProviders(<RevenueReports />);
			await screen.findByRole('table');
			const cardCount = calls(spy, true).length;
			const reportBefore = calls(spy, false);
			await pick('Summary period', 'Last 7 days');
			await waitFor(() => expect(calls(spy, true).length).toBeGreaterThan(cardCount));
			expect(calls(spy, false)).toEqual(reportBefore);
			expect(screen.getByLabelText('Date range')).toHaveTextContent('Last 90 days');
		});
	});
});
