import { ENTITY_STATUS } from '@/models';

export { getFeatureTypeTone } from '@/components/atoms/StatusChip';

export function getFeatureListStatus(status: string | undefined): 'Active' | 'Inactive' {
	return status === ENTITY_STATUS.PUBLISHED ? 'Active' : 'Inactive';
}
