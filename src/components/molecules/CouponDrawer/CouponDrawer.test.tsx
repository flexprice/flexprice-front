import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeAll } from 'vitest';
import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router';
import { I18nextProvider } from 'react-i18next';
import { createInstance } from 'i18next';
import type { i18n as I18nInstance } from 'i18next';
import { initReactI18next } from 'react-i18next';
import CouponDrawer from './CouponDrawer';
import { COUPON_TYPE, COUPON_CADENCE } from '@/types/common/Coupon';
import { ENTITY_STATUS } from '@/models';

vi.mock('@/api/CouponApi', () => ({ default: { createCoupon: vi.fn(), updateCoupon: vi.fn() } }));
vi.mock('react-hot-toast', () => ({ default: { success: vi.fn(), error: vi.fn() } }));
vi.mock('@/core/services/tanstack/queryClient', () => ({ refetchQueries: vi.fn() }));
vi.mock('@/core/services/supbase/config', () => ({ default: {} }));
vi.mock('@/core/auth/AuthService', () => ({ default: {} }));
vi.mock('react-router', async () => {
	const actual = await vi.importActual('react-router');
	return { ...actual, useNavigate: () => vi.fn() };
});

let testI18n: I18nInstance;
beforeAll(async () => {
	const instance = createInstance();
	await instance.use(initReactI18next).init({
		lng: 'en',
		fallbackLng: 'en',
		ns: ['catalog', 'common'],
		defaultNS: 'catalog',
		resources: {
			en: {
				catalog: {
					coupons: {
						drawer: {
							couponCode: 'Coupon Code',
							couponCodePlaceholder: 'e.g. SUMMER20',
							couponCodeHelp: 'Human-readable code used to apply this coupon via API. Cannot be changed after creation.',
						},
					},
				},
				common: {},
			},
		},
		interpolation: { escapeValue: false },
	});
	testI18n = instance;
});

const Wrapper = ({ children }: { children: React.ReactNode }) => (
	<QueryClientProvider client={new QueryClient({ defaultOptions: { mutations: { retry: false } } })}>
		<I18nextProvider i18n={testI18n}>
			<BrowserRouter>{children}</BrowserRouter>
		</I18nextProvider>
	</QueryClientProvider>
);

describe('CouponDrawer', () => {
	it('shows coupon_code field in create mode', () => {
		render(
			<Wrapper>
				<CouponDrawer open={true} />
			</Wrapper>,
		);
		expect(screen.getByLabelText(/coupon code/i)).toBeInTheDocument();
	});

	it('does not show coupon_code field in edit mode', () => {
		const existingCoupon = {
			id: 'cpn_1',
			name: 'Test',
			type: COUPON_TYPE.PERCENTAGE,
			cadence: COUPON_CADENCE.ONCE,
			percentage_off: '10',
			currency: 'usd',
			total_redemptions: 0,
			coupon_code: 'TEST10',
			status: ENTITY_STATUS.PUBLISHED,
			created_at: '',
			updated_at: '',
			created_by: '',
			updated_by: '',
			tenant_id: '',
			environment_id: '',
		};
		render(
			<Wrapper>
				<CouponDrawer open={true} data={existingCoupon} />
			</Wrapper>,
		);
		expect(screen.queryByLabelText(/coupon code/i)).not.toBeInTheDocument();
	});
});
