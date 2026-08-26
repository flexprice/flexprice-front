import * as React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { DayPicker } from 'react-day-picker';

import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export type CalendarTimezone = 'local' | 'utc';

export type CalendarProps = React.ComponentProps<typeof DayPicker> & {
	timezone?: CalendarTimezone;
	onTimezoneChange?: (tz: CalendarTimezone) => void;
};

function Calendar({ className, classNames, showOutsideDays = true, timezone, onTimezoneChange, ...props }: CalendarProps) {
	const { t } = useTranslation('common');
	const showTimezone = timezone !== undefined || onTimezoneChange !== undefined;
	const currentTz = timezone ?? 'local';
	const isInteractive = onTimezoneChange !== undefined;

	return (
		<div className='flex flex-col'>
			<DayPicker
				showOutsideDays={showOutsideDays}
				className={cn('p-3 relative', className)}
				classNames={{
					months: 'flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0',
					month: 'space-y-4',
					month_caption: 'flex justify-center pt-1 relative items-center',
					caption_label: 'text-sm font-medium',
					nav: 'space-x-1 flex items-center',
					// `nav` renders as a sibling of `month`/`month_caption` (not nested inside it) in
					// react-day-picker v10, so the buttons anchor to the calendar root (`relative` above,
					// on the DayPicker's own className) rather than to `month_caption` — pin `top`
					// explicitly rather than relying on the absolute-positioning "static position"
					// fallback, which put them on top of the day grid instead of the caption row.
					// `z-10`: day cells are also `position: relative` (for focus/selection styling) and
					// sit later in the DOM, so without an explicit stacking order the day grid's top
					// row paints over part of these buttons, leaving only their outer edge clickable.
					button_previous: cn(
						buttonVariants({ variant: 'outline' }),
						'h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 absolute left-1 top-3 z-10',
					),
					button_next: cn(
						buttonVariants({ variant: 'outline' }),
						'h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 absolute right-1 top-3 z-10',
					),
					month_grid: 'w-full border-collapse space-y-1',
					weekdays: 'flex',
					weekday: 'text-muted-foreground rounded-[6px] w-8 font-normal text-[0.8rem]',
					week: 'flex w-full mt-2',
					day: cn(
						'relative p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-accent [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected].day-range-end)]:rounded-e-[6px]',
						props.mode === 'range'
							? '[&:has(>.day-range-end)]:rounded-e-[6px] [&:has(>.day-range-start)]:rounded-s-[6px] first:[&:has([aria-selected])]:rounded-s-[6px] last:[&:has([aria-selected])]:rounded-e-[6px]'
							: '[&:has([aria-selected])]:rounded-[6px]',
					),
					day_button: cn(buttonVariants({ variant: 'ghost' }), 'h-8 w-8 p-0 font-normal aria-selected:opacity-100'),
					range_start: 'day-range-start',
					range_end: 'day-range-end',
					selected:
						'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground',
					today: 'bg-accent text-accent-foreground',
					outside: 'day-outside text-muted-foreground aria-selected:bg-accent/50 aria-selected:text-muted-foreground',
					disabled: 'text-muted-foreground opacity-50',
					range_middle: 'aria-selected:bg-accent aria-selected:text-accent-foreground',
					hidden: 'invisible',
					...classNames,
				}}
				components={{
					Chevron: ({ className, orientation }) =>
						orientation === 'right' ? (
							<ChevronRight className={cn('h-4 w-4', className)} />
						) : (
							<ChevronLeft className={cn('h-4 w-4', className)} />
						),
				}}
				{...props}
			/>
			{showTimezone && (
				<div className='mt-3 pt-3 border-t border-border px-3 pb-2.5' role='group' aria-label={t('dateTime.timezoneSectionAriaLabel')}>
					<div className='flex items-center justify-between gap-3'>
						<span className='text-xs text-muted-foreground font-normal'>{t('dateTime.timezoneSectionLabel')}</span>
						{isInteractive ? (
							<Select value={currentTz} onValueChange={(value) => onTimezoneChange(value as CalendarTimezone)}>
								<SelectTrigger className='h-8 min-w-[5.25rem] w-[5.25rem] border-border bg-background px-2.5 text-xs font-normal shadow-none focus:ring-2 focus:ring-ring focus:ring-offset-1 [&>svg]:h-3.5 [&>svg]:w-3.5'>
									<SelectValue />
								</SelectTrigger>
								<SelectContent align='end' side='top' className='z-[70]'>
									<SelectItem value='local' className='text-xs'>
										{t('dateTime.timezoneLocal')}
									</SelectItem>
									<SelectItem value='utc' className='text-xs'>
										{t('dateTime.timezoneUtc')}
									</SelectItem>
								</SelectContent>
							</Select>
						) : (
							<span className='text-xs text-foreground font-medium'>
								{currentTz === 'local' ? t('dateTime.timezoneLocal') : t('dateTime.timezoneUtc')}
							</span>
						)}
					</div>
				</div>
			)}
		</div>
	);
}
Calendar.displayName = 'Calendar';

export { Calendar };
