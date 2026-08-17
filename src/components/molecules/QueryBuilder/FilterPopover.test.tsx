import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, beforeAll } from 'vitest';
import { I18nextProvider } from 'react-i18next';
import { createInstance } from 'i18next';
import type { i18n as I18nInstance } from 'i18next';
import { initReactI18next } from 'react-i18next';
import commonEn from '@/i18n/locales/en/common.json';
import FilterPopover from './FilterPopover';
import { DataType, FilterFieldType, FilterOperator } from '@/types/common/QueryBuilder';

let testI18n: I18nInstance;

beforeAll(async () => {
	const instance = createInstance();
	await instance.use(initReactI18next).init({
		lng: 'en',
		fallbackLng: 'en',
		resources: { en: { common: commonEn } },
		ns: ['common'],
		defaultNS: 'common',
		interpolation: { escapeValue: false },
	});
	testI18n = instance;
});

const fields = [
	{
		field: 'status',
		label: 'Status',
		fieldType: FilterFieldType.INPUT,
		operators: [FilterOperator.EQUAL],
		dataType: DataType.STRING,
	},
];

describe('FilterPopover icon trigger', () => {
	it('opens the filter panel so a filter can be added', async () => {
		const user = userEvent.setup();
		render(
			<I18nextProvider i18n={testI18n}>
				<FilterPopover fields={fields} value={[]} onChange={() => {}} variant='icon' />
			</I18nextProvider>,
		);

		await user.click(screen.getByRole('button', { name: 'Filter' }));
		expect(await screen.findByText('No filters applied')).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Add filter' })).toBeInTheDocument();
	});
});
