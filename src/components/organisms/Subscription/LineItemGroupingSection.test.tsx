import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeAll } from 'vitest';
import '@testing-library/jest-dom';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import { createInstance } from 'i18next';
import type { i18n as I18nInstance } from 'i18next';
import { BILLING_PERIOD } from '@/constants/constants';
import LineItemGroupingSection from './LineItemGroupingSection';
import customersEn from '@/i18n/locales/en/customers.json';

// Real English catalogue so the explainer's interpolation is exercised against the
// strings we actually ship, not a stand-in.
let testI18n: I18nInstance;
beforeAll(async () => {
	const instance = createInstance();
	await instance.use(initReactI18next).init({
		lng: 'en',
		fallbackLng: 'en',
		ns: ['customers'],
		defaultNS: 'customers',
		resources: { en: { customers: customersEn } },
		interpolation: { escapeValue: false },
	});
	testI18n = instance;
});

const renderSection = (props: Partial<React.ComponentProps<typeof LineItemGroupingSection>> = {}) => {
	const onChange = vi.fn();
	render(
		<I18nextProvider i18n={testI18n}>
			<LineItemGroupingSection
				checked={false}
				onChange={onChange}
				subPeriod={BILLING_PERIOD.QUARTERLY}
				subCount={1}
				splittingCadences={[{ period: BILLING_PERIOD.MONTHLY, count: 1 }]}
				{...props}
			/>
		</I18nextProvider>,
	);
	return { onChange };
};

describe('LineItemGroupingSection', () => {
	it('names the subscription and charge cadences in the explainer', () => {
		renderSection();
		expect(screen.getByText(/This subscription's billing period is quarterly, but it includes monthly charges\./)).toBeInTheDocument();
	});

	it('lists every splitting cadence, with a count prefix for multi-count cadences', () => {
		renderSection({
			subPeriod: BILLING_PERIOD.ANNUAL,
			splittingCadences: [
				{ period: BILLING_PERIOD.MONTHLY, count: 1 },
				{ period: BILLING_PERIOD.MONTHLY, count: 2 },
			],
		});
		expect(
			screen.getByText(/This subscription's billing period is annual, but it includes monthly, 2× monthly charges\./),
		).toBeInTheDocument();
	});

	it('reports toggle changes to the parent', async () => {
		const { onChange } = renderSection();
		await userEvent.click(screen.getByRole('switch'));
		expect(onChange).toHaveBeenCalledWith(true);
	});

	it('reflects the checked state on the switch', () => {
		renderSection({ checked: true });
		expect(screen.getByRole('switch')).toBeChecked();
	});

	it('shows the overage caveat only when the subscription carries a commitment', () => {
		const { unmount } = render(
			<I18nextProvider i18n={testI18n}>
				<LineItemGroupingSection
					checked={false}
					onChange={vi.fn()}
					subPeriod={BILLING_PERIOD.QUARTERLY}
					subCount={1}
					splittingCadences={[{ period: BILLING_PERIOD.MONTHLY, count: 1 }]}
				/>
			</I18nextProvider>,
		);
		expect(screen.queryByText(/Overage rows from cumulative commitments/)).not.toBeInTheDocument();
		unmount();

		renderSection({ showOverageNote: true });
		expect(screen.getByText(/Overage rows from cumulative commitments/)).toBeInTheDocument();
	});
});
