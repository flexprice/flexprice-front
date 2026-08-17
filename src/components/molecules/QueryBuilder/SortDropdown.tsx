import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Sortable, SortableContent, SortableItem, SortableItemHandle, SortableOverlay } from '@/components/ui/sortable';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ArrowUpDown, GripVertical, Trash2, X } from 'lucide-react';
import { ArrowUpDownIcon } from '@hugeicons/core-free-icons';
import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Combobox, Button, Select } from '@/components/atoms';
import { SortOption, SortDirection } from '@/types/common/QueryBuilder';
import { sanitizeSortConditions } from '@/types/formatters/QueryBuilder';
import QueryControlTrigger from './QueryControlTrigger';
interface Props {
	options: SortOption[];
	value: SortOption[];
	onChange: (value: SortOption[]) => void;
	className?: string;
	maxSorts?: number;
	disabled?: boolean;
	/** Icon-only trigger with a count coin when sorts are active. */
	variant?: 'labeled' | 'icon';
	/** Popover horizontal alignment relative to the trigger. */
	popoverAlign?: 'start' | 'center' | 'end';
}

const MIN_POPOVER_WIDTH = 400;
const MIN_FIELD_WIDTH = 160;
const MIN_DIRECTION_WIDTH = 100;
const POPOVER_SURFACE =
	'w-[min(400px,calc(100vw-2rem))] rounded-[var(--fp-radius-lg)] border border-line-hairline bg-surface p-4 text-content shadow-[0_10px_40px_rgb(15_23_42/0.14),0_2px_8px_rgb(15_23_42/0.06)] dark:shadow-[0_12px_40px_rgb(0_0_0/0.45)]';
const GRID_GAP = 'gap-2';
const ITEM_PADDING = 'py-2 px-2';

const SortDropdown: React.FC<Props> = ({
	options,
	value = [],
	onChange,
	className,
	disabled = false,
	maxSorts = 10,
	variant = 'icon',
	popoverAlign = 'start',
}) => {
	const { t } = useTranslation('common');
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
			{variant === 'icon' ? (
				<PopoverTrigger disabled={disabled} asChild>
					<QueryControlTrigger icon={ArrowUpDownIcon} label={t('queryBuilder.sort')} count={appliedSorts} className={className} />
				</PopoverTrigger>
			) : (
				<PopoverTrigger disabled={disabled} asChild>
					<Button variant='outline' size='default' className={cn('flex items-center gap-2 text-xs', className)}>
						<ArrowUpDown className='size-5' />
						<span>{t('queryBuilder.sort')}</span>
						{appliedSorts > 0 && (
							<Badge variant='secondary' className='ms-1 h-5 rounded px-1.5 font-mono text-xs'>
								{appliedSorts}
							</Badge>
						)}
					</Button>
				</PopoverTrigger>
			)}
			<PopoverContent align={popoverAlign} collisionPadding={24} className={POPOVER_SURFACE} style={{ minWidth: MIN_POPOVER_WIDTH }}>
				<div className='flex flex-col gap-3'>
					{value.length === 0 ? (
						<div className='flex flex-col gap-4'>
							<div className='flex items-start justify-between gap-3'>
								<div className='flex flex-col gap-1'>
									<h4 className='text-sm font-medium leading-none text-content'>{t('queryBuilder.noSortingTitle')}</h4>
									<p className='text-sm text-content-muted'>{t('queryBuilder.noSortingDescription')}</p>
								</div>
								<Button variant='ghost' size='icon' className='h-7 w-7 -me-1 shrink-0' onClick={() => setIsOpen(false)}>
									<X className='h-3.5 w-3.5' />
								</Button>
							</div>
							<div className='flex justify-end'>
								<Button size='sm' onClick={handleSortAdd} className='h-9 px-3 text-sm'>
									{t('queryBuilder.addSort')}
								</Button>
							</div>
						</div>
					) : (
						<div className='flex flex-col gap-3'>
							<div className='flex items-center justify-between gap-3'>
								<h4 className='text-sm font-medium leading-none text-content'>{t('queryBuilder.sortBy')}</h4>
								<Button variant='ghost' size='icon' className='h-7 w-7 -me-1 shrink-0' onClick={() => setIsOpen(false)}>
									<X className='h-3.5 w-3.5' />
								</Button>
							</div>

							<Sortable value={value} onValueChange={handleReorder} getItemValue={(item) => item.field}>
								<SortableContent className='flex flex-col gap-2'>
									{value.map((sort, index) => (
										<SortableItem key={sort.field} value={sort.field}>
											<div
												className={cn('grid items-center', GRID_GAP, ITEM_PADDING, 'w-full rounded hover:bg-accent/40 transition-colors')}
												style={gridTemplateColumns}>
												<Combobox
													options={options.map((opt) => ({
														value: opt.field,
														label: opt.label,
													}))}
													value={sort.field}
													onChange={(value) => handleSortUpdate(index, { field: value })}
													placeholder={t('queryBuilder.selectField')}
													width='100%'
													triggerClassName='h-9 text-sm'
													searchPlaceholder={t('queryBuilder.searchFieldsPlaceholder')}
													contentClassName='!z-[110]'
												/>

												<Select
													options={[
														{
															value: SortDirection.ASC,
															label: t('queryBuilder.directionAsc'),
														},
														{
															value: SortDirection.DESC,
															label: t('queryBuilder.directionDesc'),
														},
													]}
													value={sort.direction}
													onChange={(value) => handleSortUpdate(index, { direction: value as SortDirection })}
													className='h-9 text-sm'
													placeholder={t('queryBuilder.selectDirection')}
													contentClassName='!z-[110]'
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
									<div className={cn('grid', GRID_GAP, ITEM_PADDING, 'w-full bg-accent/40 rounded')} style={gridTemplateColumns}>
										<div className='h-9 rounded border-border/40 bg-background' />
										<div className='h-9 rounded border-border/40 bg-background' />
										<div className='flex gap-1 justify-end'>
											<div className='h-7 w-7 rounded border-border/40 bg-background' />
											<div className='h-7 w-7 rounded border-border/40 bg-background' />
										</div>
									</div>
								</SortableOverlay>
							</Sortable>

							<div className='mt-1 flex items-center justify-end gap-2 border-t border-line-hairline pt-3'>
								<Button variant='outline' size='sm' onClick={handleSortingReset} className='h-9 px-3 text-sm'>
									{t('queryBuilder.resetSorting')}
								</Button>
								<Button
									size='sm'
									onClick={handleSortAdd}
									disabled={value.length >= maxSorts || allFieldsAdded}
									className='h-9 px-3 text-sm'>
									{t('queryBuilder.addSort')}
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
