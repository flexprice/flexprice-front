import type { ReactElement } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import { createInstance } from 'i18next';
import { describe, expect, it, vi, beforeAll } from 'vitest';
import { PRICE_TYPE, type Price } from '@/models/Price';
import PriceQuantityCell from './PriceQuantityCell';

const makePrice = (overrides: Partial<Price> & Pick<Price, 'id' | 'type'>): Price =>
	({
		amount: '10',
		...overrides,
	}) as Price;

const i18n = createInstance();

beforeAll(async () => {
	await i18n.use(initReactI18next).init({
		lng: 'en',
		fallbackLng: 'en',
		ns: ['customers'],
		defaultNS: 'customers',
		resources: {
			en: {
				customers: {
					organisms: { subscriptionPriceTable: { payAsYouGo: 'pay as you go' } },
				},
			},
		},
		interpolation: { escapeValue: false },
	});
});

const renderCell = (ui: ReactElement) => render(<I18nextProvider i18n={i18n}>{ui}</I18nextProvider>);

describe('PriceQuantityCell', () => {
	it('hides the quantity input for USAGE prices', () => {
		renderCell(
			<PriceQuantityCell
				price={makePrice({ id: 'usage', type: PRICE_TYPE.USAGE })}
				usageLabel='pay as you go'
				ariaLabel='Quantity'
				onPriceOverride={vi.fn()}
				onResetOverride={vi.fn()}
			/>,
		);

		expect(screen.getByText('pay as you go')).toBeInTheDocument();
		expect(screen.queryByLabelText('Quantity')).not.toBeInTheDocument();
	});

	it('prefills FIXED quantity from min_quantity', () => {
		renderCell(
			<PriceQuantityCell
				price={makePrice({ id: 'fixed', type: PRICE_TYPE.FIXED, min_quantity: 3 })}
				ariaLabel='Quantity'
				onPriceOverride={vi.fn()}
				onResetOverride={vi.fn()}
			/>,
		);

		expect(screen.getByLabelText('Quantity')).toHaveValue('3');
	});

	it('emits a quantity override when the user changes a FIXED price away from the default', async () => {
		const user = userEvent.setup();
		const onPriceOverride = vi.fn();

		renderCell(
			<PriceQuantityCell
				price={makePrice({ id: 'fixed', type: PRICE_TYPE.FIXED, min_quantity: 1 })}
				ariaLabel='Quantity'
				onPriceOverride={onPriceOverride}
				onResetOverride={vi.fn()}
			/>,
		);

		const input = screen.getByLabelText('Quantity');
		await user.clear(input);
		await user.type(input, '5');

		expect(onPriceOverride).toHaveBeenCalledWith('fixed', { quantity: 5 });
	});
});
