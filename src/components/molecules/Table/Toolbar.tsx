import { Button, Input } from '@/components/atoms';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ArrowUpDown, Search } from 'lucide-react';
import { ReactNode } from 'react';

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

const Toolbar = ({ config, filters, onFilterChange }: ToolbarProps) => {
	const { searchPlaceholder = 'Search', enableSearch = true, sortOptions = [] } = config;

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
				{/* Filters Popover */}
				{/* <Popover>
					<PopoverTrigger disabled asChild>
						<Button variant='outline' size='xs' className='text-gray-700 hover:bg-gray-50 border-gray-300'>
							<ListFilter className='w-4 h-4 mr-2 text-gray-500' />
							Filter
						</Button>
					</PopoverTrigger>
					<PopoverContent className='p-0 bg-white shadow-2xl rounded-xl border-none' align='start'></PopoverContent>
				</Popover> */}

				{/* Sort Popover */}
				{sortOptions.length > 0 && (
					<Popover>
						<PopoverTrigger disabled asChild>
							<Button variant='outline' size='xs' className='text-gray-700 hover:bg-gray-50 border-gray-300'>
								<ArrowUpDown className='w-4 h-4 mr-2 text-gray-500' />
								Sort
							</Button>
						</PopoverTrigger>
						<PopoverContent className='w-48 bg-white shadow-2xl rounded-xl border-none p-2' align='start'>
							<div className='space-y-1'>
								{sortOptions.map((sort) => (
									<Button
										size='xs'
										key={sort.key}
										variant={filters.sortBy === sort.key ? 'secondary' : 'ghost'}
										className='w-full justify-start text-gray-700 
                                            hover:bg-gray-100 
                                            data-[state=open]:bg-gray-100'
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
						suffix={<Search className='size-[14px] text-gray-500' />}
						placeholder={searchPlaceholder}
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
