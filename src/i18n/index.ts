import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { Direction } from '@/config/branding';

export async function initI18n(locale: string, direction: Direction): Promise<void> {
	if (i18n.isInitialized) {
		await i18n.changeLanguage(locale);
		document.documentElement.lang = locale;
		document.documentElement.dir = direction;
		return;
	}

	const [enAuth, arAuth] = await Promise.all([import('./locales/en/auth.json'), import('./locales/ar/auth.json')]);

	try {
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
	} catch (err) {
		console.error('[i18n] Initialization failed:', err);
		throw err;
	}

	document.documentElement.lang = locale;
	document.documentElement.dir = direction;
}
