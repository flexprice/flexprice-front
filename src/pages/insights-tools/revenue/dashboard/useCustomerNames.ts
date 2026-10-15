import { useQuery } from '@tanstack/react-query';
import CustomerApi from '@/api/CustomerApi';
import { OTHER_KEY } from './revenueMath';

// Reports return customer ids only.
export const useCustomerNames = (ids: string[]): Record<string, string> => {
	const sorted = [...new Set(ids.filter((id) => id && id !== OTHER_KEY))].sort();
	const { data } = useQuery({
		queryKey: ['customer-names', sorted],
		queryFn: () => CustomerApi.getCustomersByFilters({ customer_ids: sorted, limit: sorted.length, offset: 0 }),
		enabled: sorted.length > 0,
		staleTime: 5 * 60 * 1000,
	});
	return Object.fromEntries((data?.items ?? []).filter((c) => c.name).map((c) => [c.id, c.name]));
};
