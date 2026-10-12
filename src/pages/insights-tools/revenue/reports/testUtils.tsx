import { ReactElement } from 'react';
import { render } from '@testing-library/react';
import { createInstance } from 'i18next';
import { I18nextProvider } from 'react-i18next';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import enSettings from '@/i18n/locales/en/settings.json';

export const renderWithProviders = (ui: ReactElement) => {
	const i18n = createInstance();
	i18n.init({ lng: 'en', fallbackLng: 'en', ns: ['settings'], defaultNS: 'settings', resources: { en: { settings: enSettings } } });
	const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
	return render(
		<QueryClientProvider client={client}>
			<I18nextProvider i18n={i18n}>{ui}</I18nextProvider>
		</QueryClientProvider>,
	);
};
