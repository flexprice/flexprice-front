import { useMemo } from 'react';
import { isCustomerOrgTypeFilterEnabled } from '@/config/customerOrgTypeFilter';
import useUser from '@/hooks/useUser';

export default function useCustomerOrgTypeFilterEnabled(): boolean {
	const { user } = useUser();
	return useMemo(() => isCustomerOrgTypeFilterEnabled(user?.tenant?.id), [user?.tenant?.id]);
}
