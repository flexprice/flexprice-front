import { useSearchParams } from 'react-router-dom';
import { useEffect } from 'react';

const usePagination = (initialLimit: number = 10) => {
	const [searchParams, setSearchParams] = useSearchParams();
	const page = Number(searchParams.get('page') || '1');

	const reset = () => {
		setSearchParams({ page: '1' });
	};

	// Ensure `page` is set in the query parameters
	useEffect(() => {
		if (!searchParams.get('page')) {
			setSearchParams({ page: '1' });
		}
	}, [searchParams, setSearchParams]);

	const limit = initialLimit;
	const offset = Math.max((page - 1) * limit, 0);

	// Expose current page, limit, offset, and a setter for page
	return {
		limit,
		offset,
		page,
		setPage: (newPage: number) => setSearchParams({ page: String(newPage) }),
		reset,
	};
};

export default usePagination;
