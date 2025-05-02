import { Subscription } from '@/models/Subscription';
import CustomerUsage from '@/models/CustomerUsage';
import { PaginationType } from '@/models/Pagination';

export interface GetBillingdetailsResponse {
	subscriptions: Subscription[];
	usage: {
		customer_id: string;
		features: CustomerUsage[];
		pagination: PaginationType;
		period: {
			end_time: string;
			period: string;
			start_time: string;
		};
	};
}
