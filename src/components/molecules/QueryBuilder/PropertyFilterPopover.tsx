import { useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Trash2, GripVertical, ListFilter, X } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

import { Combobox, DatePicker, Toggle, Button, Select } from '@/components/atoms';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Sortable, SortableContent, SortableItem, SortableItemHandle, SortableOverlay } from '@/components/ui/sortable';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { FilterField, FilterCondition, FilterOperator, FilterFieldType } from '@/types/common/QueryBuilder';
import { sanitizeFilterConditions } from '@/types/formatters/QueryBuilder';

import FilterMultiSelect from './FilterMultiSelect';
import FilterAsyncSelect from './FilterAsyncSelect';
import FilterAsyncMultiSelect from './FilterAsyncMultiSelect';
import { getOperatorDisplayLabel } from './operatorLabels';

export interface PropertyFilterRow {
	id: string;
	key: string;
	value: string;
}

interface PropertyFiltersConfig {
	rows: PropertyFilterRow[];
	setRows: React.Dispatch<React.SetStateAction<PropertyFilterRow[]>>;
	createEmpty: () => PropertyFilterRow;
}

interface Props {
	fields: FilterField[];
	value: FilterCondition[];
	onChange: (filters: FilterCondition[]) => void;
	className?: string;
	sortable?: boolean;
	/** When provided, renders a "Property filters" section (key/value rows) inside the popover below the filter list. */
	propertyFilters?: PropertyFiltersConfig;
	/** Called when "Reset filters" is clicked, so the parent can clear extra state (e.g. property filters). */
	onResetCallback?: () => void;
}

const MIN_POPOVER_WIDTH = 400;
const MIN_FIELD_WIDTH = 160;
const MIN_OPERATOR_WIDTH = 120;
const MIN_VALUE_WIDTH = 160;
const POPOVER_PADDING = 'px-4 py-3';
const GRID_GAP = 'gap-1.5';
const ITEM_PADDING = 'py-1.5 px-2';

const getDefaultValueByFieldType = (field: FilterField) => {
	switch (field.fieldType) {
		case FilterFieldType.DATEPICKER:
			return { valueDate: undefined };
		case FilterFieldType.COMBOBOX:
			return { valueString: field.options?.[0]?.value || '' };
		case FilterFieldType.CHECKBOX:
		case FilterFieldType.SWITCH:
			return { valueBoolean: false };
		case FilterFieldType.RADIO:
		case FilterFieldType.SELECT:
			return { valueString: field.options?.[0]?.value || '' };
		case FilterFieldType.MULTI_SELECT:
		case FilterFieldType.ASYNC_MULTI_SELECT:
			return { valueArray: [] };
		case FilterFieldType.ASYNC_SELECT:
			return { valueString: field.asyncConfig?.initialOptions?.[0]?.value || '' };
		case FilterFieldType.METADATA:
			return { valueString: '' };
		default:
			return { valueString: '' };
	}
};

const getNewFilterWithDefaultValues = (field: FilterField): FilterCondition => ({
	id: uuidv4(),
	field: field.field,
	operator: field.operators[0],
	dataType: field.dataType,
	...getDefaultValueByFieldType(field),
});

const PropertyFilterPopover: React.FC<Props> = ({
	fields,
	value = [],
	onChange,
	className,
	sortable = false,
	propertyFilters,
	onResetCallback,
}) => {
	const { t } = useTranslation('common');
	const [isOpen, setIsOpen] = useState(false);

	const handleAddFilter = useCallback(() => {
		const firstField = fields[0];
		if (!firstField) return;
		const newFilter = getNewFilterWithDefaultValues(firstField);
		onChange([...value, newFilter]);
	}, [fields, value, onChange]);

	const handleRemoveFilter = useCallback(
		(id: string) => {
			onChange(value.filter((filter) => filter.id !== id));
		},
		[value, onChange],
	);

	const handleFilterUpdate = useCallback(
		(id: string, updates: Partial<FilterCondition>) => {
			onChange(value.map((filter) => (filter.id === id ? { ...filter, ...updates } : filter)));
		},
		[value, onChange],
	);

	const handleFieldChange = useCallback(
		(id: string, fieldName: string) => {
			const field = fields.find((f) => f.field === fieldName);
			if (!field) return;
			const newFilter = getNewFilterWithDefaultValues(field);
			handleFilterUpdate(id, newFilter);
		},
		[fields, handleFilterUpdate],
	);

	const handleReorder = useCallback(
		(items: FilterCondition[]) => {
			onChange(items);
		},
		[onChange],
	);

	const renderValueInput = useCallback(
		(filter: FilterCondition) => {
			const field = fields.find((f) => f.field === filter.field);
			if (!field) return null;

			const commonProps = {
				className: 'min-w-0 flex-1',
				placeholder: t('queryBuilder.enterValue'),
			};

			const inputProps = {
				...commonProps,
				className: cn(commonProps.className, 'h-8'),
			};

			const valueComponents = {
				[FilterFieldType.INPUT]: (
					<Input
						value={filter.valueString || ''}
						onChange={(e) => handleFilterUpdate(filter.id, { valueString: e.target.value })}
						{...inputProps}
						className={cn(inputProps.className, 'h-9 text-sm')}
					/>
				),
				[FilterFieldType.SELECT]: (
					<Select
						options={field.options?.map((opt) => ({ value: opt.value, label: opt.label })) || []}
						value={filter.valueString}
						onChange={(value) => handleFilterUpdate(filter.id, { valueString: value })}
						className={cn(inputProps.className, 'h-9 text-sm')}
						placeholder={commonProps.placeholder}
						contentClassName='!z-[110]'
					/>
				),
				[FilterFieldType.CHECKBOX]: (
					<Toggle
						checked={filter.valueBoolean || false}
						onChange={(checked) => handleFilterUpdate(filter.id, { valueBoolean: checked })}
						className={cn(inputProps.className, 'h-9 text-sm')}
					/>
				),
				[FilterFieldType.DATEPICKER]: (
					<DatePicker
						setDate={(date) => handleFilterUpdate(filter.id, { valueDate: date })}
						date={filter.valueDate}
						{...inputProps}
						popoverContentClassName='w-full !z-[110]'
						className={cn(inputProps.className, 'h-9 text-xs')}
						placeholder={t('queryBuilder.selectDate')}
						clearable
					/>
				),
				[FilterFieldType.RADIO]: (
					<Select
						options={field.options?.map((opt) => ({ value: opt.value, label: opt.label })) || []}
						value={filter.valueString}
						onChange={(value) => handleFilterUpdate(filter.id, { valueString: value })}
						isRadio
						className={cn(inputProps.className, 'h-9 text-sm')}
						placeholder={commonProps.placeholder}
						contentClassName='!z-[110]'
					/>
				),
				[FilterFieldType.COMBOBOX]: (
					<Combobox
						options={field.options?.map((opt) => ({ value: opt.value, label: opt.label })) || []}
						value={filter.valueString}
						onChange={(value) => handleFilterUpdate(filter.id, { valueString: value })}
						width='100%'
						triggerClassName={cn(inputProps.className, 'h-9 text-sm')}
						placeholder={commonProps.placeholder}
						contentClassName='!z-[110]'
					/>
				),
				[FilterFieldType.SWITCH]: (
					<Switch
						checked={filter.valueBoolean || false}
						onCheckedChange={(checked) => handleFilterUpdate(filter.id, { valueBoolean: checked })}
						className={cn(inputProps.className, 'h-9 text-sm')}
					/>
				),
				[FilterFieldType.MULTI_SELECT]: (
					<FilterMultiSelect
						options={field.options?.map((opt) => ({ value: opt.value, label: opt.label })) || []}
						value={filter.valueArray || []}
						onChange={(value) => handleFilterUpdate(filter.id, { valueArray: value })}
						placeholder={t('queryBuilder.selectOptions')}
						className={cn(inputProps.className, 'h-9 text-sm overflow-hidden')}
					/>
				),
			};

			// Handle async field types first
			if (field.fieldType === FilterFieldType.ASYNC_SELECT && field.asyncConfig) {
				return (
					<FilterAsyncSelect
						value={filter.valueString || ''}
						searchFn={field.asyncConfig.searchFn}
						onChange={(value) => handleFilterUpdate(filter.id, { valueString: value })}
						placeholder={t('queryBuilder.searchShort')}
						initialOptions={field.asyncConfig.initialOptions}
						debounceTime={field.asyncConfig.debounceTime}
						className={cn(inputProps.className, 'h-9 text-sm')}
					/>
				);
			}

			if (field.fieldType === FilterFieldType.ASYNC_MULTI_SELECT && field.asyncConfig) {
				return (
					<FilterAsyncMultiSelect
						value={filter.valueArray || []}
						searchFn={field.asyncConfig.searchFn}
						onChange={(value) => handleFilterUpdate(filter.id, { valueArray: value })}
						placeholder={t('queryBuilder.searchShort')}
						initialOptions={field.asyncConfig.initialOptions}
						debounceTime={field.asyncConfig.debounceTime}
						className={cn(inputProps.className, 'h-9 text-sm overflow-hidden')}
					/>
				);
			}

			// Handle non-async field types - TypeScript now knows fieldType is not async
			const nonAsyncFieldType = field.fieldType as Exclude<
				FilterFieldType,
				FilterFieldType.ASYNC_SELECT | FilterFieldType.ASYNC_MULTI_SELECT | FilterFieldType.METADATA
			>;
			const component = valueComponents[nonAsyncFieldType];
			return component || valueComponents[FilterFieldType.INPUT];
		},
		[fields, handleFilterUpdate, t],
	);

	const gridTemplateColumns = useMemo(
		() => ({
			gridTemplateColumns: `50px minmax(${MIN_FIELD_WIDTH}px, 1fr) minmax(${MIN_OPERATOR_WIDTH}px, 1fr) minmax(${MIN_VALUE_WIDTH}px, 2fr) auto`,
		}),
		[],
	);

	const fieldOptions = useMemo(
		() =>
			fields.map((field) => ({
				value: field.field,
				label: field.label,
			})),
		[fields],
	);

	// calculate the total number of filters
	const appliedFilters = useMemo(() => {
		const sanitizedValue = sanitizeFilterConditions(value);
		return sanitizedValue.length;
	}, [value]);

	return (
		<Popover open={isOpen} onOpenChange={setIsOpen}>
			<PopoverTrigger asChild>
				<Button variant='outline' size='default' className={cn('flex items-center gap-2', className)}>
					<ListFilter className='size-5' />
					<span>{t('queryBuilder.filter')}</span>
					{appliedFilters > 0 && (
						<Badge variant='secondary' className='ms-1 h-5 rounded px-1.5 font-mono text-xs'>
							{appliedFilters}
						</Badge>
					)}
				</Button>
			</PopoverTrigger>
			<PopoverContent
				align='start'
				className={cn('w-screen border-border/70 shadow-lg bg-surface-panel', POPOVER_PADDING)}
				style={{ maxWidth: '600px', minWidth: MIN_POPOVER_WIDTH }}>
				<div className='flex flex-col gap-1.5'>
					{value.length === 0 ? (
						<div className='flex flex-col gap-2 p-2'>
							<div className='flex justify-between items-start'>
								<div className='flex flex-col gap-1'>
									<h4 className='text-base font-medium leading-none'>{t('queryBuilder.noFiltersTitle')}</h4>
									<p className='text-muted-foreground text-sm'>{t('queryBuilder.noFiltersDescription')}</p>
								</div>
								<Button variant='ghost' size='icon' className='h-7 w-7 -me-1' onClick={() => setIsOpen(false)}>
									<X className='h-3.5 w-3.5' />
								</Button>
							</div>
							<div className='flex items-center gap-2 mt-2'>
								<Button size='sm' onClick={handleAddFilter} className='w-fit h-9 text-sm px-2.5'>
									{t('queryBuilder.addFilter')}
								</Button>
								{(onResetCallback != null || propertyFilters != null) && (
									<Button
										variant='outline'
										size='sm'
										onClick={() => {
											onChange([]);
											if (propertyFilters) propertyFilters.setRows([propertyFilters.createEmpty()]);
											onResetCallback?.();
										}}
										className='h-9 text-sm px-2.5'>
										{t('queryBuilder.resetFilters')}
									</Button>
								)}
							</div>
						</div>
					) : (
						<div className='flex flex-col gap-1.5 !z-50'>
							<div className='flex justify-between items-center'>
								<h4 className='text-sm font-medium leading-none'>{t('queryBuilder.filterBy')}</h4>
								<Button variant='ghost' size='icon' className='h-7 w-7 -me-1' onClick={() => setIsOpen(false)}>
									<X className='h-3.5 w-3.5' />
								</Button>
							</div>

							<div className='overflow-y-auto max-h-[min(60vh,400px)] flex flex-col gap-1.5'>
								<Sortable value={value} onValueChange={handleReorder} getItemValue={(item) => item.id}>
									<SortableContent className='flex flex-col gap-1'>
										{value.map((filter, index) => {
											const field = fields.find((f) => f.field === filter.field);
											if (!field) return null;

											return (
												<SortableItem key={filter.id} value={filter.id}>
													<div
														className={cn(
															'grid items-center',
															GRID_GAP,
															ITEM_PADDING,
															'w-full rounded hover:bg-accent/40 transition-colors',
														)}
														style={gridTemplateColumns}>
														<span className='text-xs text-muted-foreground'>
															{index > 0 ? t('queryBuilder.and') : t('queryBuilder.where')}
														</span>
														<Combobox
															options={fieldOptions}
															value={filter.field}
															onChange={(value) => handleFieldChange(filter.id, value)}
															placeholder={t('queryBuilder.selectField')}
															width='100%'
															triggerClassName='h-9 text-sm overflow-hidden'
															searchPlaceholder={t('queryBuilder.searchFieldsPlaceholder')}
															contentClassName='!z-[110]'
														/>

														<Select
															options={field.operators
																.filter((operator) => operator != null)
																.map((operator) => ({
																	value: operator,
																	label: getOperatorDisplayLabel(t, operator),
																}))}
															value={filter.operator}
															onChange={(value) => handleFilterUpdate(filter.id, { operator: value as FilterOperator })}
															placeholder={t('queryBuilder.selectOperator')}
															className='h-9 text-sm'
															contentClassName='!z-[110]'
														/>

														<div className='min-w-0'>{renderValueInput(filter)}</div>

														<div className='flex items-center gap-1 justify-end'>
															<Button
																variant='ghost'
																size='icon'
																className='h-7 w-7 shrink-0 hover:bg-destructive/10 hover:text-destructive'
																onClick={() => handleRemoveFilter(filter.id)}>
																<Trash2 className='h-3.5 w-3.5' />
															</Button>

															{sortable && (
																<SortableItemHandle asChild>
																	<Button variant='ghost' size='icon' className='h-7 w-7 shrink-0'>
																		<GripVertical className='h-3.5 w-3.5' />
																	</Button>
																</SortableItemHandle>
															)}
														</div>
													</div>
												</SortableItem>
											);
										})}
									</SortableContent>
									<SortableOverlay>
										<div className={cn('grid', GRID_GAP, ITEM_PADDING, 'w-full bg-accent/40 rounded')} style={gridTemplateColumns}>
											<div className='h-7 rounded border-border/40 bg-background' />
											<div className='h-7 rounded border-border/40 bg-background' />
											<div className='h-7 rounded border-border/40 bg-background' />
											<div className='flex gap-1 justify-end'>
												<div className='h-7 w-7 rounded border-border/40 bg-background' />
												<div className='h-7 w-7 rounded border-border/40 bg-background' />
											</div>
										</div>
									</SortableOverlay>
								</Sortable>

								{propertyFilters ? (
									<div className='pt-3 mt-2 border-t border-border flex flex-col gap-1.5'>
										<h4 className='text-sm font-medium leading-none'>{t('queryBuilder.propertyFiltersHeading')}</h4>
										<div className='space-y-3'>
											{propertyFilters.rows.map((row) => (
												<div key={row.id} className='flex gap-2 items-end flex-wrap'>
													<div className='flex-1 min-w-[120px]'>
														<Input
															placeholder={t('queryBuilder.metadataKey')}
															value={row.key}
															onChange={(e) =>
																propertyFilters.setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, key: e.target.value } : r)))
															}
															className='h-9 text-sm'
														/>
													</div>
													<div className='flex-1 min-w-[120px]'>
														<Input
															placeholder={t('queryBuilder.metadataValue')}
															value={row.value}
															onChange={(e) =>
																propertyFilters.setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, value: e.target.value } : r)))
															}
															className='h-9 text-sm'
														/>
													</div>
													<Button
														variant='ghost'
														size='icon'
														className='h-7 w-7 shrink-0 hover:bg-destructive/10 hover:text-destructive'
														onClick={() =>
															propertyFilters.setRows((prev) => (prev.length > 1 ? prev.filter((r) => r.id !== row.id) : prev))
														}
														aria-label={t('queryBuilder.removePropertyFilterAria')}>
														<Trash2 className='h-3.5 w-3.5' />
													</Button>
												</div>
											))}
										</div>
									</div>
								) : null}
							</div>

							<div className='flex items-center gap-2 pt-2 px-2 shrink-0 border-t border-border/50'>
								<Button size='sm' onClick={handleAddFilter} className='h-9 text-sm px-2.5 flex items-center gap-1'>
									{t('queryBuilder.addFilter')}
								</Button>
								{propertyFilters && (
									<Button
										variant='outline'
										size='sm'
										className='h-9 text-sm px-2.5 flex items-center gap-1'
										onClick={() => propertyFilters.setRows((prev) => [...prev, propertyFilters.createEmpty()])}>
										{t('queryBuilder.addPropertyFilter')}
									</Button>
								)}
								<Button
									variant='outline'
									size='sm'
									onClick={() => {
										onChange([]);
										if (propertyFilters) propertyFilters.setRows([propertyFilters.createEmpty()]);
										onResetCallback?.();
									}}
									className='h-9 text-sm px-2.5'>
									{t('queryBuilder.resetFilters')}
								</Button>
							</div>
						</div>
					)}
				</div>
			</PopoverContent>
		</Popover>
	);
};

export default PropertyFilterPopover;
