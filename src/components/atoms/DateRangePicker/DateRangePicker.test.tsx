import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeAll } from 'vitest';
import '@testing-library/jest-dom';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import { createInstance } from 'i18next';
import type { i18n as I18nInstance } from 'i18next';
import commonEn from '@/i18n/locales/en/common.json';
import DateRangePicker from './DateRangePicker';

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

const renderPicker = (props: Partial<React.ComponentProps<typeof DateRangePicker>> = {}) =>
	render(
		<I18nextProvider i18n={testI18n}>
			<DateRangePicker onChange={vi.fn()} {...props} />
		</I18nextProvider>,
	);

// A mid-month day in the currently displayed month, so the calendar opens on it.
const midMonth = () => {
	const now = new Date();
	return new Date(now.getFullYear(), now.getMonth(), 15);
};

describe('DateRangePicker', () => {
	// PopoverTrigger renders its own <button>, so wrapping the trigger Button put a
	// button inside a button: invalid HTML, two tab stops, and the popup semantics
	// on the outer element rather than the one that takes focus.
	it('renders no button nested inside another button', () => {
		const { container } = renderPicker({ placeholder: 'Pick a range' });
		expect(container.querySelectorAll('button button')).toHaveLength(0);
	});

	// The aria belongs on the element that takes focus, or a screen-reader user
	// never hears that the control opens anything.
	it('puts the popup semantics on the focusable button', () => {
		const { container } = renderPicker({ placeholder: 'Pick a range' });
		const trigger = container.querySelector('button');
		expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');
	});

	// Callers target the trigger with descendant selectors and widths; both must
	// still land on the outermost box, as they did when it was the trigger button.
	it('keeps popoverTriggerClassName on the outermost box', () => {
		const { container } = renderPicker({ popoverTriggerClassName: 'w-full' });
		expect(container.firstElementChild).toHaveClass('w-full');
	});

	// Clearing moved into the calendar footer; the old absolutely-positioned X over
	// the trigger is gone (it floated detached from the button in table layouts).
	it('renders no overlay clear icon outside the trigger button', () => {
		const day = midMonth();
		const { container } = renderPicker({ startDate: day, endDate: day });
		const svgsOutsideButton = [...container.querySelectorAll('svg')].filter((svg) => !svg.closest('button'));
		expect(svgsOutsideButton).toHaveLength(0);
	});

	it('clears the selection through the footer Clear action', async () => {
		const onChange = vi.fn();
		const day = midMonth();
		const { container } = renderPicker({ startDate: day, endDate: day, onChange });
		const user = userEvent.setup();

		await user.click(container.querySelector('button')!);
		await user.click(await screen.findByRole('button', { name: 'Clear' }));

		expect(onChange).toHaveBeenCalledWith({ startDate: undefined, endDate: undefined });
	});

	it('offers no Clear action while nothing is selected', async () => {
		const { container } = renderPicker({});
		const user = userEvent.setup();

		await user.click(container.querySelector('button')!);
		expect(await screen.findByText(/timezone/i)).toBeInTheDocument();
		expect(screen.queryByRole('button', { name: 'Clear' })).not.toBeInTheDocument();
	});

	// Re-clicking the selected day used to empty the selection (react-day-picker's
	// default); `required` keeps it selected so clearing only happens via Clear.
	it('does not clear the selection when the selected day is clicked again', async () => {
		const onChange = vi.fn();
		const day = midMonth();
		const { container } = renderPicker({ startDate: day, endDate: day, onChange });
		const user = userEvent.setup();

		await user.click(container.querySelector('button')!);
		const selectedDay = document.querySelector('button[aria-selected="true"], [aria-selected="true"] button');
		expect(selectedDay).not.toBeNull();
		await user.click(selectedDay as HTMLElement);

		expect(onChange).not.toHaveBeenCalledWith({ startDate: undefined, endDate: undefined });
	});
});
