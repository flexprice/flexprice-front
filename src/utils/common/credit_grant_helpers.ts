import { CREDIT_GRANT_EXPIRATION_TYPE, CreditGrant } from '@/models/CreditGrant';

export const formatExpirationType = (expirationType: CREDIT_GRANT_EXPIRATION_TYPE) => {
	switch (expirationType) {
		case CREDIT_GRANT_EXPIRATION_TYPE.DURATION:
			return 'Days';
		case CREDIT_GRANT_EXPIRATION_TYPE.BILLING_CYCLE:
			return 'Subscription period';
		case CREDIT_GRANT_EXPIRATION_TYPE.NEVER:
			return '—';
		default:
			return '—';
	}
};

export const formatExpirationPeriod = (grant: CreditGrant): string => {
	if (
		grant.expiration_type === CREDIT_GRANT_EXPIRATION_TYPE.DURATION &&
		grant.expiration_duration !== null &&
		grant.expiration_duration !== undefined &&
		grant.expiration_duration_unit
	) {
		const duration = grant.expiration_duration;
		const unit = grant.expiration_duration_unit.toLowerCase();

		// Convert plural unit names to singular when duration is 1, and handle pluralization
		let unitName = unit.endsWith('s') ? unit.slice(0, -1) : unit; // Remove 's' from 'days', 'weeks', etc.
		if (duration !== 1) {
			unitName += 's'; // Add 's' back for plural
		}

		return `${duration} ${unitName}`;
	}

	return grant.expiration_type ? formatExpirationType(grant.expiration_type) : '—';
};
