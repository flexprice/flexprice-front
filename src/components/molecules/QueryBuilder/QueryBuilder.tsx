import { FilterField, FilterCondition } from '@/types/common/QueryBuilder';
import { useState, useCallback, useMemo, useEffect } from 'react';
import { debounce } from 'lodash';
import { FilterPopover, SortDropdown } from '@/components/molecules';
import { SortOption, SortDirection } from '@/components/molecules/QueryBuilder/SortDropdown';
interface Props {
	// Filter options
	filterOptions: FilterField[];
	onFilterChange: (filter: FilterCondition[]) => void;
	filters: FilterCondition[];

	// Sort options
	sortOptions?: SortOption[];
	onSortChange?: (sort: SortOption[]) => void;
	selectedSorts?: SortOption[];

	// debounce time for the filter and sort changes
	// default is 500ms
	// give time in milliseconds
	debounceTime?: number;
}

const QueryBuilder = ({
	filterOptions: fields,
	onFilterChange,
	filters,
	sortOptions = [],
	onSortChange = () => {},
	selectedSorts = [],
	debounceTime = 500,
}: Props) => {
	const [filter, setFilter] = useState<FilterCondition[]>(filters);
	const [localSorts, setLocalSorts] = useState<SortOption[]>(selectedSorts);

	// Create debounced handlers using useCallback to maintain reference stability
	const debouncedFilterChange = useMemo(
		() =>
			debounce((filters: FilterCondition[]) => {
				onFilterChange(filters);
			}, debounceTime),
		[onFilterChange, debounceTime],
	);

	const debouncedSortChange = useMemo(
		() =>
			debounce((sorts: SortOption[]) => {
				onSortChange(sorts);
			}, debounceTime),
		[onSortChange, debounceTime],
	);

	// Cleanup debounced functions on unmount
	useEffect(() => {
		return () => {
			debouncedFilterChange.cancel();
			debouncedSortChange.cancel();
		};
	}, [debouncedFilterChange, debouncedSortChange]);

	// Update local state when props change
	useEffect(() => {
		setFilter(filters);
	}, [filters]);

	useEffect(() => {
		setLocalSorts(selectedSorts);
	}, [selectedSorts]);

	// Sort options
	const handleSortChange = useCallback(
		(sortConfigs: SortOption[]) => {
			// Convert all sort configs to SortOptions
			const updatedSorts = sortConfigs
				.map((sortConfig) => {
					const matchedOption = sortOptions.find((option) => option.field === sortConfig.field);
					if (!matchedOption) return null;

					const updatedSort: SortOption = {
						field: matchedOption.field,
						label: matchedOption.label,
						direction: sortConfig.direction,
					};
					return updatedSort;
				})
				.filter((sort): sort is SortOption => sort !== null);

			setLocalSorts(updatedSorts);
			debouncedSortChange(updatedSorts);
		},
		[sortOptions, debouncedSortChange],
	);

	const handleFilterChange = useCallback(
		(updatedFilters: FilterCondition[]) => {
			setFilter(updatedFilters);
			debouncedFilterChange(updatedFilters);
		},
		[debouncedFilterChange],
	);

	// Transform selectedSorts into the format expected by SortDropdown
	const sortDropdownValue = useMemo(() => {
		return localSorts.map((sort) => ({
			field: sort.field,
			direction: (sort.direction || SortDirection.ASC) as SortDirection,
			label: sort.label,
		}));
	}, [localSorts]);

	return (
		<div className='flex flex-wrap items-center gap-3'>
			{/* Filter options */}
			{fields.length > 0 && <FilterPopover fields={fields} value={filter} onChange={handleFilterChange} />}

			{/* Sort options */}
			{sortOptions.length > 0 && selectedSorts && (
				<SortDropdown options={sortOptions} value={sortDropdownValue} onChange={handleSortChange} />
			)}
		</div>
	);
};

export default QueryBuilder;
