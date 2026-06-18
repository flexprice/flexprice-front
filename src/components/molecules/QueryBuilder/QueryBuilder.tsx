import { FilterField, FilterCondition, SortOption, SortDirection } from '@/types/common/QueryBuilder';
import { useState, useCallback, useMemo, useEffect, type ReactNode } from 'react';
import { debounce } from 'lodash';
import { cn } from '@/lib/utils';
import { FilterPopover, SortDropdown } from '@/components/molecules';

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

	/** When provided, the filter popover shows a "Property filters" section (key/value rows) below the filter list. */
	propertyFiltersConfig?: {
		rows: { id: string; key: string; value: string }[];
		setRows: React.Dispatch<React.SetStateAction<{ id: string; key: string; value: string }[]>>;
		createEmpty: () => { id: string; key: string; value: string };
	};
	/** Called when "Reset filters" is clicked in the popover (optional; property filters are cleared automatically when propertyFiltersConfig is provided). */
	onFilterPopoverReset?: () => void;

	/** Toolbar content rendered to the right of filter + sort controls (e.g. quick filters). */
	prepend?: ReactNode;
	/** Metadata keys managed outside the filter popover (e.g. quick filters). */
	reservedMetadataKeys?: string[];
	/** Trailing toolbar content (e.g. count label, CTAs); rendered flush right on wide layouts. */
	children?: ReactNode;
}

const QueryBuilder = ({
	filterOptions: fields,
	onFilterChange,
	filters,
	sortOptions = [],
	onSortChange = () => {},
	selectedSorts = [],
	debounceTime = 500,
	prepend,
	reservedMetadataKeys,
	children,
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

	// add string filter to the filter array if filterconsitions are empty

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

	const hasTrailing = children != null && children !== false;
	const hasPrepend = prepend != null && prepend !== false;

	return (
		<div className={hasTrailing ? 'flex flex-wrap items-center justify-between gap-3 mb-5' : 'flex flex-wrap items-center gap-3 mb-5'}>
			<div className={cn('flex flex-wrap items-center gap-3 min-w-0', hasPrepend && 'flex-1 justify-between')}>
				<div className='flex flex-wrap items-center gap-3'>
					{fields.length > 0 && (
						<FilterPopover fields={fields} value={filter} onChange={handleFilterChange} reservedMetadataKeys={reservedMetadataKeys} />
					)}

					{sortOptions.length > 0 && selectedSorts && (
						<SortDropdown options={sortOptions} value={sortDropdownValue} onChange={handleSortChange} />
					)}
				</div>
				{prepend}
			</div>

			{hasTrailing ? <div className='flex flex-wrap items-center gap-3 shrink-0'>{children}</div> : null}
		</div>
	);
};

export default QueryBuilder;
