export enum COUPON_TYPE {
	FIXED = 'fixed',
	PERCENTAGE = 'percentage',
}

export enum COUPON_CADENCE {
	ONCE = 'once',
	REPEATED = 'repeated',
	FOREVER = 'forever',
}

export interface CouponRules {
	[key: string]: unknown;
}
