# API Integration Guide

## Overview

This guide explains how to integrate with the FlexPrice backend API in the frontend application. We use a hybrid approach combining Axios for HTTP requests and TanStack Query (React Query) for efficient data fetching, caching, and state management.

## API Client Setup

### Base Configuration

```typescript
// src/core/api/client.ts
import axios from 'axios';

const apiClient = axios.create({
	baseURL: import.meta.env.VITE_API_URL,
	headers: {
		'Content-Type': 'application/json',
	},
});

// Add auth token to requests
apiClient.interceptors.request.use((config) => {
	const token = localStorage.getItem('auth_token');
	if (token) {
		config.headers.Authorization = `Bearer ${token}`;
	}
	return config;
});
```

## API Service Pattern

### 1. Create API Service

```typescript
// src/utils/api_requests/FeatureApi.ts
import { apiClient } from '@/core/api/client';

interface Feature {
	id: string;
	name: string;
	description: string;
}

interface PaginatedResponse<T> {
	items: T[];
	pagination: {
		total: number;
		limit: number;
		offset: number;
	};
}

export const FeatureApi = {
	getAllFeatures: async ({ limit, offset }: { limit: number; offset: number }) => {
		const response = await apiClient.get<PaginatedResponse<Feature>>('/features', {
			params: { limit, offset },
		});
		return response.data;
	},
};
```

### 2. Using TanStack Query

```typescript
// src/pages/product-catalog/features/Features.tsx
import { useQuery } from '@tanstack/react-query';
import { FeatureApi } from '@/api/FeatureApi';

const FeaturesPage = () => {
	const { limit, offset, page } = usePagination();

	const {
		data: featureData,
		isLoading,
		isError,
	} = useQuery({
		queryKey: ['fetchFeatures', page],
		queryFn: () => FeatureApi.getAllFeatures({ limit, offset }),
	});

	if (isLoading) return <Loader />;
	if (isError) toast.error('Error fetching features');

	return (
		// ... render component
	);
};
```

## Query Configuration

### 1. Query Client Setup

```typescript
// src/core/query/queryClient.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			staleTime: 5 * 60 * 1000, // 5 minutes
			cacheTime: 10 * 60 * 1000, // 10 minutes
			retry: 1,
			refetchOnWindowFocus: false,
		},
	},
});
```

### 2. Query Provider

```typescript
// src/App.tsx
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/core/query/queryClient';

function App() {
	return (
		<QueryClientProvider client={queryClient}>
			{/* Your app components */}
		</QueryClientProvider>
	);
}
```

## Mutation Patterns

### 1. Create Mutation

```typescript
// src/utils/api_requests/FeatureApi.ts
export const FeatureApi = {
	// ... existing methods

	createFeature: async (feature: Omit<Feature, 'id'>) => {
		const response = await apiClient.post<Feature>('/features', feature);
		return response.data;
	},
};
```

### 2. Using Mutations

```typescript
// src/components/molecules/FeatureForm.tsx
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { FeatureApi } from '@/api/FeatureApi';

const FeatureForm = () => {
	const queryClient = useQueryClient();

	const mutation = useMutation({
		mutationFn: FeatureApi.createFeature,
		onSuccess: () => {
			// Invalidate and refetch features query
			queryClient.invalidateQueries({ queryKey: ['fetchFeatures'] });
			toast.success('Feature created successfully');
		},
		onError: (error) => {
			toast.error('Failed to create feature');
		},
	});

	const onSubmit = (data: FeatureFormData) => {
		mutation.mutate(data);
	};

	return (
		// ... form JSX
	);
};
```

## Error Handling

### 1. Global Error Handling

```typescript
// src/core/api/client.ts
apiClient.interceptors.response.use(
	(response) => response,
	(error) => {
		if (error.response?.status === 401) {
			// Handle unauthorized
			auth.logout();
		}
		return Promise.reject(error);
	},
);
```

### 2. Query Error Handling

```typescript
const { data, error } = useQuery({
	queryKey: ['fetchFeatures'],
	queryFn: FeatureApi.getAllFeatures,
	onError: (error) => {
		if (axios.isAxiosError(error)) {
			switch (error.response?.status) {
				case 401:
					// Handle unauthorized
					break;
				case 404:
					// Handle not found
					break;
				default:
				// Handle other errors
			}
		}
	},
});
```

## Performance Optimization

### 1. Query Caching

```typescript
// Configure cache behavior
const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			staleTime: 5 * 60 * 1000, // Data considered fresh for 5 minutes
			cacheTime: 10 * 60 * 1000, // Cache kept for 10 minutes
			refetchOnWindowFocus: false, // Don't refetch on window focus
		},
	},
});
```

### 2. Pagination

```typescript
// src/hooks/usePagination.ts
export const usePagination = () => {
	const [page, setPage] = useState(1);
	const limit = 10;
	const offset = (page - 1) * limit;

	return { page, limit, offset, setPage };
};
```

## Testing

### 1. Mock API Responses

```typescript
// src/core/api/__mocks__/apiClient.ts
jest.mock('../client', () => ({
	apiClient: {
		get: jest.fn(),
		post: jest.fn(),
		patch: jest.fn(),
		delete: jest.fn(),
	},
}));
```

### 2. Query Testing

```typescript
// src/components/__tests__/Features.test.tsx
import { renderHook } from '@testing-library/react-hooks';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

describe('Features', () => {
	const queryClient = new QueryClient();

	it('should fetch features', async () => {
		const { result } = renderHook(
			() => useQuery({
				queryKey: ['fetchFeatures'],
				queryFn: FeatureApi.getAllFeatures,
			}),
			{
				wrapper: ({ children }) => (
					<QueryClientProvider client={queryClient}>
						{children}
					</QueryClientProvider>
				),
			}
		);

		await waitFor(() => {
			expect(result.current.isSuccess).toBe(true);
		});
	});
});
```

## Best Practices

1. Use TanStack Query for data fetching and caching
2. Keep API services organized by domain
3. Implement proper error handling and loading states
4. Use TypeScript for type safety
5. Implement proper pagination for large datasets
6. Use optimistic updates for better UX
7. Implement proper retry logic
8. Use proper cache invalidation strategies
9. Implement proper error boundaries
10. Use proper loading states and skeletons

## Common API Endpoints

### Usage Metrics

- `GET /api/v1/usage` - Get usage metrics
- `POST /api/v1/usage/events` - Log usage events

### Billing

- `GET /api/v1/billing/invoices` - Get invoices
- `POST /api/v1/billing/subscription` - Update subscription

### User Management

- `GET /api/v1/users/me` - Get current user
- `PATCH /api/v1/users/me` - Update user profile

## Error Codes and Handling

| Code | Description       | Action                    |
| ---- | ----------------- | ------------------------- |
| 400  | Bad Request       | Check request parameters  |
| 401  | Unauthorized      | Refresh token or re-login |
| 403  | Forbidden         | Check user permissions    |
| 404  | Not Found         | Verify resource exists    |
| 429  | Too Many Requests | Implement rate limiting   |
| 500  | Server Error      | Contact support           |

## Security Best Practices

1. Always use HTTPS
2. Implement proper token management
3. Sanitize user inputs
4. Use environment variables for sensitive data
5. Implement proper CORS policies

## Performance Optimization

1. Implement request caching
2. Use pagination for large datasets
3. Implement request debouncing
4. Use compression for large payloads
5. Implement proper error boundaries
