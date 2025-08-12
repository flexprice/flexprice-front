import { ENTITY_STATUS } from '@/models/base';

export const formatBaseEntityStatusToDisplay = (status: ENTITY_STATUS) => {
	switch (status) {
		case ENTITY_STATUS.PUBLISHED:
			return 'Published';
		case ENTITY_STATUS.DELETED:
			return 'Deleted';
		case ENTITY_STATUS.ARCHIVED:
			return 'Archived';
		default:
			return status;
	}
};
