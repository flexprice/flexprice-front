import { LineItem } from '@/models/Invoice';

const GRANT_ALLOWANCE_KEY = 'subscription_grant_allowance';

/** Amount of the line covered by a subscription grant, or 0 when none. */
export const getGrantAllowance = (item: LineItem): number => Number(item.metadata?.[GRANT_ALLOWANCE_KEY] ?? 0);
