import { render, screen } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import CustomerPortalWrapper from './CustomerPortalWrapper';

const handoff = vi.hoisted(() => ({ isHandingOff: false, wasCheckoutReturn: false }));

vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
vi.mock('@/hooks/useForceLightTheme', () => ({ useForceLightTheme: () => {} }));
vi.mock('@/components/customer-portal/useCheckoutTabHandoff', () => ({ default: () => handoff }));
vi.mock('./CustomerPortal', () => ({ default: ({ token }: { token: string }) => <p>portal for {token}</p> }));

const Address = () => {
	const { pathname, search } = useLocation();
	return <output>{pathname + search}</output>;
};

const renderAt = (path: string) =>
	render(
		<MemoryRouter initialEntries={[path]}>
			<CustomerPortalWrapper />
			<Address />
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

	it('shows a neutral page, not the success one, when the provider says the payment failed', () => {
		renderAt('/customer-portal?id=pay_123&status=failed');
		expect(screen.getByText('wrapper.checkoutReturnFailedTitle')).toBeInTheDocument();
		expect(screen.queryByText('wrapper.checkoutReturnTitle')).not.toBeInTheDocument();
	});

	it('restores the stored token on a checkout return', () => {
		localStorage.setItem('flexprice.portal.sessionToken', JSON.stringify({ token: 'kept', storedAt: Date.now() }));
		handoff.wasCheckoutReturn = true;
		renderAt('/customer-portal');
		expect(screen.getByText('portal for kept')).toBeInTheDocument();
		// Back in the address, so a reload of this tab still opens the portal.
		expect(screen.getByRole('status')).toHaveTextContent('?token=kept');
	});

	describe('return routes', () => {
		it('shows the confirming page on the success route when this browser has no session', () => {
			renderAt('/customer-portal/checkout/success');
			expect(screen.getByText('wrapper.checkoutReturnTitle')).toBeInTheDocument();
			expect(screen.queryByText('wrapper.invalidLinkTitle')).not.toBeInTheDocument();
		});

		it('shows the not-completed page on the failure route', () => {
			renderAt('/customer-portal/checkout/failure');
			expect(screen.getByText('wrapper.checkoutReturnFailedTitle')).toBeInTheDocument();
			expect(screen.queryByText('wrapper.checkoutReturnTitle')).not.toBeInTheDocument();
		});

		it('lets a provider that says the payment failed override the success route', () => {
			renderAt('/customer-portal/checkout/success?razorpay_payment_link_status=cancelled&razorpay_payment_link_id=plink_1');
			expect(screen.getByText('wrapper.checkoutReturnFailedTitle')).toBeInTheDocument();
		});

		it('opens the portal on its own path when the stored session is still here', () => {
			// The real outcome then comes from the checkout status, not from the route.
			localStorage.setItem('flexprice.portal.sessionToken', JSON.stringify({ token: 'kept', storedAt: Date.now() }));
			renderAt('/customer-portal/checkout/failure?section=credits');
			expect(screen.getByText('portal for kept')).toBeInTheDocument();
			expect(screen.getByRole('status')).toHaveTextContent('/customer-portal?section=credits&token=kept');
		});

		it('moves a reload with a URL token off the return route', () => {
			renderAt('/customer-portal/checkout/success?token=abc');
			expect(screen.getByText('portal for abc')).toBeInTheDocument();
			expect(screen.getByRole('status')).toHaveTextContent('/customer-portal?token=abc');
		});
	});
});
