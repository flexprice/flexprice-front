import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import resourcesToBackend from 'i18next-resources-to-backend';
import { Direction, brandConfig } from '@/config/branding';
import brandPack from '@brand/brand';

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
] as const;

export type Namespace = (typeof NAMESPACES)[number];

type Bundle = Record<string, unknown>;

function isPlainObject(v: unknown): v is Bundle {
	return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/** Deep-merges `over` into `base`; the brand pack's strings win, untouched keys stay the app's. */
export function mergeBundles(base: Bundle, over: Bundle): Bundle {
	const out: Bundle = { ...base };
	for (const [key, value] of Object.entries(over)) {
		out[key] = isPlainObject(value) && isPlainObject(base[key]) ? mergeBundles(base[key] as Bundle, value) : value;
	}
	return out;
}

async function loadBundle(language: string, namespace: string): Promise<Bundle> {
	const base = ((await import(`./locales/${language}/${namespace}.json`)) as { default: Bundle }).default;
	const over = await brandPack.loadLocale?.(language, namespace).catch((err) => {
		console.error(`[i18n] brand override failed for ${language}/${namespace}:`, err);
		return undefined;
	});
	return over ? mergeBundles(base, over) : base;
}

/** `{{brand}}` for a language: an env-level rename wins, then the pack's localized name, then its name. */
export function brandNameFor(language: string): string {
	if (brandConfig.name !== brandPack.name) return brandConfig.name;
	return brandPack.localizedName?.[language] ?? brandPack.localizedName?.[language.split('-')[0]] ?? brandPack.name;
}

export async function initI18n(locale: string, direction: Direction): Promise<void> {
	if (i18n.isInitialized) {
		await i18n.changeLanguage(locale);
		document.documentElement.lang = locale;
		document.documentElement.dir = direction;
		return;
	}

	try {
		await i18n
			.use(resourcesToBackend(loadBundle))
			.use(initReactI18next)
			.init({
				lng: locale,
				fallbackLng: 'en',
				defaultNS: 'common',
				ns: NAMESPACES,
				partialBundledLanguages: true,
				// `{{brand}}` resolves in every string without each call site passing it.
				interpolation: { escapeValue: false, defaultVariables: { brand: brandNameFor(locale) } },
			});
		i18n.on('languageChanged', (lng) => {
			i18n.options.interpolation = { ...i18n.options.interpolation, defaultVariables: { brand: brandNameFor(lng) } };
		});
	} catch (err) {
		console.error('[i18n] Initialization failed:', err);
		throw err;
	}

	document.documentElement.lang = locale;
	document.documentElement.dir = direction;
}
