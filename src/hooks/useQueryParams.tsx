import { useLocation, useNavigate } from 'react-router';
import { useState, useEffect } from 'react';

// Define a type-safe custom hook
const useQueryParams = <T extends Record<string, string>>(initialParams: T = {} as T) => {
	const location = useLocation();
	const navigate = useNavigate();

	// Parse the query string into an object
	const getQueryParams = (): T => {
		const searchParams = new URLSearchParams(location.search);
		const params = {} as T;

		searchParams.forEach((value, key) => {
			if (key in initialParams) {
				params[key as keyof T] = value as T[keyof T];
			} else {
				params[key as keyof T] = value as T[keyof T];
			}
		});

		return params;
	};

	const [queryParams, setQueryParams] = useState<T>(() => {
		const currentParams = getQueryParams();
		// Merge with initial params (without overwriting existing params)
		return { ...initialParams, ...currentParams };
	});

	// Sync with URL whenever location changes
	useEffect(() => {
		setQueryParams(getQueryParams());
	}, [location.search]);

	// Update a specific query param in the URL
	const setQueryParam = (field: keyof T, value: T[keyof T]): void => {
		const searchParams = new URLSearchParams(location.search);

		// Set or update the query param
		searchParams.set(field as string, value as string);

		// Update the URL
		navigate(
			{
				pathname: location.pathname,
				search: `?${searchParams.toString()}`,
			},
			// { replace: true },
		);

		// Update the local state
		setQueryParams(getQueryParams());
	};

	return {
		queryParams,
		setQueryParam,
	};
};

export default useQueryParams;
