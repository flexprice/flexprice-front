import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

export async function initI18n(locale: string, direction: 'ltr' | 'rtl'): Promise<void> {
	const [enAuth, arAuth] = await Promise.all([import('./locales/en/auth.json'), import('./locales/ar/auth.json')]);

	await i18n.use(initReactI18next).init({
		lng: locale,
		fallbackLng: 'en',
		defaultNS: 'auth',
		resources: {
			en: { auth: enAuth.default },
			ar: { auth: arAuth.default },
		},
		interpolation: { escapeValue: false },
	});

	document.documentElement.lang = locale;
	document.documentElement.dir = direction;
}
