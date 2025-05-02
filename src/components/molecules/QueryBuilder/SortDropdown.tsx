import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Sortable, SortableContent, SortableItem, SortableItemHandle, SortableOverlay } from '@/components/ui/sortable';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ArrowUpDown, GripVertical, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Combobox, Button, Select } from '@/components/atoms';
import { SortOption, SortDirection } from '@/types/common/QueryBuilder';

interface Props {
	options: SortOption[];
	value?: SortOption[];
	onChange?: (value: SortOption[]) => void;
	className?: string;
	maxSorts?: number;
	disabled?: boolean;
}

const SortDropdown: React.FC<Props> = ({ options, value = [], onChange, className, maxSorts = 3, disabled = false }) => {
	const [isOpen, setIsOpen] = useState(false);

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
			onChange?.(newValue);
			setIsOpen(true); // Keep the dropdown open after adding
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

	return (
		<Popover open={isOpen} onOpenChange={handleOpenChange}>
			<PopoverTrigger disabled={disabled} asChild>
				<Button variant='outline' size='sm' className={cn('flex items-center gap-2', className)}>
					<ArrowUpDown className='h-4 w-4' />
					<span>Sort</span>
					{value.length > 0 && (
						<Badge variant='secondary' className='ml-1 h-5 rounded px-1.5 font-mono text-xs'>
							{value.length}
						</Badge>
					)}
				</Button>
			</PopoverTrigger>
			<PopoverContent align='start' className='w-[380px] p-4'>
				<div className='flex flex-col gap-3'>
					<div className='flex flex-col gap-1'>
						<h4 className='font-medium leading-none'>{value.length > 0 ? 'Sort by' : 'No sorting applied'}</h4>
						<p className={cn('text-muted-foreground text-sm', value.length > 0 && 'sr-only')}>Add sorting to organize your data.</p>
					</div>

					{value.length > 0 && (
						<Sortable value={value} onValueChange={handleReorder} getItemValue={(item) => item.field}>
							<SortableContent className='flex flex-col gap-2'>
								{value.map((sort, index) => (
									<SortableItem key={sort.field} value={sort.field} className='flex items-center gap-2 rounded-md'>
										<Combobox
											options={options.map((opt) => ({
												value: opt.field,
												label: opt.label,
											}))}
											value={sort.field}
											onChange={(value) => handleSortUpdate(index, { field: value })}
											placeholder='Select field'
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
											className='w-[80px] h-8'
										/>

										<Button variant='outline' size='icon' className='size-8 aspect-square shrink-0' onClick={() => handleSortRemove(index)}>
											<Trash2 className='size-4' />
										</Button>

										<SortableItemHandle asChild>
											<Button variant='outline' size='icon' className='size-8 aspect-square shrink-0'>
												<GripVertical className='size-4' />
											</Button>
										</SortableItemHandle>
									</SortableItem>
								))}
							</SortableContent>
							<SortableOverlay>
								<div className='flex items-center gap-2 rounded-md border bg-card p-2'>
									<div className='h-8 w-[180px] rounded-md bg-muted' />
									<div className='h-8 w-[100px] rounded-md bg-muted' />
									<div className='h-8 w-8 rounded-md bg-muted' />
									<div className='h-8 w-8 rounded-md bg-muted' />
								</div>
							</SortableOverlay>
						</Sortable>
					)}

					<div className='flex items-center gap-2'>
						<Button size='sm' onClick={handleSortAdd} disabled={value.length >= maxSorts}>
							Add sort
						</Button>
						{value.length > 0 && (
							<Button variant='outline' size='sm' onClick={handleSortingReset}>
								Reset sorting
							</Button>
						)}
					</div>
				</div>
			</PopoverContent>
		</Popover>
	);
};

export default SortDropdown;
