import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom';
import { BILLING_MODEL, PRICE_TYPE, PRICE_UNIT_TYPE, type Price } from '@/models/Price';
import type { ExtendedPriceOverride } from '@/utils/common/price_override_helpers';
import PriceOverrideDialog from './PriceOverrideDialog';

vi.mock('react-i18next', () => ({
	useTranslation: () => ({ t: (key: string) => key }),
}));
vi.mock('@/hooks/useMeterForCommitment', () => ({ useMeterForCommitment: () => ({ meter: null }) }));
vi.mock('@/hooks/useCommitmentTimeBucketPrices', () => ({
	useCommitmentTimeBucketPrices: () => ({ bucketsWithPrices: [], isLoading: false }),
}));
vi.mock('react-hot-toast', () => ({ default: { success: vi.fn(), error: vi.fn() } }));

/** A percentage charge: a FLAT_FEE whose amount holds the decimal equivalent, tagged in metadata. */
const percentagePrice = {
	id: 'price_pct',
	amount: '0.05',
	currency: 'usd',
	billing_model: BILLING_MODEL.FLAT_FEE,
	type: PRICE_TYPE.USAGE,
	price_unit_type: PRICE_UNIT_TYPE.FIAT,
	metadata: { billing_model: 'percentage' },
	description: 'Transaction fee',
	tiers: [],
} as unknown as Price;

const renderDialog = (override: Omit<ExtendedPriceOverride, 'price_id'>) =>
	render(
		<PriceOverrideDialog
			isOpen
			onOpenChange={vi.fn()}
			price={percentagePrice}
			onPriceOverride={vi.fn()}
			onResetOverride={vi.fn()}
			overriddenPrices={{ price_pct: { price_id: 'price_pct', ...override } }}
		/>,
	);

describe('PriceOverrideDialog percentage seeding', () => {
	it('seeds a PACKAGE override with the stored amount as-is, not as a percentage', () => {
		// The override moved the charge off FLAT_FEE, so "10" is a plain currency amount. Running it
		// through decimalAmountToPercentage would seed the field with 1000 and persist that on save,
		// because the save path (showAsPercentage) does not convert back for a PACKAGE override.
		renderDialog({ amount: '10', billing_model: BILLING_MODEL.PACKAGE });

		const amountInput = screen.getByPlaceholderText('priceDialogs.enterNewAmountOptional');
		expect(amountInput).toHaveValue('10');
		expect(amountInput).not.toHaveValue('1000');
	});

	it('seeds a FLAT_FEE override as a percentage', () => {
		// The override kept the charge on the price's own FLAT_FEE, so "0.1" is still a stored
		// percentage decimal and has to show as 10 next to a % suffix.
		renderDialog({ amount: '0.1', billing_model: BILLING_MODEL.FLAT_FEE });

		expect(screen.getByPlaceholderText('priceDialogs.enterNewPercentageOptional')).toHaveValue('10');
	});

	it('seeds an override that does not touch the billing model as a percentage', () => {
		renderDialog({ amount: '0.025' });

		expect(screen.getByPlaceholderText('priceDialogs.enterNewPercentageOptional')).toHaveValue('2.5');
	});
});
