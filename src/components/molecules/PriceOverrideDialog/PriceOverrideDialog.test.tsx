import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeAll } from 'vitest';
import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { I18nextProvider } from 'react-i18next';
import { createInstance } from 'i18next';
import type { i18n as I18nInstance } from 'i18next';
import { initReactI18next } from 'react-i18next';
import catalogEn from '@/i18n/locales/en/catalog.json';
import PriceOverrideDialog from './PriceOverrideDialog';
import { BILLING_MODEL, PRICE_TYPE, PRICE_UNIT_TYPE, TIER_MODE } from '@/models/Price';
import type { Price } from '@/models/Price';

vi.mock('react-hot-toast', () => ({ default: { success: vi.fn(), error: vi.fn() } }));

let testI18n: I18nInstance;
beforeAll(async () => {
	const instance = createInstance();
	await instance.use(initReactI18next).init({
		lng: 'en',
		fallbackLng: 'en',
		ns: ['catalog', 'billing'],
		defaultNS: 'catalog',
		resources: { en: { catalog: catalogEn, billing: {} } },
		interpolation: { escapeValue: false },
	});
	testI18n = instance;
});

const Wrapper = ({ children }: { children: React.ReactNode }) => (
	<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })}>
		<I18nextProvider i18n={testI18n}>{children}</I18nextProvider>
	</QueryClientProvider>
);

const makeSlabTieredPrice = (): Price =>
	({
		id: 'price_slab_1',
		amount: '0',
		display_amount: '0',
		currency: 'inr',
		type: PRICE_TYPE.USAGE,
		price_unit_type: PRICE_UNIT_TYPE.FIAT,
		billing_model: BILLING_MODEL.TIERED,
		tier_mode: TIER_MODE.SLAB,
		tiers: [
			{ up_to: 80000, unit_amount: '0', flat_amount: '0' },
			{ up_to: null, unit_amount: '1.1', flat_amount: '0' },
		],
		meter_id: 'meter_1',
		bucket_size: undefined,
	}) as unknown as Price;

describe('PriceOverrideDialog', () => {
	it('shows Slab Tiered (not Volume Tiered) for a SLAB_TIERED charge that has no prior override', () => {
		render(
			<Wrapper>
				<PriceOverrideDialog
					isOpen
					onOpenChange={vi.fn()}
					price={makeSlabTieredPrice()}
					onPriceOverride={vi.fn()}
					onResetOverride={vi.fn()}
					overriddenPrices={{}}
				/>
			</Wrapper>,
		);

		// Regression for: a SLAB_TIERED charge rendered as "Volume Tiered" in this modal.
		expect(screen.getByText('Slab Tiered')).toBeInTheDocument();
		expect(screen.queryByText('Volume Tiered')).not.toBeInTheDocument();
	});
});
