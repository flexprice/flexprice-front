import { createContext, useContext, useEffect, FC, ReactNode } from 'react';
import { config, BrandConfig } from '@/config/config';

const BrandContext = createContext<BrandConfig>(config.brand);

export const BrandProvider: FC<{ children: ReactNode }> = ({ children }) => {
	useEffect(() => {
		document.documentElement.style.setProperty('--brand-primary', config.brand.primaryColor);

		const faviconEl = document.getElementById('app-favicon') as HTMLLinkElement | null;
		if (faviconEl) {
			faviconEl.href = config.brand.favicon;
		}
	}, []);

	return <BrandContext.Provider value={config.brand}>{children}</BrandContext.Provider>;
};

export function useBrand(): BrandConfig {
	return useContext(BrandContext);
}
