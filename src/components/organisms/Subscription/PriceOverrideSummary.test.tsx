import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom';
import { BILLING_MODEL, PRICE_TYPE, PRICE_UNIT_TYPE, type Price } from '@/models/Price';
import type { SubscriptionLineItemOverrideRequest } from '@/utils/common/price_override_helpers';
import PriceOverrideSummary from './PriceOverrideSummary';

vi.mock('react-i18next', () => ({
	useTranslation: () => ({ t: (key: string) => key }),
}));

/**
 * A percentage charge is a FLAT_FEE whose amount holds the decimal equivalent (5% -> "0.05"),
 * tagged in metadata. "0.05" must render as "5%", never as the currency amount it is stored as.
 */
const percentagePrice = {
	id: 'price_pct',
	amount: '0.05',
	currency: 'usd',
	billing_model: BILLING_MODEL.FLAT_FEE,
	type: PRICE_TYPE.USAGE,
	price_unit_type: PRICE_UNIT_TYPE.FIAT,
	metadata: { billing_model: 'percentage' },
	description: 'Transaction fee',
} as unknown as Price;

const renderSummary = (override: SubscriptionLineItemOverrideRequest) =>
	render(<PriceOverrideSummary overrides={[override]} prices={[percentagePrice]} />);

describe('PriceOverrideSummary percentage formatting', () => {
	it('does not percentage-format an override that moves the charge off flat fee', () => {
		// PACKAGE override: 10 is a plain currency amount, so it must read as $10 - not 1000%.
		renderSummary({
			price_id: 'price_pct',
			amount: 10,
			billing_model: BILLING_MODEL.PACKAGE,
		});

		const description = screen.getByText(/Amount:/);
		expect(description).toHaveTextContent('Amount: 5% → $10');
		expect(description).not.toHaveTextContent('1000%');
	});

	it('percentage-formats an override that keeps the charge on flat fee', () => {
		// FLAT_FEE override: 0.1 is still the decimal equivalent of a percentage, so it reads as 10%.
		renderSummary({
			price_id: 'price_pct',
			amount: 0.1,
			billing_model: BILLING_MODEL.FLAT_FEE,
		});

		expect(screen.getByText(/Amount:/)).toHaveTextContent('Amount: 5% → 10%');
	});

	it('percentage-formats an override that does not touch the billing model at all', () => {
		renderSummary({
			price_id: 'price_pct',
			amount: 0.025,
		});

		expect(screen.getByText(/Amount:/)).toHaveTextContent('Amount: 5% → 2.5%');
	});

	it('leaves a non-percentage price formatted as currency on both sides', () => {
		const plainPrice = { ...percentagePrice, id: 'price_plain', amount: '12', metadata: {} } as unknown as Price;
		render(
			<PriceOverrideSummary
				overrides={[{ price_id: 'price_plain', amount: 20, billing_model: BILLING_MODEL.PACKAGE }]}
				prices={[plainPrice]}
			/>,
		);

		expect(screen.getByText(/Amount:/)).toHaveTextContent('Amount: $12 → $20');
	});
});
