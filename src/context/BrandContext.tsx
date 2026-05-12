import { createContext, useContext, useEffect, FC, ReactNode } from 'react';
import { config, BrandConfig } from '@/config/config';

const BrandContext = createContext<BrandConfig | undefined>(undefined);

export const BrandProvider: FC<{ children: ReactNode }> = ({ children }) => {
	useEffect(() => {
		document.documentElement.style.setProperty('--brand-primary', config.brand.primaryColor);

		const faviconEl = document.getElementById('app-favicon') as HTMLLinkElement | null;
		if (faviconEl) {
			faviconEl.href = config.brand.favicon;
		}

		return () => {
			document.documentElement.style.removeProperty('--brand-primary');
		};
	}, []);

	return <BrandContext.Provider value={config.brand}>{children}</BrandContext.Provider>;
};

export function useBrand(): BrandConfig {
	const context = useContext(BrandContext);
	if (!context) {
		throw new Error('useBrand must be used within a BrandProvider');
	}
	return context;
}
