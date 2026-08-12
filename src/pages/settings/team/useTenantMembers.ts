import { useQuery, useMutation } from '@tanstack/react-query';
import { UserApi } from '@/api/UserApi';
import { refetchQueries } from '@/core/services/tanstack/ReactQueryProvider';
import { SETTINGS_MEMBERS_PAGE_SIZE } from '../constants';
import { settingsQueryKeys } from '../queryKeys';
import { CreateTenantUserRequest } from '@/types/dto/UserApi';

const TEAM_MEMBERS_REFETCH_INTERVAL_MS = 30_000;

export function useTenantMembers() {
	const query = useQuery({
		queryKey: settingsQueryKeys.teamMembersRoot(),
		queryFn: () =>
			UserApi.getTenantMembers({
				limit: 1000,
				offset: 0,
			}),
		refetchOnMount: 'always',
		refetchOnWindowFocus: true,
		refetchInterval: TEAM_MEMBERS_REFETCH_INTERVAL_MS,
	});

	const createUser = useMutation({
		mutationFn: (payload: CreateTenantUserRequest) => UserApi.addUserToTenant(payload),
		onSuccess: () => {
			refetchQueries([...settingsQueryKeys.teamMembersRoot()]);
		},
	});

	return {
		...query,
		members: query.data?.items ?? [],
		totalMembers: query.data?.pagination?.total ?? query.data?.items?.length ?? 0,
		pageSize: SETTINGS_MEMBERS_PAGE_SIZE,
		createUser,
	};
}
