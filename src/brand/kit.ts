// src/brand/kit.ts
//
// The building blocks a brand pack's layouts and pages use. Import from here rather than from the
// app's internals: this file is the supported surface and changes to it are called out in release
// notes, while everything behind it may move between versions.
import { useCallback } from 'react';
import useUser from '@/hooks/useUser';
import AuthService from '@/core/auth/AuthService';
import { useBreadcrumbs } from '@/hooks/useBreadcrumbs';
import { useBreadcrumbsStore, type BreadcrumbItem } from '@/store/useBreadcrumbsStore';
import type { AppNavItem } from '@/core/navigation/useAppNav';

// ── Navigation ───────────────────────────────────────────────────────────────
export { useAppNav, findActiveNav } from '@/core/navigation/useAppNav';
export type { AppNavItem };

export { findNavItem, removeNavItems, navIds } from './navHelpers';

// ── Session ──────────────────────────────────────────────────────────────────
/** The signed-in user and a logout action. */
export function useSession() {
	const { user, loading } = useUser();
	const logout = useCallback(() => AuthService.logout(), []);
	return { user, loading, logout };
}

// ── Environment, theme, language ─────────────────────────────────────────────
export { useEnvironmentSwitcher } from '@/hooks/useEnvironmentSwitcher';
export { useThemeStore } from '@/store/useThemeStore';
export { default as ThemeToggle } from '@/components/molecules/ThemeToggle';
export { useLocaleStore } from '@/store/useLocaleStore';
export { LOCALE_LABELS } from '@/components/molecules/LocaleSelector/LocaleSelector';
export { Direction } from '@/config/branding';

// ── Page chrome ──────────────────────────────────────────────────────────────
/** The current page's breadcrumb trail. Call once, in the shell. */
export function useBreadcrumbTrail(): { breadcrumbs: BreadcrumbItem[]; isLoading: boolean } {
	useBreadcrumbs();
	const breadcrumbs = useBreadcrumbsStore((s) => s.breadcrumbs);
	const isLoading = useBreadcrumbsStore((s) => s.isLoading);
	return { breadcrumbs, isLoading };
}

export { default as RestrictedEnvBanner } from '@/components/molecules/RestrictedEnvBanner';

const COMMAND_PALETTE_EVENT = 'open-command-palette';
/** Opens the Cmd+K command palette. */
export const openCommandPalette = () => window.dispatchEvent(new CustomEvent(COMMAND_PALETTE_EVENT));

// ── Brand ────────────────────────────────────────────────────────────────────
export { useBrand } from '@/config/branding';
export { RouteNames } from '@/core/routes/Routes';
