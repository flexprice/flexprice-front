const formatDate = (date: string | Date, locale: string = 'en-US', options?: Intl.DateTimeFormatOptions): string => {
	const parsedDate = new Date(date);

	if (isNaN(parsedDate.getTime())) {
		return 'Invalid Date';
	}

	const defaultOptions: Intl.DateTimeFormatOptions = {
		year: 'numeric',
		month: 'short',
		day: '2-digit',
	};

	return parsedDate.toLocaleDateString(locale, { ...defaultOptions, ...options });
};

export default formatDate;

export const formatDateTime = (dateString: string): string => {
	const date = new Date(dateString);

	if (isNaN(date.getTime())) {
		return 'Invalid Date';
	}

	const options: Intl.DateTimeFormatOptions = {
		year: 'numeric',
		month: 'short',
		day: '2-digit',
		hour: '2-digit',
		minute: '2-digit',
		// second: '2-digit',
		hour12: true,
	};

	return date.toLocaleString('en-US', options);
};

export const formatDateWithMilliseconds = (dateString: string): string => {
	const date = new Date(dateString);

	if (isNaN(date.getTime())) {
		return 'Invalid Date';
	}

	const options: Intl.DateTimeFormatOptions = {
		year: 'numeric',
		month: 'short',
		day: '2-digit',
		hour: '2-digit',
		minute: '2-digit',
		second: '2-digit',
		hour12: true,
	};

	const formattedDate = date.toLocaleString('en-US', options);
	// const milliseconds = date.getMilliseconds().toString().padStart(3, '0');

	return `${formattedDate}`;
};

export const formatDateTimeWithSecondsAndTimezone = (date: string | Date): string => {
	const dateObj = typeof date === 'string' ? new Date(date) : date;

	if (isNaN(dateObj.getTime())) {
		return 'Invalid Date';
	}

	const options: Intl.DateTimeFormatOptions = {
		year: 'numeric',
		month: 'short',
		day: '2-digit',
		hour: '2-digit',
		minute: '2-digit',
		second: '2-digit',
		timeZoneName: 'short',
		hour12: false,
	};

	return dateObj.toLocaleString(undefined, options);
};

/** Calendar/timezone type used by Calendar and date pickers */
export type DateTimezone = 'local' | 'utc';

/** Get calendar day (year, month, date) of a Date in the given zone. Month is 0-indexed. */
export function getCalendarDayInZone(date: Date, zone: DateTimezone): { year: number; month: number; date: number } {
	if (zone === 'utc') {
		return {
			year: date.getUTCFullYear(),
			month: date.getUTCMonth(),
			date: date.getUTCDate(),
		};
	}
	return {
		year: date.getFullYear(),
		month: date.getMonth(),
		date: date.getDate(),
	};
}

/** Create start-of-day (00:00:00.000) in the given timezone. Month is 0-indexed. */
export function startOfDayInZone(year: number, month: number, date: number, zone: DateTimezone): Date {
	if (zone === 'utc') {
		return new Date(Date.UTC(year, month, date, 0, 0, 0, 0));
	}
	return new Date(year, month, date, 0, 0, 0, 0);
}

/** Convert a date to the same calendar day in a different timezone (start of that day in the new zone). */
export function convertDateToTimezone(date: Date, fromZone: DateTimezone, toZone: DateTimezone): Date {
	if (fromZone === toZone) return new Date(date.getTime());
	const { year, month, date: d } = getCalendarDayInZone(date, fromZone);
	return startOfDayInZone(year, month, d, toZone);
}

/** Format a date for display in the given timezone (date only, e.g. "Mar 11, 2026"). */
export function formatDateInZone(date: Date, zone: DateTimezone): string {
	if (isNaN(date.getTime())) return 'Invalid Date';
	const options: Intl.DateTimeFormatOptions = {
		year: 'numeric',
		month: 'short',
		day: '2-digit',
	};
	if (zone === 'utc') {
		return date.toLocaleDateString('en-US', { ...options, timeZone: 'UTC' });
	}
	return date.toLocaleDateString('en-US', options);
}

/** Format a date and time for display in the given timezone. */
export function formatDateTimeInZone(date: Date, zone: DateTimezone): string {
	if (isNaN(date.getTime())) return 'Invalid Date';
	const options: Intl.DateTimeFormatOptions = {
		year: 'numeric',
		month: 'short',
		day: '2-digit',
		hour: '2-digit',
		minute: '2-digit',
		hour12: true,
	};
	if (zone === 'utc') {
		return date.toLocaleString('en-US', { ...options, timeZone: 'UTC' });
	}
	return date.toLocaleString('en-US', options);
}

/**
 * Given a Date (instant), return a Date that when interpreted in local time has the same
 * calendar day as the given date in the given zone. Used so the calendar grid highlights the correct day.
 */
export function toCalendarDisplayDate(value: Date, zone: DateTimezone): Date {
	const { year, month, date: d } = getCalendarDayInZone(value, zone);
	return new Date(year, month, d);
}

/** Get time components (hour, minute, second) of a Date in the given zone. */
export function getTimeInZone(date: Date, zone: DateTimezone): { hours: number; minutes: number; seconds: number } {
	if (zone === 'utc') {
		return {
			hours: date.getUTCHours(),
			minutes: date.getUTCMinutes(),
			seconds: date.getUTCSeconds(),
		};
	}
	return {
		hours: date.getHours(),
		minutes: date.getMinutes(),
		seconds: date.getSeconds(),
	};
}

/** Create a Date with the given calendar day and time in the given timezone. */
export function dateTimeInZone(
	year: number,
	month: number,
	date: number,
	hours: number,
	minutes: number,
	seconds: number,
	zone: DateTimezone,
): Date {
	if (zone === 'utc') {
		return new Date(Date.UTC(year, month, date, hours, minutes, seconds, 0));
	}
	return new Date(year, month, date, hours, minutes, seconds, 0);
}

/** Convert a full datetime to the same calendar date and time in a different timezone. */
export function convertDateTimeToTimezone(date: Date, fromZone: DateTimezone, toZone: DateTimezone): Date {
	if (fromZone === toZone) return new Date(date.getTime());
	const { year, month, date: d } = getCalendarDayInZone(date, fromZone);
	const { hours, minutes, seconds } = getTimeInZone(date, fromZone);
	return dateTimeInZone(year, month, d, hours, minutes, seconds, toZone);
}

/** Format a date as "7 Mar 2026" (day + short month + year) for billing period display. Pass `'utc'` (default) to render the UTC calendar day; `'local'` for the user's timezone. */
export function formatBillingPeriodDate(date: string | Date, zone: DateTimezone = 'utc'): string {
	const dateObj = typeof date === 'string' ? new Date(date) : date;
	if (isNaN(dateObj.getTime())) return 'Invalid Date';
	const day = zone === 'utc' ? dateObj.getUTCDate() : dateObj.getDate();
	const month = dateObj.toLocaleDateString('en-US', { month: 'short', ...(zone === 'utc' ? { timeZone: 'UTC' } : {}) });
	const year = zone === 'utc' ? dateObj.getUTCFullYear() : dateObj.getFullYear();
	return `${day} ${month} ${year}`;
}

/**
 * Back an exclusive period end off to the last instant the period actually covers.
 *
 * Invoice periods are half-open on the API — `period_end` is the first instant *after* the
 * period, so a quarter billed June–August arrives as `1 Sep 2026 00:00:00`. One second earlier
 * is `31 Aug 2026 23:59:59`, the last instant genuinely billed.
 *
 * The subtraction is applied to the exact instant the API sent, and the result must be read back
 * in UTC — see {@link formatPeriodEndDate}. Reading it in the viewer's timezone defeats the
 * adjustment: `1 Sep 00:00Z` is `1 Sep 05:30` in IST, so a second earlier is still 1 Sep locally.
 *
 * Display-only. Never write the shifted value back to the API or into a create/update payload.
 */
export function toInclusivePeriodEnd(periodEnd: string | Date): Date {
	const end = typeof periodEnd === 'string' ? new Date(periodEnd) : periodEnd;
	if (isNaN(end.getTime())) return end;
	return new Date(end.getTime() - 1000);
}

/**
 * Format the last day an invoice period covers, as "31 Aug 2026".
 *
 * Takes the exclusive `period_end` straight from the API, steps back one second, and names that
 * instant's UTC day. UTC because the shifted instant is only meaningful in the zone the boundary
 * was expressed in; the backend computes periods in UTC, so the UTC day is the canonical last day.
 */
export function formatPeriodEndDate(periodEnd: string | Date): string {
	return formatBillingPeriodDate(toInclusivePeriodEnd(periodEnd), 'utc');
}

/** Format a billing period as "1 Jun 2026 - 31 Aug 2026". The start keeps the viewer's local calendar day so IST (etc.) midnight boundaries (e.g. `…T18:30:00Z`) map to the intended day; the exclusive end is rendered inclusively — see {@link formatPeriodEndDate}. */
export function formatBillingPeriod(periodStart: string, periodEnd: string): string {
	return `${formatBillingPeriodDate(periodStart, 'local')} - ${formatPeriodEndDate(periodEnd)}`;
}

/** Format a billing period as "Jun 1, 2026 – Aug 31, 2026" for surfaces that show full dates. Same exclusive-end rule as {@link formatBillingPeriod}. */
export function formatBillingPeriodLong(periodStart: string, periodEnd: string): string {
	const start = new Date(periodStart);
	const end = toInclusivePeriodEnd(periodEnd);
	if (isNaN(start.getTime()) || isNaN(end.getTime())) return 'Invalid Date';
	const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' };
	return `${start.toLocaleDateString('en-US', options)} – ${end.toLocaleDateString('en-US', { ...options, timeZone: 'UTC' })}`;
}
