import 'tailwindcss/tailwind.css';
import React from 'react';
import type { Preview } from '@storybook/react';
import { createInstance } from 'i18next';
import { initReactI18next, I18nextProvider } from 'react-i18next';
import commonEn from '../src/i18n/locales/en/common.json';

const storybookI18n = createInstance();
storybookI18n.use(initReactI18next).init({
	lng: 'en',
	fallbackLng: 'en',
	defaultNS: 'common',
	ns: ['common'],
	resources: {
		en: {
			common: commonEn,
		},
	},
	interpolation: {
		escapeValue: false,
	},
	initImmediate: false,
});

const preview: Preview = {
	decorators: [(Story) => React.createElement(I18nextProvider, { i18n: storybookI18n }, React.createElement(Story))],
	parameters: {
		controls: {
			matchers: {
				color: /(background|color)$/i,
				date: /Date$/i,
			},
		},
	},
};

export default preview;
