import { COUPON_CADENCE, COUPON_TYPE } from '@/types/common';
import { getCurrencySymbol } from './helper_functions';
import { Coupon } from '@/models/Coupon';

interface FormatCouponNameOptions {
	/** Omit "once" / "forever" / "for N billing cycles"; cadence only applies to subscriptions. */
	showCadence?: boolean;
}

const formatCouponName = (coupon: Coupon, { showCadence = true }: FormatCouponNameOptions = {}) => {
	let couponName: string;
	if (coupon.type === COUPON_TYPE.FIXED) {
		couponName = `${getCurrencySymbol(coupon.currency)} ${coupon.amount_off} off`;
	} else {
		couponName = `${coupon.percentage_off}% off`;
	}
	if (!showCadence) {
		return couponName;
	}
	if (coupon.cadence === COUPON_CADENCE.ONCE) {
		couponName = `${couponName} once`;
	} else if (coupon.cadence === COUPON_CADENCE.REPEATED) {
		couponName = `${couponName} for ${coupon.duration_in_periods} billing cycles`;
	} else if (coupon.cadence === COUPON_CADENCE.FOREVER) {
		couponName = `${couponName} forever`;
	}

	return couponName;
};

export default formatCouponName;
