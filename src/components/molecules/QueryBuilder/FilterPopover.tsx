import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Sortable, SortableContent, SortableItem, SortableItemHandle, SortableOverlay } from '@/components/ui/sortable';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Trash2, GripVertical, ListFilter } from 'lucide-react';
import { useState, useCallback, useMemo } from 'react';
import { FilterField, FilterCondition, FilterOperator, FilterFieldType } from '@/types/common/QueryBuilder';
import { Input } from '@/components/ui/input';
import { Combobox, DatePicker, Toggle, Button, Select } from '@/components/atoms';
import { Switch } from '@/components/ui/switch';
import FilterMultiSelect from './FilterMultiSelect';
import { v4 as uuidv4 } from 'uuid';

interface Props {
	fields: FilterField[];
	value: FilterCondition[];
	onChange: (filters: FilterCondition[]) => void;
	className?: string;
	sortable?: boolean;
}

const MIN_POPOVER_WIDTH = 400;
const MIN_FIELD_WIDTH = 160;
const MIN_OPERATOR_WIDTH = 120;
const MIN_VALUE_WIDTH = 160;

const getDefaultValueByFieldType = (field: FilterField) => {
	switch (field.fieldType) {
		case FilterFieldType.DATEPICKER:
			return { valueDate: new Date() };
		case FilterFieldType.COMBOBOX:
			return { valueArray: [field.options?.[0]?.value || ''] };
		case FilterFieldType.CHECKBOX:
		case FilterFieldType.SWITCH:
			return { valueBoolean: false };
		case FilterFieldType.RADIO:
		case FilterFieldType.SELECT:
			return { valueString: field.options?.[0]?.value || '' };
		case FilterFieldType.MULTI_SELECT:
			return { valueArray: [] };
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

const FilterPopover: React.FC<Props> = ({ fields, value = [], onChange, className, sortable = false }) => {
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
				placeholder: 'Enter value...',
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
					/>
				),
				[FilterFieldType.SELECT]: (
					<Select
						options={field.options?.map((opt) => ({ value: opt.value, label: opt.label })) || []}
						value={filter.valueString}
						onChange={(value) => handleFilterUpdate(filter.id, { valueString: value })}
						className={inputProps.className}
						placeholder={commonProps.placeholder}
					/>
				),
				[FilterFieldType.CHECKBOX]: (
					<Toggle checked={filter.valueBoolean || false} onChange={(checked) => handleFilterUpdate(filter.id, { valueBoolean: checked })} />
				),
				[FilterFieldType.DATEPICKER]: (
					<DatePicker
						setDate={(date) => handleFilterUpdate(filter.id, { valueDate: date })}
						date={filter.valueDate || new Date()}
						{...inputProps}
						placeholder='Select date'
					/>
				),
				[FilterFieldType.RADIO]: (
					<Select
						options={field.options?.map((opt) => ({ value: opt.value, label: opt.label })) || []}
						value={filter.valueString}
						onChange={(value) => handleFilterUpdate(filter.id, { valueString: value })}
						isRadio
						className={inputProps.className}
						placeholder={commonProps.placeholder}
					/>
				),
				[FilterFieldType.COMBOBOX]: (
					<Combobox
						options={field.options?.map((opt) => ({ value: opt.value, label: opt.label })) || []}
						value={filter.valueString}
						onChange={(value) => handleFilterUpdate(filter.id, { valueString: value })}
						width='100%'
						triggerClassName='h-8'
						placeholder={commonProps.placeholder}
					/>
				),
				[FilterFieldType.SWITCH]: (
					<Switch
						checked={filter.valueBoolean || false}
						onCheckedChange={(checked) => handleFilterUpdate(filter.id, { valueBoolean: checked })}
					/>
				),
				[FilterFieldType.MULTI_SELECT]: (
					<FilterMultiSelect
						options={field.options?.map((opt) => ({ value: opt.value, label: opt.label })) || []}
						value={filter.valueArray || []}
						onChange={(value) => handleFilterUpdate(filter.id, { valueArray: value })}
						placeholder='Select options'
					/>
				),
			};

			return valueComponents[field.fieldType] || valueComponents[FilterFieldType.INPUT];
		},
		[fields, handleFilterUpdate],
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

	return (
		<Popover open={isOpen} onOpenChange={setIsOpen}>
			<PopoverTrigger asChild>
				<Button variant='outline' size='sm' className={cn('flex items-center gap-2', className)}>
					<ListFilter className='h-4 w-4' />
					<span>Filter</span>
					{value.length > 0 && (
						<Badge variant='secondary' className='ml-1 h-5 rounded px-1.5 font-mono text-xs'>
							{value.length}
						</Badge>
					)}
				</Button>
			</PopoverTrigger>
			<PopoverContent align='start' className='p-4 w-screen' style={{ maxWidth: '620px', minWidth: MIN_POPOVER_WIDTH }}>
				<div className='flex flex-col gap-4'>
					{value.length === 0 ? (
						<div className='flex flex-col gap-2'>
							<h4 className='font-medium leading-none'>No filters applied</h4>
							<p className='text-muted-foreground text-sm'>Add filters to refine your rows.</p>
							<Button size='sm' onClick={handleAddFilter} className='w-fit'>
								Add filter
							</Button>
						</div>
					) : (
						<>
							<div className='flex flex-col gap-1'>
								<h4 className='font-medium leading-none'>Filter by</h4>
							</div>

							<Sortable value={value} onValueChange={handleReorder} getItemValue={(item) => item.field}>
								<SortableContent className='flex flex-col gap-0'>
									{value.map((filter, index) => {
										const field = fields.find((f) => f.field === filter.field);
										if (!field) return null;

										return (
											<SortableItem key={filter.id} value={filter.field}>
												<div className='grid items-center gap-2 p-2 w-full' style={gridTemplateColumns}>
													<span className='text-sm text-muted-foreground'>{index > 0 ? 'and' : 'Where'}</span>
													<Combobox
														options={fieldOptions}
														value={filter.field}
														onChange={(value) => handleFieldChange(filter.id, value)}
														placeholder='Select field'
														width='100%'
														triggerClassName='h-8'
														searchPlaceholder='Search fields...'
													/>

													<Select
														options={field.operators.map((operator) => ({
															value: operator,
															label: operator
																.toLowerCase()
																.replace(/_/g, ' ')
																.replace(/\b\w/g, (char) => char.toUpperCase()),
														}))}
														value={filter.operator}
														onChange={(value) => handleFilterUpdate(filter.id, { operator: value as FilterOperator })}
														placeholder='Select operator'
														className='h-8'
													/>

													<div className='min-w-0'>{renderValueInput(filter)}</div>

													<div className='flex items-center gap-1 justify-end'>
														<Button
															variant='outline'
															size='icon'
															className='h-8 w-8 shrink-0'
															onClick={() => handleRemoveFilter(filter.id)}>
															<Trash2 className='h-4 w-4' />
														</Button>

														{sortable && (
															<SortableItemHandle asChild>
																<Button variant='outline' size='icon' className='h-8 w-8 shrink-0'>
																	<GripVertical className='h-4 w-4' />
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
									<div className='grid gap-2 p-2 w-full' style={gridTemplateColumns}>
										<div className='h-8 rounded-md border bg-background' />
										<div className='h-8 rounded-md border bg-background' />
										<div className='h-8 rounded-md border bg-background' />
										<div className='flex gap-1 justify-end'>
											<div className='h-8 w-8 rounded-md border bg-background' />
											<div className='h-8 w-8 rounded-md border bg-background' />
										</div>
									</div>
								</SortableOverlay>
							</Sortable>

							<div className='flex items-center gap-2'>
								<Button size='sm' onClick={handleAddFilter} className='flex items-center gap-2'>
									Add filter
								</Button>
								<Button variant='outline' size='sm' onClick={() => onChange([])}>
									Reset filters
								</Button>
							</div>
						</>
					)}
				</div>
			</PopoverContent>
		</Popover>
	);
};

export default FilterPopover;
