import { BILLING_PERIOD } from '@/core/data/constants';

export function calculateCalendarBillingAnchor(startDate: Date, billingPeriod: BILLING_PERIOD): Date {
	const now = new Date(startDate.toUTCString());

	switch (billingPeriod) {
		case BILLING_PERIOD.DAILY: {
			// Start of next day: 00:00:00
			return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0, 0));
		}

		case BILLING_PERIOD.WEEKLY: {
			// Start of next week (Monday)
			const daysUntilMonday = (8 - now.getUTCDay()) % 7;
			const nextMonday = daysUntilMonday === 0 ? 7 : daysUntilMonday;
			return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + nextMonday, 0, 0, 0, 0));
		}

		case BILLING_PERIOD.MONTHLY: {
			// Start of next month
			return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1, 0, 0, 0, 0));
		}

		case BILLING_PERIOD.QUARTERLY: {
			// Start of next quarter
			const quarter = Math.floor(now.getUTCMonth() / 3) + 1;
			let startNextQuarterMonth = quarter * 3 + 1;
			let year = now.getUTCFullYear();

			if (startNextQuarterMonth > 12) {
				startNextQuarterMonth -= 12;
				year += 1;
			}

			return new Date(Date.UTC(year, startNextQuarterMonth - 1, 1, 0, 0, 0, 0));
		}

		case BILLING_PERIOD.HALF_YEARLY: {
			// Start of next half-year
			const halfYear = Math.floor(now.getUTCMonth() / 6) + 1;
			let startNextHalfYearMonth = halfYear * 6 + 1;
			let year = now.getUTCFullYear();

			if (startNextHalfYearMonth > 12) {
				startNextHalfYearMonth -= 12;
				year += 1;
			}

			return new Date(Date.UTC(year, startNextHalfYearMonth - 1, 1, 0, 0, 0, 0));
		}

		case BILLING_PERIOD.ANNUAL: {
			// Start of next year
			return new Date(Date.UTC(now.getUTCFullYear() + 1, 0, 1, 0, 0, 0, 0));
		}

		default:
			return now;
	}
}
