import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeAll } from 'vitest';
import '@testing-library/jest-dom';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import { createInstance } from 'i18next';
import type { i18n as I18nInstance } from 'i18next';
import commonEn from '@/i18n/locales/en/common.json';
import ForceRunDrawer from './ForceRunDrawer';

let testI18n: I18nInstance;

beforeAll(async () => {
	const instance = createInstance();
	await instance.use(initReactI18next).init({
		lng: 'en',
		fallbackLng: 'en',
		ns: ['common'],
		defaultNS: 'common',
		resources: { en: { common: commonEn } },
		interpolation: { escapeValue: false },
	});
	testI18n = instance;
});

const TestWrapper = ({ children }: { children: React.ReactNode }) => <I18nextProvider i18n={testI18n}>{children}</I18nextProvider>;

function renderDrawer() {
	return render(
		<TestWrapper>
			<ForceRunDrawer isOpen onOpenChange={vi.fn()} onConfirm={vi.fn()} />
		</TestWrapper>,
	);
}

describe('ForceRunDrawer date picker', () => {
	it('opens the calendar when Start Time is clicked after selecting a custom date range', () => {
		renderDrawer();

		fireEvent.click(screen.getByLabelText(commonEn.forceRun.customDateRange));
		fireEvent.click(screen.getByRole('button', { name: commonEn.forceRun.startTimePlaceholder }));

		expect(screen.getByRole('grid')).toBeInTheDocument();
	});

	it('keeps the custom range fields after picking a day in the calendar', () => {
		renderDrawer();

		fireEvent.click(screen.getByLabelText(commonEn.forceRun.customDateRange));
		fireEvent.click(screen.getByRole('button', { name: commonEn.forceRun.startTimePlaceholder }));
		fireEvent.click(screen.getByRole('gridcell', { name: '15' }));

		expect(screen.getByRole('dialog', { name: commonEn.forceRun.title })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: commonEn.forceRun.endTimePlaceholder })).toBeInTheDocument();
	});
});
