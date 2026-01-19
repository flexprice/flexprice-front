import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Sortable, SortableContent, SortableItem, SortableItemHandle, SortableOverlay } from '@/components/ui/sortable';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ArrowUpDown, GripVertical, Trash2, X } from 'lucide-react';
import { useState, useMemo } from 'react';
import { Combobox, Button, Select } from '@/components/atoms';
import { SortOption, SortDirection } from '@/types/common/QueryBuilder';
import { sanitizeSortConditions } from '@/types/formatters/QueryBuilder';
interface Props {
	options: SortOption[];
	value: SortOption[];
	onChange: (value: SortOption[]) => void;
	className?: string;
	maxSorts?: number;
	disabled?: boolean;
}

const MIN_POPOVER_WIDTH = 400;
const MIN_FIELD_WIDTH = 160;
const MIN_DIRECTION_WIDTH = 100;
const POPOVER_PADDING = 'px-3 py-2';
const GRID_GAP = 'gap-2';
const ITEM_PADDING = 'py-2 px-2';

const SortDropdown: React.FC<Props> = ({ options, value = [], onChange, className, disabled = false, maxSorts = 10 }) => {
	const [isOpen, setIsOpen] = useState(false);
	const allFieldsAdded = useMemo(() => {
		const usedFields = new Set(value.map((v) => v.field));
		return usedFields.size >= options.length;
	}, [value, options]);

	const handleSortAdd = () => {
		if (value.length >= maxSorts) return;

		// Find first unused option
		const usedFields = new Set(value.map((v) => v.field));
		const firstAvailable = options.find((opt) => !usedFields.has(opt.field));

		if (firstAvailable) {
			const newSort: SortOption = {
				field: firstAvailable.field,
				label: firstAvailable.label,
				direction: SortDirection.ASC,
			};
			const newValue = [...value, newSort];
			onChange(newValue);
			setIsOpen(true);
		}
	};

	const handleSortRemove = (index: number) => {
		const newValue = [...value];
		newValue.splice(index, 1);
		onChange?.(newValue);
	};

	const handleSortUpdate = (index: number, updates: Partial<SortOption>) => {
		const newValue = [...value];
		newValue[index] = { ...newValue[index], ...updates };
		onChange?.(newValue);
	};

	const handleSortingReset = () => {
		onChange?.([]);
	};

	const handleReorder = (items: SortOption[]) => {
		onChange?.(items);
	};

	const handleOpenChange = (open: boolean) => {
		if (disabled) return;
		setIsOpen(open);
	};

	const gridTemplateColumns = {
		gridTemplateColumns: `minmax(${MIN_FIELD_WIDTH}px, 1fr) minmax(${MIN_DIRECTION_WIDTH}px, 1fr) auto auto`,
	};

	const appliedSorts = useMemo(() => {
		const sanitizedValue = sanitizeSortConditions(value);
		return sanitizedValue.length;
	}, [value]);

	return (
		<Popover open={isOpen} onOpenChange={handleOpenChange}>
			<PopoverTrigger disabled={disabled} asChild>
				<Button variant='outline' size='default' className={cn('flex items-center gap-2 text-xs', className)}>
					<ArrowUpDown className='size-5' />
					<span>Sort</span>
					{appliedSorts > 0 && (
						<Badge variant='secondary' className='ml-1 h-5 rounded px-1.5 font-mono text-xs'>
							{appliedSorts}
						</Badge>
					)}
				</Button>
			</PopoverTrigger>
			<PopoverContent
				align='start'
				className={cn('max-w-[calc(100vw-400px)] w-fit border-border/70 shadow-lg bg-[#fbfbfb]', 'border-border/40', POPOVER_PADDING)}
				style={{ minWidth: MIN_POPOVER_WIDTH }}>
				<div className='flex flex-col gap-1.5'>
					{value.length === 0 ? (
						<div className='flex flex-col gap-2 p-2'>
							<div className='flex justify-between items-start'>
								<div className='flex flex-col gap-1'>
									<h4 className='text-base font-medium leading-none'>No sorting applied</h4>
									<p className='text-muted-foreground text-sm'>Add sorting to organize your data.</p>
								</div>
								<Button variant='ghost' size='icon' className='h-7 w-7 -mr-1' onClick={() => setIsOpen(false)}>
									<X className='h-3.5 w-3.5' />
								</Button>
							</div>
							<div className='mt-2'>
								<Button size='sm' onClick={handleSortAdd} className='w-fit h-9 text-sm px-2.5'>
									Add sort
								</Button>
							</div>
						</div>
					) : (
						<div className='flex flex-col gap-1.5'>
							<div className='flex justify-between items-center'>
								<h4 className='text-sm font-medium leading-none'>Sort by</h4>
								<Button variant='ghost' size='icon' className='h-7 w-7 -mr-1' onClick={() => setIsOpen(false)}>
									<X className='h-3.5 w-3.5' />
								</Button>
							</div>

							<Sortable value={value} onValueChange={handleReorder} getItemValue={(item) => item.field}>
								<SortableContent className='flex flex-col gap-2'>
									{value.map((sort, index) => (
										<SortableItem key={sort.field} value={sort.field}>
											<div
												className={cn(
													'grid items-center',
													GRID_GAP,
													ITEM_PADDING,
													'w-full rounded-[4px] hover:bg-accent/40 transition-colors',
												)}
												style={gridTemplateColumns}>
												<Combobox
													options={options.map((opt) => ({
														value: opt.field,
														label: opt.label,
													}))}
													value={sort.field}
													onChange={(value) => handleSortUpdate(index, { field: value })}
													placeholder='Select field'
													width='100%'
													triggerClassName='h-9 text-sm'
													searchPlaceholder='Search fields...'
													contentClassName='!z-[130]'
												/>

												<Select
													options={[
														{
															value: SortDirection.ASC,
															label: 'Asc',
														},
														{
															value: 'desc',
															label: 'Desc',
														},
													]}
													value={sort.direction}
													onChange={(value) => handleSortUpdate(index, { direction: value as SortDirection })}
													className='h-9 text-sm'
													placeholder='Select direction'
													contentClassName='!z-[130]'
												/>

												<div className='flex items-center gap-1 justify-end'>
													<Button
														variant='ghost'
														size='icon'
														className='h-7 w-7 shrink-0 hover:bg-destructive/10 hover:text-destructive'
														onClick={() => handleSortRemove(index)}>
														<Trash2 className='h-3.5 w-3.5' />
													</Button>

													<SortableItemHandle asChild>
														<Button variant='ghost' size='icon' className='h-7 w-7 shrink-0'>
															<GripVertical className='h-3.5 w-3.5' />
														</Button>
													</SortableItemHandle>
												</div>
											</div>
										</SortableItem>
									))}
								</SortableContent>
								<SortableOverlay>
									<div className={cn('grid', GRID_GAP, ITEM_PADDING, 'w-full bg-accent/40 rounded-[4px]')} style={gridTemplateColumns}>
										<div className='h-9 rounded-[4px] border-border/40 bg-background' />
										<div className='h-9 rounded-[4px] border-border/40 bg-background' />
										<div className='flex gap-1 justify-end'>
											<div className='h-7 w-7 rounded-[4px] border-border/40 bg-background' />
											<div className='h-7 w-7 rounded-[4px] border-border/40 bg-background' />
										</div>
									</div>
								</SortableOverlay>
							</Sortable>

							<div className='flex items-center gap-2 pt-1.5 px-2'>
								<Button
									size='sm'
									onClick={handleSortAdd}
									disabled={value.length >= maxSorts || allFieldsAdded}
									className='h-9 text-sm px-2.5 flex items-center gap-1'>
									Add sort
								</Button>
								<Button variant='outline' size='sm' onClick={handleSortingReset} className='h-9 text-sm px-2.5'>
									Reset sorting
								</Button>
							</div>
						</div>
					)}
				</div>
			</PopoverContent>
		</Popover>
	);
};

export default SortDropdown;
