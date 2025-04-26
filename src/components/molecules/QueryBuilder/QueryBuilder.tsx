import { FilterField, FilterCondition } from '@/types/common/QueryBuilder';
import { useState, useCallback, useMemo } from 'react';
import SortDropdown, { SortConfig } from './SortDropdown';
import FilterPopover from './FilterPopover';

export enum SortDirection {
	ASC = 'asc',
	DESC = 'desc',
}

export interface SortOption {
	key: string;
	label: string;
	direction?: SortDirection;
}

interface Props {
	fields: FilterField[];
	onFilterChange: (filter: FilterCondition[]) => void;
	filters: FilterCondition[];
	sortOptions?: SortOption[];
	onSortChange?: (sort: SortOption[]) => void;
	selectedSorts?: SortOption[];
}

const QueryBuilder = ({ fields, onFilterChange, filters, sortOptions = [], onSortChange = () => {}, selectedSorts = [] }: Props) => {
	const [filter, setFilter] = useState<FilterCondition[]>(filters);

	const handleSortChange = useCallback(
		(sortConfigs: SortConfig[]) => {
			// Convert all sort configs to SortOptions
			const updatedSorts = sortConfigs
				.map((sortConfig) => {
					const matchedOption = sortOptions.find((option) => option.key === sortConfig.field);
					if (!matchedOption) return null;

					const updatedSort: SortOption = {
						key: matchedOption.key,
						label: matchedOption.label,
						direction: sortConfig.direction as SortDirection,
					};
					return updatedSort;
				})
				.filter((sort): sort is SortOption => sort !== null);

			onSortChange(updatedSorts);
		},
		[sortOptions, onSortChange],
	);

	const handleFilterChange = useCallback(
		(updatedFilters: FilterCondition[]) => {
			setFilter(updatedFilters);
			onFilterChange(updatedFilters);
		},
		[onFilterChange],
	);

	// Transform selectedSorts into the format expected by SortDropdown
	const sortDropdownValue = useMemo(() => {
		return selectedSorts.map((sort) => ({
			field: sort.key,
			direction: (sort.direction || 'asc') as 'asc' | 'desc',
		}));
	}, [selectedSorts]);

	return (
		<div className='flex flex-wrap items-center gap-3'>
			{/* Filter options */}
			{fields.length > 0 && <FilterPopover fields={fields} value={filter} onChange={handleFilterChange} />}

			{/* Sort options */}
			{sortOptions.length > 0 && selectedSorts && (
				<SortDropdown
					options={sortOptions.map((opt) => ({ key: opt.key, label: opt.label }))}
					value={sortDropdownValue}
					onChange={handleSortChange}
				/>
			)}
		</div>
	);
};

export default QueryBuilder;
