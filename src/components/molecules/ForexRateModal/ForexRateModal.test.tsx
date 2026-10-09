import { fireEvent, render, screen } from '@testing-library/react';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import { createInstance, type i18n as I18nInstance } from 'i18next';
import settingsEn from '@/i18n/locales/en/settings.json';
import commonEn from '@/i18n/locales/en/common.json';
import ForexRateModal, { type ForexRateModalProps } from './ForexRateModal';

let testI18n: I18nInstance;
beforeAll(async () => {
	const instance = createInstance();
	await instance.use(initReactI18next).init({
		lng: 'en',
		fallbackLng: 'en',
		ns: ['settings', 'common'],
		defaultNS: 'settings',
		resources: { en: { settings: settingsEn, common: commonEn } },
		interpolation: { escapeValue: false },
	});
	testI18n = instance;
});

const d = (day: number) => new Date(Date.UTC(2026, 0, day)).toISOString();

const renderModal = (props: Partial<ForexRateModalProps> = {}) => {
	const onSave = vi.fn();
	render(
		<I18nextProvider i18n={testI18n}>
			<ForexRateModal isOpen onOpenChange={vi.fn()} onSave={onSave} {...props} />
		</I18nextProvider>,
	);
	return { onSave };
};

const typeRate = (value: string) => fireEvent.change(screen.getByPlaceholderText('83.00'), { target: { value } });
const save = () => fireEvent.click(screen.getByRole('button', { name: 'Save' }));

describe('ForexRateModal', () => {
	it('requires a pair and a rate in create mode', () => {
		const { onSave } = renderModal();
		save();
		expect(screen.getByText('Select both currencies.')).toBeInTheDocument();
		expect(screen.getByText('Enter a rate.')).toBeInTheDocument();
		expect(onSave).not.toHaveBeenCalled();
	});

	it('rejects a non-positive rate', () => {
		const { onSave } = renderModal({ lockedFrom: 'usd', lockedTo: 'inr' });
		typeRate('0');
		save();
		expect(screen.getByText('Rate must be a number greater than 0.')).toBeInTheDocument();
		expect(onSave).not.toHaveBeenCalled();
	});

	it('shows a locked pair read-only and saves the typed rate', () => {
		const { onSave } = renderModal({ lockedFrom: 'usd', lockedTo: 'inr' });
		expect(screen.getByText('USD → INR')).toBeInTheDocument();
		typeRate('90');
		expect(screen.getByText('1 USD = 90.00 INR')).toBeInTheDocument();
		save();
		expect(onSave).toHaveBeenCalledWith({ from_currency: 'usd', to_currency: 'inr', rate: '90' });
	});

	it('shows the pair read-only in edit mode', () => {
		renderModal({ data: { from_currency: 'usd', to_currency: 'eur', rate: '0.92' } });
		expect(screen.getByText('USD → EUR')).toBeInTheDocument();
		expect(screen.queryByText('From currency')).not.toBeInTheDocument();
	});

	it('rejects a window whose start is not before its end', () => {
		const { onSave } = renderModal({
			showWindow: true,
			data: { from_currency: 'usd', to_currency: 'inr', rate: '90', start_date: d(5), end_date: d(5) },
		});
		save();
		expect(screen.getByText('Valid from must be before Valid until.')).toBeInTheDocument();
		expect(onSave).not.toHaveBeenCalled();
	});

	it('passes saved dates through to onSave', () => {
		const { onSave } = renderModal({
			showWindow: true,
			data: { from_currency: 'usd', to_currency: 'inr', rate: '90', start_date: d(1), end_date: d(5) },
		});
		save();
		expect(onSave).toHaveBeenCalledWith({ from_currency: 'usd', to_currency: 'inr', rate: '90', start_date: d(1), end_date: d(5) });
	});
});
