# FlexPrice Frontend Developer Onboarding Guide

## Table of Contents

1. [Project Overview](#project-overview)
2. [Getting Started](#getting-started)
3. [Project Structure](#project-structure)
4. [Development Workflow](#development-workflow)
5. [Adding New Features](#adding-new-features)
6. [Best Practices](#best-practices)
7. [Common Patterns](#common-patterns)

## Project Overview

FlexPrice is a pricing management platform built with:

- React + TypeScript
- TanStack Query for data fetching
- Shadcn UI components
- Tailwind CSS for styling

### Key Features

- Environment management
- Product catalog
- Customer management
- Subscription handling
- Usage tracking
- Invoice management

## Getting Started

1. **Setup Local Environment**

```bash
# Clone repository
git clone [repository-url]

# Install dependencies
npm install

# Start development server
npm run dev
```

2. **Required Extensions**

- ESLint
- Prettier
- Tailwind CSS IntelliSense

3. **Environment Configuration**

- Copy `.env.example` to `.env.local`
- Get required API keys from team lead

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── atoms/          # Basic components (buttons, inputs)
│   ├── molecules/      # Composite components
│   └── organisms/      # Complex components
├── pages/              # Route components
├── hooks/              # Custom React hooks
├── store/              # Global state management
├── utils/              # Helper functions
│   └── api_requests/   # API integration
├── models/             # TypeScript interfaces
└── core/              # Core application logic
```

## Development Workflow

### 1. Branch Management

```bash
# Create feature branch
git checkout -b feat/[feature-name]

# Create bugfix branch
git checkout -b fix/[bug-name]
```

### 2. Code Organization

- Follow atomic design principles
- Keep components focused and single-responsibility
- Use TypeScript interfaces for type safety

### 3. Testing

- Write unit tests for critical business logic
- Test component behavior
- Run tests before committing: `npm run test`

## Adding New Features

### Step 1: Planning

1. Understand requirements
2. Identify affected components
3. Plan data structure
4. Design component hierarchy

### Step 2: Implementation

#### Creating a New Page

1. Create page component in `src/pages/`:

```typescript
// src/pages/NewFeature/NewFeaturePage.tsx
import { useQuery } from '@tanstack/react-query';
import { NewFeatureApi } from '@/api/NewFeatureApi';

export const NewFeaturePage = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['new-feature'],
    queryFn: NewFeatureApi.getData
  });

  return (
    <div>
      {/* Implementation */}
    </div>
  );
};
```

2. Add route in `src/core/routes/Routes.tsx`
3. Create necessary API integration

#### Creating API Integration

1. Create new file in `src/utils/api_requests/`:

```typescript
// src/utils/api_requests/NewFeatureApi.ts
import { AxiosClient } from '@/core/axios/verbs';

interface NewFeatureData {
	// Define interface
}

class NewFeatureApi {
	private static baseUrl = '/new-feature';

	public static async getData(): Promise<NewFeatureData> {
		return await AxiosClient.get(this.baseUrl);
	}
}

export default NewFeatureApi;
```

#### Creating Components

1. Determine component level (atom/molecule/organism)
2. Create component with proper types:

```typescript
// src/components/molecules/NewFeature/NewFeature.tsx
interface Props {
  data: NewFeatureData;
  onAction: (id: string) => void;
}

export const NewFeature: React.FC<Props> = ({ data, onAction }) => {
  return (
    // Implementation
  );
};
```

### Step 3: Testing & Quality Assurance

1. Write unit tests
2. Test edge cases
3. Check performance
4. Verify accessibility
5. Review code against conventions

## Best Practices

### 1. State Management

- Use React Query for server state
- Use local state for UI state
- Use context for shared state
- Consider Zustand for complex state

### 2. Error Handling

```typescript
try {
	await api.request();
} catch (error) {
	toast.error('Operation failed');
	// Log error if needed
}
```

### 3. Performance

- Use React.memo for expensive components
- Implement proper loading states
- Optimize re-renders
- Use proper query caching

### 4. Code Style

- Follow ESLint rules
- Use TypeScript strictly
- Write meaningful comments
- Use proper naming conventions

## Common Patterns

### 1. Data Fetching

```typescript
const { data, isLoading, error } = useQuery({
	queryKey: ['key'],
	queryFn: fetchData,
});
```

### 2. Form Handling

```typescript
import { useForm } from 'react-hook-form';

const { register, handleSubmit } = useForm<FormData>();
```

### 3. Error Boundaries

```typescript
<ErrorBoundary fallback={<ErrorComponent />}>
  <Component />
</ErrorBoundary>
```

### 4. Loading States

```typescript
{isLoading ? (
  <LoadingSpinner />
) : error ? (
  <ErrorMessage error={error} />
) : (
  <DataDisplay data={data} />
)}
```

## Troubleshooting Common Issues

1. **Build Errors**

   - Check TypeScript errors
   - Verify import paths
   - Check for missing dependencies

2. **Runtime Errors**

   - Check browser console
   - Verify API responses
   - Check state management

3. **Performance Issues**
   - Use React DevTools
   - Check for unnecessary re-renders
   - Verify query caching

Remember: When in doubt, refer to existing implementations as examples and don't hesitate to ask for help from the team.
