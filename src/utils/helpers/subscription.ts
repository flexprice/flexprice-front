import { BILLING_PERIOD } from '@/core/data/constants';

export function calculateCalendarBillingAnchor(startDate: Date, billingPeriod: BILLING_PERIOD): Date {
	const now = new Date(startDate.toUTCString());

	switch (billingPeriod) {
		case BILLING_PERIOD.DAILY: {
			// Start of next day: 00:00:00
			now.setUTCDate(now.getUTCDate() + 1);
			now.setUTCHours(0, 0, 0, 0);
			return now;
		}

		case BILLING_PERIOD.WEEKLY: {
			// Start of next week (Monday)
			const daysUntilMonday = (8 - now.getUTCDay()) % 7;
			now.setUTCDate(now.getUTCDate() + (daysUntilMonday || 7));
			now.setUTCHours(0, 0, 0, 0);
			return now;
		}

		case BILLING_PERIOD.MONTHLY: {
			// Start of next month
			now.setUTCMonth(now.getUTCMonth() + 1, 1);
			now.setUTCHours(0, 0, 0, 0);
			return now;
		}

		case BILLING_PERIOD.QUARTERLY: {
			// Start of next quarter
			const quarter = Math.floor(now.getUTCMonth() / 3) + 1;
			let startNextQuarterMonth = quarter * 3 + 1;

			if (startNextQuarterMonth > 12) {
				startNextQuarterMonth -= 12;
				now.setUTCFullYear(now.getUTCFullYear() + 1);
			}

			now.setUTCMonth(startNextQuarterMonth - 1, 1);
			now.setUTCHours(0, 0, 0, 0);
			return now;
		}

		case BILLING_PERIOD.HALF_YEARLY: {
			// Start of next half-year
			const halfYear = Math.floor(now.getUTCMonth() / 6) + 1;
			let startNextHalfYearMonth = halfYear * 6 + 1;

			if (startNextHalfYearMonth > 12) {
				startNextHalfYearMonth -= 12;
				now.setUTCFullYear(now.getUTCFullYear() + 1);
			}

			now.setUTCMonth(startNextHalfYearMonth - 1, 1);
			now.setUTCHours(0, 0, 0, 0);
			return now;
		}

		case BILLING_PERIOD.ANNUAL: {
			// Start of next year
			now.setUTCFullYear(now.getUTCFullYear() + 1, 0, 1);
			now.setUTCHours(0, 0, 0, 0);
			return now;
		}

		default:
			return now;
	}
}
