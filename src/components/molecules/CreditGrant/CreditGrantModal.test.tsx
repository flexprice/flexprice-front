import { render, screen, within, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeAll } from 'vitest';
import '@testing-library/jest-dom';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import { createInstance } from 'i18next';
import type { i18n as I18nInstance } from 'i18next';
import billingEn from '@/i18n/locales/en/billing.json';
import CreditGrantModal from './CreditGrantModal';
import {
	CREDIT_GRANT_CADENCE,
	CREDIT_GRANT_EXPIRATION_TYPE,
	CREDIT_GRANT_PERIOD,
	CREDIT_GRANT_PERIOD_UNIT,
	CREDIT_GRANT_SCOPE,
} from '@/models';
import { InternalCreditGrantRequest } from '@/types/dto/CreditGrant';

let testI18n: I18nInstance;
beforeAll(async () => {
	const instance = createInstance();
	await instance.use(initReactI18next).init({
		lng: 'en',
		fallbackLng: 'en',
		ns: ['billing'],
		defaultNS: 'billing',
		resources: { en: { billing: billingEn } },
		interpolation: { escapeValue: false },
	});
	testI18n = instance;
});

const emptyGrant = (): InternalCreditGrantRequest => ({
	id: 'credit-grant-1',
	credits: 100,
	period: CREDIT_GRANT_PERIOD.MONTHLY,
	name: 'Free Credits',
	scope: CREDIT_GRANT_SCOPE.PLAN,
	cadence: CREDIT_GRANT_CADENCE.ONETIME,
	period_count: 1,
	plan_id: 'plan_1',
	expiration_type: CREDIT_GRANT_EXPIRATION_TYPE.NEVER,
	expiration_duration_unit: CREDIT_GRANT_PERIOD_UNIT.DAYS,
	priority: 0,
	metadata: {},
});

const rateInput = (label: string) => {
	const field = screen.getByText(label).closest('div');
	const inputs = within(field!).getAllByRole('textbox');
	return inputs[1] as HTMLInputElement;
};

describe('CreditGrantModal', () => {
	it('accepts a 5-decimal top-up conversion rate like wallet create', async () => {
		const onSave = vi.fn();
		render(
			<I18nextProvider i18n={testI18n}>
				<CreditGrantModal isOpen onOpenChange={vi.fn()} onSave={onSave} onCancel={vi.fn()} getEmptyCreditGrant={emptyGrant} />
			</I18nextProvider>,
		);

		const conversionInput = rateInput('Conversion Rate');
		fireEvent.change(conversionInput, { target: { value: '0.001' } });
		expect(conversionInput).toHaveValue('0.001');

		const topupInput = rateInput('Top-up Conversion Rate');
		fireEvent.change(topupInput, { target: { value: '0.00108' } });
		expect(topupInput).toHaveValue('0.00108');

		fireEvent.click(screen.getByRole('button', { name: 'Add Credit' }));
		expect(onSave).toHaveBeenCalled();
		expect(onSave.mock.calls[0][0].conversion_rate).toBe(0.001);
		expect(onSave.mock.calls[0][0].topup_conversion_rate).toBe(0.00108);
	});
});
