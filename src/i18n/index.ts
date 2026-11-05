import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import resourcesToBackend from 'i18next-resources-to-backend';
import { Direction } from '@/config/branding';

export const NAMESPACES = [
	'auth',
	'common',
	'billing',
	'catalog',
	'customers',
	'developers',
	'settings',
	'customer-portal',
	'guides',
	'activity',
] as const;

export type Namespace = (typeof NAMESPACES)[number];

export async function initI18n(locale: string, direction: Direction): Promise<void> {
	if (i18n.isInitialized) {
		await i18n.changeLanguage(locale);
		document.documentElement.lang = locale;
		document.documentElement.dir = direction;
		return;
	}

	try {
		await i18n
			.use(resourcesToBackend((language: string, namespace: string) => import(`./locales/${language}/${namespace}.json`)))
			.use(initReactI18next)
			.init({
				lng: locale,
				fallbackLng: 'en',
				defaultNS: 'common',
				ns: NAMESPACES,
				partialBundledLanguages: true,
				interpolation: { escapeValue: false },
			});
	} catch (err) {
		console.error('[i18n] Initialization failed:', err);
		throw err;
	}

	document.documentElement.lang = locale;
	document.documentElement.dir = direction;
}
