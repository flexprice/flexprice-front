import { createContext, useContext, useEffect, useState, FC, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import CustomerPortalApi from '@/api/CustomerPortalApi';
import { PortalConfig, DEFAULT_PORTAL_CONFIG } from '@/types/dto/PortalConfig';
import { isColorDark, portalTokenOverrides, PORTAL_TOKEN_NAMES } from '@/components/customer-portal/portalTheme';

interface PortalConfigContextProps {
	config: PortalConfig;
	isLoading: boolean;
}

const PortalConfigContext = createContext<PortalConfigContextProps | undefined>(undefined);

interface PortalConfigProviderProps {
	token: string;
	children: ReactNode;
}

/** Returns true if the hex color has low perceived luminance (i.e. is "dark"). */
/**
 * Fetches and provides the resolved PortalConfig for the current tenant.
 * Also injects theme CSS variables onto document.documentElement, and
 * cleans them up on unmount (prevents leaking into the main app).
 *
 * Auto-derives text colors from background brightness so tenants only
 * need to supply 4 brand colors.
 */
export const PortalConfigProvider: FC<PortalConfigProviderProps> = ({ token, children }) => {
	const [config, setConfig] = useState<PortalConfig>(DEFAULT_PORTAL_CONFIG);

	const { data, isLoading } = useQuery<PortalConfig>({
		queryKey: ['portal-config', token],
		queryFn: () => CustomerPortalApi.getConfig(),
		enabled: !!token,
		staleTime: 5 * 60 * 1000, // 5 minutes — config rarely changes mid-session
		gcTime: 0,
		retry: false, // getConfig() already falls back internally, no need to retry
	});

	// Apply resolved config when it arrives
	useEffect(() => {
		if (data) {
			setConfig(data);
		}
	}, [data]);

	// Inject theme CSS variables — cleanup on unmount
	useEffect(() => {
		const { theme } = config;
		const root = document.documentElement;

		// The app's design tokens are written on every render, themed or not: portal
		// components style through them with ordinary utility classes, so an unthemed
		// portal still needs its own greys rather than the dashboard's. See portalTheme.
		const tokens = portalTokenOverrides(theme);
		Object.entries(tokens).forEach(([name, value]) => root.style.setProperty(name, value));

		// Guard each value: only write the var if the string is non-empty.
		// An empty field must NOT override the CSS fallback values.
		const set = (varName: string, value?: string) => {
			if (value) root.style.setProperty(varName, value);
		};

		// --portal-* stays for the handful of places that need the tenant's accent
		// directly, and for the chart molecule's grid colour.
		set('--portal-primary', theme?.primary_color);
		set('--portal-font', theme?.font_family);

		if (theme?.background_color) {
			const dark = isColorDark(theme.background_color);
			root.style.setProperty('--portal-chart-grid', dark ? 'rgba(255,255,255,0.06)' : 'rgba(243,244,246,0.8)');
		}

		return () => {
			PORTAL_TOKEN_NAMES.forEach((name) => root.style.removeProperty(name));
			root.style.removeProperty('--portal-primary');
			root.style.removeProperty('--portal-font');
			root.style.removeProperty('--portal-chart-grid');
		};
	}, [config.theme]);

	const value: PortalConfigContextProps = {
		config,
		isLoading,
	};

	return <PortalConfigContext.Provider value={value}>{children}</PortalConfigContext.Provider>;
};

export const usePortalConfig = (): PortalConfigContextProps => {
	const context = useContext(PortalConfigContext);
	if (!context) {
		throw new Error('usePortalConfig must be used within a PortalConfigProvider');
	}
	return context;
};
