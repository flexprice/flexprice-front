import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Sortable, SortableContent, SortableItem, SortableItemHandle, SortableOverlay } from '@/components/ui/sortable';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Trash2, GripVertical, ListFilter } from 'lucide-react';
import { useState } from 'react';
import { FilterField, FilterCondition, FilterOperator, FilterFieldType } from '@/types/common/QueryBuilder';
import { Input } from '@/components/ui/input';
import { v4 as uuidv4 } from 'uuid';
import { Combobox, DatePicker, Toggle, Button, Select } from '@/components/atoms';
import { Switch } from '@/components/ui/switch';

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

const getNewFilterWithDefaultValues = (field: FilterField): FilterCondition => {
	const newFilter: FilterCondition = {
		id: uuidv4(),
		field: field.field,
		operator: field.operators[0],
		fieldType: field.fieldType,
		booleanValue: false,
		dateValue: new Date(),
		stringValue: '',
		arrayValue: [],
		numberValue: 0,
	};

	if (field.fieldType === FilterFieldType.DATEPICKER) {
		newFilter.dateValue = new Date();
	}

	if (field.fieldType === FilterFieldType.COMBOBOX) {
		newFilter.arrayValue = [field.options?.[0] || ''];
	}

	if (field.fieldType === FilterFieldType.CHECKBOX) {
		newFilter.booleanValue = false;
	}

	if (field.fieldType === FilterFieldType.RADIO) {
		newFilter.stringValue = field.options?.[0] || '';
	}

	if (field.fieldType === FilterFieldType.SWITCH) {
		newFilter.booleanValue = false;
	}

	if (field.fieldType === FilterFieldType.SELECT) {
		newFilter.stringValue = field.options?.[0] || '';
	}

	return newFilter;
};

const FilterPopover: React.FC<Props> = ({ fields, value = [], onChange, className, sortable = false }) => {
	const [isOpen, setIsOpen] = useState(false);

	const handleAddFilter = () => {
		const firstField = fields[0];
		if (!firstField) return;
		const newFilter = getNewFilterWithDefaultValues(firstField);
		onChange([...value, newFilter]);
	};

	const handleRemoveFilter = (id: string) => {
		onChange(value.filter((filter) => filter.id !== id));
	};

	const handleFilterUpdate = (id: string, updates: Partial<FilterCondition>) => {
		onChange(value.map((filter) => (filter.id === id ? { ...filter, ...updates } : filter)));
	};

	const handleFieldChange = (id: string, fieldName: string) => {
		const field = fields.find((f) => f.field === fieldName);
		if (!field) return;

		const newFilter = getNewFilterWithDefaultValues(field);

		handleFilterUpdate(id, newFilter);
	};

	const handleReorder = (items: FilterCondition[]) => {
		onChange(items);
	};

	const renderValueInput = (filter: FilterCondition) => {
		const field = fields.find((f) => f.field === filter.field);
		if (!field) return null;

		const commonProps = {
			className: 'min-w-0 flex-1',
			placeholder: 'Enter value...',
		};

		switch (field.fieldType) {
			case FilterFieldType.INPUT:
				return (
					<Input
						value={filter.stringValue || ''}
						onChange={(e) => handleFilterUpdate(filter.id, { stringValue: e.target.value })}
						{...commonProps}
						className={cn(commonProps.className, 'h-8')}
					/>
				);
			case FilterFieldType.SELECT:
				return (
					<Select
						options={field.options?.map((opt) => ({ value: opt, label: opt })) || []}
						value={filter.stringValue}
						onChange={(value) => handleFilterUpdate(filter.id, { stringValue: value })}
						className={cn(commonProps.className, 'h-8')}
						placeholder={commonProps.placeholder}
					/>
				);
			case FilterFieldType.CHECKBOX:
				return (
					<Toggle checked={filter.booleanValue || false} onChange={(checked) => handleFilterUpdate(filter.id, { booleanValue: checked })} />
				);
			case FilterFieldType.DATEPICKER:
				return (
					<DatePicker
						setDate={(date) => handleFilterUpdate(filter.id, { dateValue: date })}
						date={filter.dateValue || new Date()}
						{...commonProps}
						placeholder='Select date'
						className={cn(commonProps.className, 'h-8')}
					/>
				);
			case FilterFieldType.RADIO:
				return (
					<Select
						options={field.options?.map((opt) => ({ value: opt, label: opt })) || []}
						value={filter.stringValue}
						onChange={(value) => handleFilterUpdate(filter.id, { stringValue: value })}
						isRadio
						className={cn(commonProps.className, 'h-8')}
						placeholder={commonProps.placeholder}
					/>
				);
			case FilterFieldType.COMBOBOX:
				return (
					<Combobox
						options={field.options?.map((opt) => ({ value: opt, label: opt })) || []}
						value={filter.stringValue}
						onChange={(value) => handleFilterUpdate(filter.id, { stringValue: value })}
						width='100%'
						triggerClassName='h-8'
						placeholder={commonProps.placeholder}
					/>
				);
			case FilterFieldType.SWITCH:
				return (
					<Switch
						checked={filter.booleanValue || false}
						onCheckedChange={(checked) => handleFilterUpdate(filter.id, { booleanValue: checked })}
					/>
				);
			default:
				return (
					<Input
						value={filter.stringValue || ''}
						onChange={(e) => handleFilterUpdate(filter.id, { stringValue: e.target.value })}
						{...commonProps}
					/>
				);
		}
	};

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
			<PopoverContent align='start' className='p-4 w-screen' style={{ maxWidth: '600px', minWidth: MIN_POPOVER_WIDTH }}>
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

							<Sortable value={value} onValueChange={handleReorder} getItemValue={(item) => item.id}>
								<SortableContent className='flex flex-col gap-1'>
									{value.map((filter, index) => {
										const field = fields.find((f) => f.field === filter.field);
										if (!field) return null;

										return (
											<SortableItem key={filter.id} value={filter.id}>
												<div
													className='grid items-center gap-2 p-2 w-full'
													style={{
														gridTemplateColumns: `50px minmax(${MIN_FIELD_WIDTH}px, 1fr) minmax(${MIN_OPERATOR_WIDTH}px, 1fr) minmax(${MIN_VALUE_WIDTH}px, 2fr) auto`,
													}}>
													<span className='text-sm text-muted-foreground'>{index > 0 ? 'and' : 'Where'}</span>
													<Combobox
														options={fields.map((field) => ({
															value: field.field,
															label: field.label,
														}))}
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
															label: operator.toLowerCase().replace(/_/g, ' '),
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
									<div
										className='grid gap-2 p-2 w-full'
										style={{
											gridTemplateColumns: `minmax(${MIN_FIELD_WIDTH}px, 1fr) minmax(${MIN_OPERATOR_WIDTH}px, 1fr) minmax(${MIN_VALUE_WIDTH}px, 2fr) auto`,
										}}>
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
