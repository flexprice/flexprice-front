import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import SnapshotTable from './SnapshotTable';

vi.mock('react-i18next', () => ({
	useTranslation: () => ({ t: (k: string, o?: Record<string, unknown>) => (typeof o?.defaultValue === 'string' ? o.defaultValue : k) }),
}));

const wrap = (ui: React.ReactNode) => (
	<QueryClientProvider client={new QueryClient()}>
		<MemoryRouter>{ui}</MemoryRouter>
	</QueryClientProvider>
);

describe('SnapshotTable', () => {
	it('renders a Field | Value table with no before/after columns', () => {
		render(wrap(<SnapshotTable rows={[{ key: 'name', label: 'Name', value: 'Acme', format: 'text' }]} />));
		expect(screen.getByText('sheet.field')).toBeInTheDocument();
		expect(screen.getByText('sheet.value')).toBeInTheDocument();
		expect(screen.queryByText('sheet.before')).not.toBeInTheDocument();
		expect(screen.queryByText('sheet.after')).not.toBeInTheDocument();
		expect(screen.getByText('Name')).toBeInTheDocument();
		expect(screen.getByText('Acme')).toBeInTheDocument();
	});
	it('marks redacted values instead of showing them', () => {
		render(wrap(<SnapshotTable rows={[{ key: 'tax_id', label: 'Tax id', value: '[redacted]', format: 'redacted' }]} />));
		expect(screen.getByText('sheet.redacted')).toBeInTheDocument();
		expect(screen.queryByText('[redacted]')).not.toBeInTheDocument();
	});
});
