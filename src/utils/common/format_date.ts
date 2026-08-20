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

/** Shared table/list date shape — keep in one place for eslint + consistency. */
export const TABLE_SHORT_DATE_FORMAT: Intl.DateTimeFormatOptions = {
	day: 'numeric',
	month: 'short',
	year: 'numeric',
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

/** Format a date as "7 Mar" (day + short month) for billing period display. Pass `'utc'` (default) to render the UTC calendar day; `'local'` for the user's timezone. */
export function formatBillingPeriodDate(date: string | Date, zone: DateTimezone = 'utc'): string {
	const dateObj = typeof date === 'string' ? new Date(date) : date;
	if (isNaN(dateObj.getTime())) return 'Invalid Date';
	const day = zone === 'utc' ? dateObj.getUTCDate() : dateObj.getDate();
	const month = dateObj.toLocaleDateString('en-US', { month: 'short', ...(zone === 'utc' ? { timeZone: 'UTC' } : {}) });
	return `${day} ${month}`;
}

/** Format a billing period as "7 Mar - 8 Dec". Both ends use the user's local timezone so IST (etc.) midnight boundaries (e.g. `…T18:30:00Z`) map to the intended calendar day. */
export function formatBillingPeriod(periodStart: string, periodEnd: string): string {
	return `${formatBillingPeriodDate(periodStart, 'local')} - ${formatBillingPeriodDate(periodEnd, 'local')}`;
}
