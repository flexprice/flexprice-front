import { useQuery } from '@tanstack/react-query';
import { getHttpStatus } from '@/core/axios/types';
import { getEntityDef, shortId } from '@/components/molecules/Activity/entityRegistry';

export type EntityRefState = 'exists' | 'deleted' | 'unknown';

export interface EntityRefResult {
	label: string;
	state: EntityRefState;
}

const useEntityRef = (type: string, id: string) =>
	useQuery<EntityRefResult>({
		queryKey: ['activity-ref', type, id],
		queryFn: async () => {
			const def = getEntityDef(type);
			if (!def) return { label: shortId(id), state: 'unknown' };
			try {
				const r = await def.resolve(id);
				return { label: r.label, state: r.exists ? 'exists' : 'deleted' };
			} catch (e) {
				// Only a definitive not-found marks the entity deleted. Transient
				// errors (5xx, network) rethrow so the ref shows the short id with
				// no misleading "deleted" chip.
				if (getHttpStatus(e) === 404) return { label: shortId(id), state: 'deleted' };
				throw e;
			}
		},
		staleTime: 5 * 60 * 1000,
		enabled: !!type && !!id,
	});

export default useEntityRef;
