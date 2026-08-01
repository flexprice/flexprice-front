import { Button, Input } from '@/components/atoms';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ArrowUpDown, Search } from 'lucide-react';
import { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

// Define more comprehensive filter and configuration types
export interface FilterOption {
	key: string;
	label: string;
	type: 'select' | 'input' | 'checkbox';
	options?: string[]; // for select type
}

export interface SortOption {
	key: string;
	label: string;
	direction?: 'asc' | 'desc';
}

export interface ToolbarConfig {
	searchPlaceholder?: string;
	enableSearch?: boolean;
	filters?: FilterOption[];
	sortOptions?: SortOption[];
	customActions?: ReactNode[];
}

export interface FilterState {
	searchQuery: string;
	sortBy?: string;
	sortDirection?: 'asc' | 'desc';
}

interface ToolbarProps {
	config: ToolbarConfig;
	filters: FilterState;
	onFilterChange: (filterState: Partial<FilterState>) => void;
}

// TODO: Deprecate this component and use QueryBuilder instead
const Toolbar = ({ config, filters, onFilterChange }: ToolbarProps) => {
	const { t } = useTranslation('common');
	const { searchPlaceholder, enableSearch = true, sortOptions = [] } = config;
	const resolvedPlaceholder = searchPlaceholder ?? t('actions.search');

	const handleSortChange = (sortKey: string) => {
		const currentSort = filters.sortBy === sortKey ? (filters.sortDirection === 'asc' ? 'desc' : 'asc') : 'asc';

		onFilterChange({
			sortBy: sortKey,
			sortDirection: currentSort,
		});
	};

	return (
		<div className='flex justify-between items-center mt-4 mb-2'>
			<div className='flex items-center gap-2'>
				{/* Sort Popover */}
				{sortOptions.length > 0 && (
					<Popover>
						<PopoverTrigger disabled asChild>
							<Button variant='outline' size='xs' className='text-content-secondary hover:bg-surface-subtle border-line-strong'>
								<ArrowUpDown className='w-4 h-4 me-2 text-content-muted' />
								{t('labels.sort')}
							</Button>
						</PopoverTrigger>
						<PopoverContent className='w-48 bg-surface shadow-2xl rounded-xl border-none p-2' align='start'>
							<div className='space-y-1'>
								{sortOptions.map((sort) => (
									<Button
										size='xs'
										key={sort.key}
										variant={filters.sortBy === sort.key ? 'secondary' : 'ghost'}
										className='w-full justify-start text-content-secondary
                                            hover:bg-surface-shell
                                            data-[state=open]:bg-surface-shell'
										onClick={() => handleSortChange(sort.key)}>
										{sort.label}
										{filters.sortBy === sort.key && (filters.sortDirection === 'asc' ? ' ↑' : ' ↓')}
									</Button>
								))}
							</div>
						</PopoverContent>
					</Popover>
				)}
			</div>

			{/* Search on right */}
			{enableSearch && (
				<div className='w-1/2'>
					<Input
						suffix={<Search className='size-[14px] text-content-muted' />}
						placeholder={resolvedPlaceholder}
						value={filters.searchQuery}
						onChange={(e) => onFilterChange({ searchQuery: e })}
						size='xs'
					/>
				</div>
			)}
		</div>
	);
};

export default Toolbar;
