import { FilterCondition } from '@/types/common/QueryBuilder';
import { SortOption } from '@/types/common/QueryBuilder';
import { convertFiltersAndSortToBackendPayload } from '@/types/formatters/QueryBuilder';
import { debounce } from 'lodash';
import { useEffect, useMemo, useState } from 'react';

interface Props {
	initialFilters?: FilterCondition[];
	initialSorts?: SortOption[];
	debounceTime?: number;
	onFilterChange?: (filters: FilterCondition[]) => void;
	onSortChange?: (sorts: SortOption[]) => void;
}

const useFilterSorting = ({ initialFilters = [], initialSorts = [], debounceTime = 300, onFilterChange, onSortChange }: Props) => {
	const [filters, setFilters] = useState<FilterCondition[]>(initialFilters);
	const [sorts, setSorts] = useState<SortOption[]>(initialSorts);

	const debouncedFilterChange = useMemo(
		() =>
			debounce((filters: FilterCondition[]) => {
				onFilterChange?.(filters);
			}, debounceTime),
		[onFilterChange, debounceTime],
	);

	const debouncedSortChange = useMemo(
		() =>
			debounce((sorts: SortOption[]) => {
				onSortChange?.(sorts);
			}, debounceTime),
		[onSortChange, debounceTime],
	);

	useEffect(() => {
		debouncedFilterChange(filters);
		debouncedSortChange(sorts);
		return () => {
			debouncedFilterChange.cancel();
			debouncedSortChange.cancel();
		};
	}, [filters, sorts]);

	const sanitizedValues = useMemo(() => convertFiltersAndSortToBackendPayload(filters, sorts), [filters, sorts]);

	return {
		filters,
		sorts,
		setFilters,
		setSorts,
		sanitizedFilters: sanitizedValues.filters,
		sanitizedSorts: sanitizedValues.sorts,
	};
};

export default useFilterSorting;
