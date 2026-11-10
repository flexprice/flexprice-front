import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import CustomerPortalWrapper from './CustomerPortalWrapper';

const handoff = vi.hoisted(() => ({ isHandingOff: false, wasCheckoutReturn: false }));

vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
vi.mock('@/hooks/useForceLightTheme', () => ({ useForceLightTheme: () => {} }));
vi.mock('@/components/customer-portal/useCheckoutTabHandoff', () => ({ default: () => handoff }));
vi.mock('./CustomerPortal', () => ({ default: ({ token }: { token: string }) => <p>portal for {token}</p> }));

const renderAt = (path: string) =>
	render(
		<MemoryRouter initialEntries={[path]}>
			<CustomerPortalWrapper />
		</MemoryRouter>,
	);

describe('CustomerPortalWrapper', () => {
	beforeEach(() => {
		handoff.wasCheckoutReturn = false;
		localStorage.clear();
	});

	it('opens the portal from the URL token', () => {
		renderAt('/customer-portal?token=abc');
		expect(screen.getByText('portal for abc')).toBeInTheDocument();
	});

	it('calls a bare visit an invalid link', () => {
		renderAt('/customer-portal');
		expect(screen.getByText('wrapper.invalidLinkTitle')).toBeInTheDocument();
	});

	it('does not call a checkout return invalid when this browser has no token', () => {
		// The checkout opened in another browser, so nothing was stored here.
		handoff.wasCheckoutReturn = true;
		renderAt('/customer-portal');
		expect(screen.getByText('wrapper.checkoutReturnTitle')).toBeInTheDocument();
		expect(screen.queryByText('wrapper.invalidLinkTitle')).not.toBeInTheDocument();
	});

	it('recognises a provider return that lost our marker', () => {
		// A connection-level redirect URL replaces ours, so only Moyasar's own
		// parameters say this is a return.
		renderAt('/customer-portal?id=pay_123&status=paid');
		expect(screen.getByText('wrapper.checkoutReturnTitle')).toBeInTheDocument();
	});

	it('restores the stored token on a checkout return', () => {
		localStorage.setItem('flexprice.portal.sessionToken', JSON.stringify({ token: 'kept', storedAt: Date.now() }));
		handoff.wasCheckoutReturn = true;
		renderAt('/customer-portal');
		expect(screen.getByText('portal for kept')).toBeInTheDocument();
	});
});
