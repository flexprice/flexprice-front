// src/brand/types.ts
//
// The contract between the app and a brand pack. A brand pack is a directory with three entry
// points, resolved through the `@brand` alias (see vite.config.ts):
//
//   brand.ts        default export `BrandPack`       — plain data, no React (read before first render)
//   extensions.tsx  default export `BrandExtensions` — slot overrides and extra modules
//   theme.css       token overrides (`--fp-*`, shadcn vars) and @font-face rules
//
// The app ships `src/brand/default/` (Flexprice). A build selects another pack with
// `BRAND_DIR=/path/to/pack`. Pages never branch on the brand; they render a <Slot> or read
// `useBrand()`, and only the fields below are a stable surface.
import type { ComponentType, LazyExoticComponent, ReactNode } from 'react';
import type { RouteObject } from 'react-router';
import type { TFunction } from 'i18next';
import type { Locale } from '@/config/branding';
import type { AuthTab } from '@/pages/auth/authTabs';
import type { AppNavItem } from '@/core/navigation/useAppNav';
import type { RouteNames } from '@/core/routes/Routes';

export type { AppNavItem };

export interface BrandLinks {
	/** Root of the product docs. Every docs link in the app is built on it (see `docsUrl`). */
	docs: string;
	/**
	 * Docs pages this brand serves at a different path, or not at all: app path → brand path.
	 * The app links to Flexprice's docs paths; list only the ones your docs move or drop.
	 */
	docsPaths?: Record<string, string>;
	/** Marketing site. */
	website: string;
	/** "Book a call": command palette, contact dialog, onboarding. Omit to hide. */
	bookCall?: string;
	/** "Join the community": command palette, contact dialog, error page, sign-in banner. Omit to hide. */
	community?: string;
	/** Company page on the error screen. Omit to hide. */
	linkedin?: string;
	/** Where users report bugs, on the error screen. Omit to hide. */
	issues?: string;
}

export interface BrandPack {
	/** Stable identifier, e.g. 'flexprice'. Exposed as `data-brand` on <html> for CSS hooks. */
	id: string;
	/** Product name. Interpolated into copy as `{{brand}}`. */
	name: string;
	/** The name as written in other scripts, by locale, e.g. `{ ar: '…' }`. Falls back to `name`. */
	localizedName?: Partial<Record<string, string>>;
	logo: string;
	/** Optional logo for dark mode. Falls back to `logo`. */
	logoDark?: string;
	favicon: string;
	supportEmail: string;
	/** Fallback for `--brand-primary`; prefer theme.css tokens for real theming. */
	primaryColor: string;
	/** Browser tab title. Defaults to `name`. */
	title?: string;
	links: BrandLinks;
	/** Default UI locale when the user has not picked one. `VITE_DEFAULT_LOCALE` wins. */
	defaultLocale?: Locale;
	/** Primary font family; must be loaded by theme.css. `VITE_FONT_CONFIG` wins. */
	fontFamily?: string;
	/**
	 * Per-namespace translation overrides, deep-merged over the app's own bundles.
	 * Return undefined for namespaces the pack does not touch.
	 */
	loadLocale?: (lng: string, ns: string) => Promise<Record<string, unknown> | undefined>;
}

/** Props each slot receives. A slot override replaces the default rendering entirely. */
export interface SlotProps {
	/**
	 * The frame around every signed-in page: navigation, header, content column. `children` is the
	 * current page; render it once. Default: the sidebar layout. Build it from `@/brand/kit`.
	 */
	'layout.shell': { children: ReactNode };
	/** Login / signup / password pages. Default: the template chosen by VITE_AUTH_CONFIG. */
	'auth.page': { currentTab: AuthTab; switchTab: (tab: AuthTab) => void };
	/**
	 * The panel beside the default sign-in form on large screens (marketing, testimonials).
	 * Default: none, and the form is centred. Flexprice's own pack supplies its landing panel here.
	 */
	'auth.aside': object;
	/** Above the environment selector in the sidebar. Default: nothing. */
	'sidebar.header': { collapsed: boolean };
}

export type SlotName = keyof SlotProps;

type SlotComponent<P> = ComponentType<P> | LazyExoticComponent<ComponentType<P>>;

export type SlotOverrides = { [K in SlotName]?: SlotComponent<SlotProps[K]> };

/** A self-contained feature area the pack adds to the console. */
export interface BrandModule {
	id: string;
	/** Mounted inside the authenticated layout, alongside the app's own routes. */
	routes: RouteObject[];
	/** Navigation entry; a hook so labels can use `useTranslation`. Placed before Integrations. */
	useNavItem?: () => AppNavItem | null;
}

/**
 * Rearranges the app's navigation: regroup, reorder, rename, hide. Receives the full model (app
 * entries plus module entries) and returns the one to render. Helpers: `@/brand/navHelpers`.
 * Runs at render time, but the file defining it loads with the router: import no app modules there.
 */
export type NavTransform = (nav: AppNavItem[], ctx: { t: TFunction; routes: typeof RouteNames }) => AppNavItem[];

export interface BrandExtensions {
	slots?: SlotOverrides;
	modules?: BrandModule[];
	nav?: NavTransform;
	/**
	 * Replace or add whole pages, keyed by absolute path ('/home', '/product-catalog'). An existing
	 * page is swapped in place, keeping its permission guard; a path the app has no page for is
	 * added inside the signed-in layout.
	 */
	pages?: Record<string, ComponentType | LazyExoticComponent<ComponentType>>;
}
