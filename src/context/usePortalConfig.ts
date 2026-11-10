import { createContext, useContext } from 'react';
import type { PortalConfig } from '@/types/dto/PortalConfig';

export interface PortalConfigContextProps {
	config: PortalConfig;
	isLoading: boolean;
}

export const PortalConfigContext = createContext<PortalConfigContextProps | undefined>(undefined);

export const usePortalConfig = (): PortalConfigContextProps => {
	const context = useContext(PortalConfigContext);
	if (!context) {
		throw new Error('usePortalConfig must be used within a PortalConfigProvider');
	}
	return context;
};
