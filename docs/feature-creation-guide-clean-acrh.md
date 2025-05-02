# Feature Creation Guide

This guide outlines the standard structure and best practices for creating new features in the Flexprice frontend.

## Directory Structure

For each new feature, create the following directory structure:

```
src/
├── features/
│   └── [feature-name]/
│       ├── api/
│       │   └── [feature-name]Api.ts
│       ├── components/
│       │   ├── [FeatureName]Table/
│       │   └── [FeatureName]Form/
│       ├── constants/
│       │   ├── filters.ts
│       │   └── index.ts
│       ├── hooks/
│       │   └── use[FeatureName]List.ts
│       ├── mappers/
│       │   └── [feature-name]Mapper.ts
│       ├── models/
│       │   └── [FeatureName].ts
│       ├── services/
│       │   └── formatters.ts
│       ├── types/
│       │   └── [feature-name].ts
│       └── pages/
│           ├── [FeatureName]s.tsx
│           └── Add[FeatureName].tsx
```

## File Creation Guide

### 1. Model Definition (`models/[FeatureName].ts`)

```typescript
import { BaseEntity } from '@/types/common';

export interface [FeatureName] extends BaseEntity {
  id: string;
  name: string;
  // Add other fields
}

export enum [FeatureName]Type {
  TYPE_1 = 'type_1',
  TYPE_2 = 'type_2',
}

export default [FeatureName];
```

### 2. API Service (`api/[feature-name]Api.ts`)

```typescript
import { AxiosClient } from '@/core/axios/verbs';
import [FeatureName] from '@/models/[FeatureName]';
import { generateQueryParams } from '@/utils/common/api_helper';
import { PaginationType } from '@/models/Pagination';
import { TypedBackendSort, TypedBackendFilter } from '@/types/formatters/QueryBuilder';

interface Get[FeatureName]sPayload extends PaginationType {
  filters: TypedBackendFilter[];
  sorts: TypedBackendSort[];
}

class [FeatureName]Api {
  private static baseUrl = '/[feature-name]s';

  public static async getAll[FeatureName]s(payload: Get[FeatureName]sPayload) {
    return await AxiosClient.post<{ items: [FeatureName][]; pagination: PaginationType }, Get[FeatureName]sPayload>(
      `${this.baseUrl}/search`,
      payload
    );
  }

  public static async get[FeatureName]ById(id: string) {
    return await AxiosClient.get<[FeatureName]>(`${this.baseUrl}/${id}`);
  }

  public static async create[FeatureName](data: Partial<[FeatureName]>) {
    return await AxiosClient.post<[FeatureName], Partial<[FeatureName]>>(this.baseUrl, data);
  }

  public static async update[FeatureName](id: string, data: Partial<[FeatureName]>) {
    return await AxiosClient.put<[FeatureName], Partial<[FeatureName]>>(`${this.baseUrl}/${id}`, data);
  }

  public static async delete[FeatureName](id: string) {
    return await AxiosClient.delete<void>(`${this.baseUrl}/${id}`);
  }
}

export default [FeatureName]Api;
```

### 3. Custom Hook (`hooks/use[FeatureName]List.ts`)

```typescript
import { useQuery } from '@tanstack/react-query';
import [FeatureName]Api from '../api/[feature-name]Api';
import { FilterCondition, SortOption } from '@/types/common/QueryBuilder';
import { convertFiltersAndSortToBackendPayload } from '@/types/formatters/QueryBuilder';
import usePagination from '@/hooks/usePagination';

export const use[FeatureName]List = (filters: FilterCondition[], selectedSorts: SortOption[], page: number) => {
  const { limit, offset } = usePagination();

  return useQuery({
    queryKey: ['fetch[FeatureName]s', page, filters, selectedSorts],
    queryFn: async () => {
      const { filters: backendFilters, sorts: backendSorts } = convertFiltersAndSortToBackendPayload(filters, selectedSorts);
      return await [FeatureName]Api.getAll[FeatureName]s({
        limit,
        offset,
        filters: backendFilters,
        sorts: backendSorts,
      });
    },
  });
};
```

### 4. Constants (`constants/filters.ts`)

```typescript
import { FilterField, FilterFieldType, DEFAULT_OPERATORS_PER_DATA_TYPE, DataType, FilterOperator, SortOption, SortDirection } from '@/types/common/QueryBuilder';
import { BaseEntityStatus } from '@/types/common';
import { [FeatureName]Type } from '@/models/[FeatureName]';

export const [FEATURE_NAME]_SORT_OPTIONS = [
  {
    field: 'name',
    label: 'Name',
    direction: SortDirection.ASC,
  },
  {
    field: 'created_at',
    label: 'Created At',
    direction: SortDirection.DESC,
  },
] as const;

export const [FEATURE_NAME]_FILTER_OPTIONS = [
  {
    field: 'name',
    label: 'Name',
    fieldType: FilterFieldType.INPUT,
    operators: DEFAULT_OPERATORS_PER_DATA_TYPE[DataType.STRING],
    dataType: DataType.STRING,
  },
  {
    field: 'type',
    label: 'Type',
    fieldType: FilterFieldType.MULTI_SELECT,
    operators: DEFAULT_OPERATORS_PER_DATA_TYPE[DataType.ARRAY],
    dataType: DataType.ARRAY,
    options: [
      { value: [FeatureName]Type.TYPE_1, label: 'Type 1' },
      { value: [FeatureName]Type.TYPE_2, label: 'Type 2' },
    ],
  },
] as const;
```

### 5. Formatters (`services/formatters.ts`)

```typescript
import { [FeatureName]Type } from '@/models/[FeatureName]';

export const format[FeatureName]Type = (type: [FeatureName]Type): string => {
  return type.charAt(0).toUpperCase() + type.slice(1);
};

export const format[FeatureName]Status = (status: string): string => {
  return status.charAt(0).toUpperCase() + status.slice(1);
};
```

### 6. Mappers (`mappers/[feature-name]Mapper.ts`)

```typescript
import [FeatureName] from '@/models/[FeatureName]';
import { format[FeatureName]Type, format[FeatureName]Status } from '../services/formatters';
import { formatDate } from '@/utils/common/format_date';

interface [FeatureName]ViewModel extends [FeatureName] {
  displayType: string;
  displayStatus: string;
  formattedUpdatedAt: string;
}

export const map[FeatureName]ToViewModel = (feature: [FeatureName]): [FeatureName]ViewModel => ({
  ...feature,
  displayType: format[FeatureName]Type(feature.type as [FeatureName]Type),
  displayStatus: format[FeatureName]Status(feature.status),
  formattedUpdatedAt: formatDate(feature.updated_at),
});
```

### 7. Table Component (`components/[FeatureName]Table/[FeatureName]Table.tsx`)

```typescript
import { FC } from 'react';
import FlexpriceTable, { ColumnData } from '@/components/molecules/Table';
import [FeatureName] from '@/models/[FeatureName]';
import { ActionButton, Chip } from '@/components/atoms';
import { useNavigate } from 'react-router-dom';
import { RouteNames } from '@/core/routes/Routes';
import [FeatureName]Api from '../api/[feature-name]Api';
import { map[FeatureName]ToViewModel } from '../mappers/[feature-name]Mapper';

interface Props {
  data: [FeatureName][];
  showEmptyRow?: boolean;
}

const [FeatureName]Table: FC<Props> = ({ data, showEmptyRow }) => {
  const navigate = useNavigate();
  const viewModels = data.map(map[FeatureName]ToViewModel);

  const columnData: ColumnData<[FeatureName]ViewModel>[] = [
    {
      fieldName: 'name',
      title: '[FeatureName] Name',
      fieldVariant: 'title',
    },
    {
      title: 'Type',
      render(row) {
        return <Chip label={row.displayType} />;
      },
    },
    {
      title: 'Status',
      render(row) {
        return <Chip variant={row.status === 'published' ? 'success' : 'default'} label={row.displayStatus} />;
      },
    },
    {
      title: 'Updated At',
      render(row) {
        return row.formattedUpdatedAt;
      },
    },
    {
      fieldVariant: 'interactive',
      render(row) {
        return (
          <ActionButton
            deleteMutationFn={async () => {
              return await [FeatureName]Api.delete[FeatureName](row.id);
            }}
            id={row.id}
            editPath={''}
            isEditDisabled={true}
            isArchiveDisabled={row.status === 'archived'}
            refetchQueryKey={'fetch[FeatureName]s'}
            entityName={row.name}
          />
        );
      },
    },
  ];

  return (
    <div>
      <FlexpriceTable
        data={viewModels}
        columns={columnData}
        showEmptyRow={showEmptyRow}
        onRowClick={(row) => {
          navigate(RouteNames.[featureName]Details + `/${row.id}`);
        }}
      />
    </div>
  );
};

export default [FeatureName]Table;
```

### 8. Main Page (`pages/[FeatureName]s.tsx`)

```typescript
import { AddButton, Loader, Page, ShortPagination, Spacer } from '@/components/atoms';
import { ApiDocsContent, QueryBuilder } from '@/components/molecules';
import EmptyPage from '@/components/organisms/EmptyPage/EmptyPage';
import { RouteNames } from '@/core/routes/Routes';
import GUIDES from '@/core/constants/guides';
import usePagination from '@/hooks/usePagination';
import { use[FeatureName]List } from '../hooks/use[FeatureName]List';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { FilterCondition, SortOption } from '@/types/common/QueryBuilder';
import { [FEATURE_NAME]_FILTER_OPTIONS, [FEATURE_NAME]_SORT_OPTIONS } from '../constants/filters';
import [FeatureName]Table from '../components/[FeatureName]Table/[FeatureName]Table';

const [FeatureName]sPage = () => {
  const { limit, offset, page } = usePagination();
  const [filters, setFilters] = useState<FilterCondition[]>([]);
  const [selectedSorts, setSelectedSorts] = useState<SortOption[]>([]);
  const navigate = useNavigate();

  const { data: [featureName]Data, isLoading, isError } = use[FeatureName]List(filters, selectedSorts, page);

  if (isError) {
    toast.error('Error fetching [feature-name]s');
  }

  const showEmptyPage = !isLoading && [featureName]Data?.items.length === 0 && filters.length === 0 && selectedSorts.length === 0;

  if (showEmptyPage) {
    return (
      <EmptyPage
        heading='[FeatureName]'
        onAddClick={() => navigate(RouteNames.create[FeatureName])}
        tags={['[FeatureName]s']}
        tutorials={GUIDES.[featureName]s.tutorials}
      />
    );
  }

  return (
    <Page
      heading='[FeatureName]s'
      headingCTA={
        <Link to={RouteNames.create[FeatureName]}>
          <AddButton />
        </Link>
      }>
      <ApiDocsContent tags={['[FeatureName]s']} />
      <div>
        <QueryBuilder
          filterOptions={[FEATURE_NAME]_FILTER_OPTIONS}
          filters={filters}
          onFilterChange={setFilters}
          sortOptions={[FEATURE_NAME]_SORT_OPTIONS}
          onSortChange={setSelectedSorts}
          selectedSorts={selectedSorts}
        />
        {isLoading ? (
          <Loader />
        ) : (
          <>
            <[FeatureName]Table showEmptyRow data={[featureName]Data?.items || []} />
            <Spacer className='!h-4' />
            <ShortPagination unit='[FeatureName]s' totalItems={[featureName]Data?.pagination.total ?? 0} />
          </>
        )}
      </div>
    </Page>
  );
};

export default [FeatureName]sPage;
```

## Best Practices

1. **Type Safety**

   - Use `as const` for constant arrays and objects
   - Define proper TypeScript interfaces and enums
   - Use type guards for runtime type checking

2. **Code Organization**

   - Keep API logic isolated in the API service
   - Move formatting logic to formatters
   - Use mappers for DTO to ViewModel transformations
   - Keep filter/sort configurations in constants

3. **Component Structure**

   - Follow atomic design principles
   - Keep components small and focused
   - Use composition over inheritance
   - Implement proper prop types

4. **State Management**

   - Use React Query for server state
   - Keep local state minimal
   - Use proper state management patterns

5. **Error Handling**

   - Implement proper error boundaries
   - Use toast notifications for user feedback
   - Handle loading states appropriately

6. **Testing**
   - Write unit tests for components
   - Test API integration
   - Test form validation
   - Test error scenarios

## Naming Conventions

- **Files**: Use kebab-case for file names
- **Components**: Use PascalCase for component names
- **Hooks**: Use camelCase with 'use' prefix
- **Constants**: Use UPPER_SNAKE_CASE
- **Types/Interfaces**: Use PascalCase
- **Enums**: Use PascalCase

## Example Feature Creation

To create a new feature called "Widget":

1. Replace all instances of `[FeatureName]` with `Widget`
2. Replace all instances of `[feature-name]` with `widget`
3. Replace all instances of `[FEATURE_NAME]` with `WIDGET`
4. Create the directory structure
5. Create each file with the appropriate content
6. Update the routing configuration
7. Add the feature to the navigation menu

Remember to:

- Update imports to match your actual file structure
- Add proper error handling
- Implement proper loading states
- Add proper TypeScript types
- Follow the established patterns
- Test thoroughly
