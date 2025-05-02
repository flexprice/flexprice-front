import { Meter } from '@/models/Meter';

import { PaginationType } from '@/models/Pagination';

export interface getAllMetersResponse {
	items: Meter[];
	pagination: PaginationType;
}
