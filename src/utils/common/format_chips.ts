import { ENTITY_STATUS } from '@/models/base';

const formatChips = (data: ENTITY_STATUS): string => {
	switch (data) {
		case ENTITY_STATUS.PUBLISHED:
			return 'Active';
		case ENTITY_STATUS.ARCHIVED:
			return 'Inactive';
		case ENTITY_STATUS.DELETED:
			return 'Deleted';
		default:
			return 'Inactive';
	}
};

export default formatChips;
