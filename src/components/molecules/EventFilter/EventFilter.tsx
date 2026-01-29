import { Button, Input, MultiChipInput } from '@/components/atoms';
import { cn } from '@/lib/utils';
import React, { FC, useEffect } from 'react';
import { RiDeleteBin6Line } from 'react-icons/ri';
import { Plus } from 'lucide-react';

interface Props {
	eventFilters: EventFilterData[];
	setEventFilters: React.Dispatch<React.SetStateAction<EventFilterData[]>>;
	error?: string;
	disabled?: boolean;
	orientation?: 'horizontal' | 'vertical';
}

export interface EventFilterData {
	key: string;
	values: string[];
}

const EventFilter: FC<Props> = ({ eventFilters, setEventFilters, error, disabled, orientation = 'horizontal' }) => {
	useEffect(() => {
		if ((!eventFilters || eventFilters.length === 0) && !disabled) {
			setEventFilters([{ key: '', values: [] }]);
		}
	}, [eventFilters, disabled, setEventFilters]);

	const isHorizontal = orientation === 'horizontal';

	// Safety check for eventFilters
	const safeEventFilters = eventFilters || [];

	return (
		<div className='space-y-4'>
			<div className={cn('flex flex-col', isHorizontal ? 'gap-4' : 'gap-6')}>
				{safeEventFilters.map((eventFilter, index) => {
					// Safety check for individual eventFilter
					if (!eventFilter) {
						return null;
					}

					return (
						<div
							key={index}
							className={cn('relative', isHorizontal ? 'flex h-full w-full gap-4' : 'bg-white rounded-lg border border-input')}>
							<div className={cn(isHorizontal ? 'flex-1 flex gap-4' : 'flex flex-col gap-4 p-6')}>
								<div className={cn('w-full', !isHorizontal && 'relative pr-12')}>
									<Input
										type='text'
										label='Key'
										placeholder='key'
										value={eventFilter.key || ''}
										onChange={(e) => {
											const newEventFilters = [...safeEventFilters];
											if (newEventFilters[index]) {
												newEventFilters[index].key = e;
												setEventFilters(newEventFilters);
											}
										}}
									/>
									{!isHorizontal && (
										<button
											className='absolute right-0 top-8 flex justify-center items-center size-8 rounded-md hover:bg-gray-100 text-gray-500'
											onClick={() => {
												const newEventFilters = [...safeEventFilters];
												newEventFilters.splice(index, 1);
												setEventFilters(newEventFilters);
											}}>
											<RiDeleteBin6Line className='size-4' />
										</button>
									)}
								</div>
								<MultiChipInput
									type='text'
									label='Values'
									placeholder='value'
									value={eventFilter.values || []}
									onChange={(e) => {
										const newEventFilters = [...safeEventFilters];
										if (newEventFilters[index]) {
											newEventFilters[index].values = e;
											setEventFilters(newEventFilters);
										}
									}}
								/>
							</div>
							{isHorizontal && (
								<button
									className='flex justify-center items-center size-10 rounded-md border text-zinc self-end mb-[2px]'
									onClick={() => {
										const newEventFilters = [...safeEventFilters];
										newEventFilters.splice(index, 1);
										setEventFilters(newEventFilters);
									}}>
									<RiDeleteBin6Line className='size-4' />
								</button>
							)}
						</div>
					);
				})}
			</div>

			{/* Error Message */}
			{error && <p className='text-sm text-destructive'>{error}</p>}

			<div className='space-y-2'>
				<p className='text-xs text-muted-foreground'>
					Press Enter in the Value fields to apply your input. Without pressing Enter, values won’t be saved.
				</p>
				<Button
					disabled={disabled}
					variant='outline'
					onClick={() => {
						setEventFilters([...safeEventFilters, { key: '', values: [] }]);
					}}>
					<span className='font-normal flex items-center gap-2'>
						<Plus className='size-4' />
						Event Filter
					</span>
				</Button>
			</div>
		</div>
	);
};

export default EventFilter;
