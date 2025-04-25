import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { FilterIcon, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { FilterField, FilterCondition, FilterOperator, FilterDataType } from '@/types/common/QueryBuilder';
import { Input } from '@/components/ui/input';
import { v4 as uuidv4 } from 'uuid';

interface Props {
	fields: FilterField[];
	value: FilterCondition[];
	onChange: (filters: FilterCondition[]) => void;
	className?: string;
}

const FilterPopover: React.FC<Props> = ({ fields, value = [], onChange, className }) => {
	const [isOpen, setIsOpen] = useState(false);

	const handleAddFilter = () => {
		const firstField = fields[0];
		if (!firstField) return;

		const newFilter: FilterCondition = {
			id: uuidv4(),
			field: firstField.field,
			operator: firstField.operators[0],
			dataType: firstField.dataType,
		};

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

		handleFilterUpdate(id, {
			field: field.field,
			operator: field.operators[0],
			dataType: field.dataType,
			// Reset values when field type changes
			stringValue: undefined,
			numberValue: undefined,
			arrayValue: undefined,
			dateValue: undefined,
			dateRangeValue: undefined,
			booleanValue: undefined,
		});
	};

	const renderValueInput = (filter: FilterCondition) => {
		const field = fields.find((f) => f.field === filter.field);
		if (!field) return null;

		switch (field.dataType) {
			case FilterDataType.STRING:
				return (
					<Input
						value={filter.stringValue || ''}
						onChange={(e) => handleFilterUpdate(filter.id, { stringValue: e.target.value })}
						className='w-[180px]'
						placeholder='Enter value...'
					/>
				);
			case FilterDataType.NUMBER:
				return (
					<Input
						type='number'
						value={filter.numberValue || ''}
						onChange={(e) => handleFilterUpdate(filter.id, { numberValue: Number(e.target.value) })}
						className='w-[180px]'
						placeholder='Enter number...'
					/>
				);
			// Add more cases for other data types as needed
			default:
				return null;
		}
	};

	return (
		<Popover open={isOpen} onOpenChange={setIsOpen}>
			<PopoverTrigger asChild>
				<Button variant='outline' size='sm' className={cn('flex items-center gap-2', className)}>
					<FilterIcon className='h-4 w-4' />
					<span>Filter</span>
					{value.length > 0 && (
						<Badge variant='secondary' className='ml-1 h-5 rounded px-1.5 font-mono text-xs'>
							{value.length}
						</Badge>
					)}
				</Button>
			</PopoverTrigger>
			<PopoverContent align='start' className='w-[800px] p-4'>
				<div className='flex flex-col gap-4'>
					<div className='flex flex-col gap-1'>
						<h4 className='font-medium leading-none'>{value.length > 0 ? 'Filter by' : 'No filters applied'}</h4>
						<p className={cn('text-muted-foreground text-sm', value.length > 0 && 'sr-only')}>Add filters to refine your data.</p>
					</div>

					{value.length > 0 && (
						<div className='flex flex-col gap-2'>
							{value.map((filter) => {
								const field = fields.find((f) => f.field === filter.field);
								if (!field) return null;

								return (
									<div key={filter.id} className='flex items-center gap-2 rounded-md border bg-card p-2'>
										<Select value={filter.field} onValueChange={(value) => handleFieldChange(filter.id, value)}>
											<SelectTrigger className='w-[180px]'>
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												{fields.map((field) => (
													<SelectItem key={field.field} value={field.field}>
														{field.label}
													</SelectItem>
												))}
											</SelectContent>
										</Select>

										<Select
											value={filter.operator}
											onValueChange={(value) => handleFilterUpdate(filter.id, { operator: value as FilterOperator })}>
											<SelectTrigger className='w-[140px]'>
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												{field.operators.map((operator) => (
													<SelectItem key={operator} value={operator}>
														{operator.toLowerCase().replace(/_/g, ' ')}
													</SelectItem>
												))}
											</SelectContent>
										</Select>

										{renderValueInput(filter)}

										<Button variant='outline' size='icon' className='h-8 w-8' onClick={() => handleRemoveFilter(filter.id)}>
											<Trash2 className='h-4 w-4' />
										</Button>
									</div>
								);
							})}
						</div>
					)}

					<div className='flex items-center gap-2'>
						<Button size='sm' onClick={handleAddFilter} className='flex items-center gap-2'>
							<Plus className='h-4 w-4' />
							Add filter
						</Button>
						{value.length > 0 && (
							<Button variant='outline' size='sm' onClick={() => onChange([])}>
								Reset filters
							</Button>
						)}
					</div>
				</div>
			</PopoverContent>
		</Popover>
	);
};

export default FilterPopover;
