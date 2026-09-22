import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeAll } from 'vitest';
import '@testing-library/jest-dom';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import { createInstance } from 'i18next';
import type { i18n as I18nInstance } from 'i18next';
import LineItemGroupingSection from './LineItemGroupingSection';
import customersEn from '@/i18n/locales/en/customers.json';

// Real English catalogue so the copy under test is what we actually ship.
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
			<LineItemGroupingSection checked={false} onChange={onChange} {...props} />
		</I18nextProvider>,
	);
	return { onChange };
};

describe('LineItemGroupingSection', () => {
	it('states the default behaviour and that the total is unaffected', () => {
		renderSection();
		expect(screen.getByText('By default each charge period is its own line item. The total is the same either way.')).toBeInTheDocument();
	});

	it('reports toggle changes to the parent', async () => {
		const { onChange } = renderSection();
		await userEvent.click(screen.getByRole('switch'));
		expect(onChange).toHaveBeenCalledWith(true);
	});

	it('associates the label with the switch, so clicking the text toggles it', async () => {
		const { onChange } = renderSection();
		await userEvent.click(screen.getByText('Combine into one line item per invoice'));
		expect(onChange).toHaveBeenCalledWith(true);
	});

	it('reflects the checked state on the switch', () => {
		renderSection({ checked: true });
		expect(screen.getByRole('switch')).toBeChecked();
	});

	it('renders bare in the default trailing variant, so the host section owns the heading', () => {
		renderSection();
		expect(screen.queryByText('Invoice line items')).not.toBeInTheDocument();
	});

	it('carries its own heading in the standalone section variant', () => {
		renderSection({ variant: 'section' });
		expect(screen.getByText('Invoice line items')).toBeInTheDocument();
	});

	it('shows the overage caveat only when the subscription carries a commitment', () => {
		const { unmount } = render(
			<I18nextProvider i18n={testI18n}>
				<LineItemGroupingSection checked={false} onChange={vi.fn()} />
			</I18nextProvider>,
		);
		expect(screen.queryByText(/Overage rows from cumulative commitments/)).not.toBeInTheDocument();
		unmount();

		renderSection({ showOverageNote: true });
		expect(screen.getByText('Overage rows from cumulative commitments stay separate.')).toBeInTheDocument();
	});
});
