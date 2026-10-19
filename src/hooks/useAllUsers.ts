import { useQuery } from '@tanstack/react-query';
import { UserApi } from '@/api';
import { GetServiceAccountsResponse } from '@/types/dto/UserApi';

export const USE_ALL_USERS_QUERY_KEY = ['getAllUsers'] as const;

const useAllUsers = (options: { enabled?: boolean } = {}) => {
	const { data, isLoading, isError, error } = useQuery<GetServiceAccountsResponse>({
		queryKey: USE_ALL_USERS_QUERY_KEY,
		queryFn: () => UserApi.getAllUsers(),
		enabled: options.enabled ?? true,
	});

	return {
		users: data,
		isLoading,
		isError,
		error,
	};
};

export default useAllUsers;
