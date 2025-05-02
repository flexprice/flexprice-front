import { PaginationType } from '@/models/Pagination';
import { Payment } from '@/models/Payment';

export interface GetAllPaymentsPayload {
	currency?: string;
	destination_id?: string;
	destination_type?: string;
	end_time?: string;
	expand?: string;
	limit: number;
	offset: number;
	order?: 'asc' | 'desc';
	payment_gateway?: string;
	payment_ids?: string[];
	payment_method_type?: string;
	payment_status?: string;
	sort?: string;
	start_time?: string;
	status?: 'published' | 'deleted' | 'archived' | string;
}

export interface GetAllPaymentsResponse {
	items: Payment[];
	pagination: PaginationType;
}
