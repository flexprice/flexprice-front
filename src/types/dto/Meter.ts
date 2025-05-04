import { Meter } from '@/models/Meter';

import { PaginationType } from '@/models/Pagination';

export interface GetAllMetersResponse {
	items: Meter[];
	pagination: PaginationType;
}
