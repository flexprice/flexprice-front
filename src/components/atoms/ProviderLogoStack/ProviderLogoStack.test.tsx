import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import ProviderLogoStack from './ProviderLogoStack';

vi.mock('@/utils/integrations/providerMarks', () => ({
	formatProviderName: (provider: string) => provider.charAt(0).toUpperCase() + provider.slice(1),
	getProviderLogo: (provider: string) => ({ logo: `/logo-${provider}.svg` }),
}));

describe('ProviderLogoStack', () => {
	it('renders logos without provider names', () => {
		render(<ProviderLogoStack providers={['stripe', 'razorpay']} emptyLabel='—' />);

		expect(screen.queryByText('Stripe')).not.toBeInTheDocument();
		expect(screen.queryByText('Razorpay')).not.toBeInTheDocument();
		expect(screen.getByLabelText('Stripe, Razorpay')).toBeInTheDocument();
	});

	it('shows a +N badge after three logos', () => {
		render(<ProviderLogoStack providers={['stripe', 'razorpay', 'hubspot', 'paddle']} emptyLabel='—' />);
		expect(screen.getByText('+1')).toBeInTheDocument();
	});

	it('renders the empty label when there are no providers', () => {
		render(<ProviderLogoStack providers={[]} emptyLabel='—' />);
		expect(screen.getByText('—')).toBeInTheDocument();
	});
});
