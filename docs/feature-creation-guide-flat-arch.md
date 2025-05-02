# Feature Creation Guide (Flat Architecture)

This guide outlines an alternative structure for organizing feature files by type rather than by feature. This approach can be useful for smaller features or when you want to keep related files together.

## Directory Structure

```
src/
├── api/
│   └── [feature-name]Api.ts
├── models/
│   └── [FeatureName].ts
├── formatters/
│   └── [feature-name]Formatters.ts
├── mappers/
│   └── [feature-name]Mapper.ts
├── constants/
│   └── [feature-name]Constants.ts
├── hooks/
│   └── use[FeatureName]List.ts
├── components/
│   ├── [FeatureName]Table/
│   └── [FeatureName]Form/
└── pages/
    └── [feature-name]/
        ├── [FeatureName]s.tsx
        └── Add[FeatureName].tsx
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

### 3. Formatters (`formatters/[feature-name]Formatters.ts`)

```typescript
import { [FeatureName]Type } from '@/models/[FeatureName]';

export const format[FeatureName]Type = (type: [FeatureName]Type): string => {
  return type.charAt(0).toUpperCase() + type.slice(1);
};

export const format[FeatureName]Status = (status: string): string => {
  return status.charAt(0).toUpperCase() + status.slice(1);
};
```

### 4. Mappers (`mappers/[feature-name]Mapper.ts`)

```typescript
import [FeatureName] from '@/models/[FeatureName]';
import { format[FeatureName]Type, format[FeatureName]Status } from '../formatters/[feature-name]Formatters';
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

### 5. Constants (`constants/[feature-name]Constants.ts`)

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

### 6. Custom Hook (`hooks/use[FeatureName]List.ts`)

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

### 8. Main Page (`pages/[feature-name]/[FeatureName]s.tsx`)

```typescript
import { AddButton, Loader, Page, ShortPagination, Spacer } from '@/components/atoms';
import { ApiDocsContent, QueryBuilder } from '@/components/molecules';
import EmptyPage from '@/components/organisms/EmptyPage/EmptyPage';
import { RouteNames } from '@/core/routes/Routes';
import GUIDES from '@/core/constants/guides';
import usePagination from '@/hooks/usePagination';
import { use[FeatureName]List } from '@/hooks/use[FeatureName]List';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { FilterCondition, SortOption } from '@/types/common/QueryBuilder';
import { [FEATURE_NAME]_FILTER_OPTIONS, [FEATURE_NAME]_SORT_OPTIONS } from '@/constants/[feature-name]Constants';
import [FeatureName]Table from '@/components/[FeatureName]Table/[FeatureName]Table';

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

## Benefits of Flat Architecture

1. **Centralized Organization**

   - All API services in one place
   - All models in one place
   - All formatters in one place
   - Easier to find related files

2. **Code Reusability**

   - Easier to share common functionality
   - Better visibility of available utilities
   - Reduced duplication

3. **Simplified Imports**

   - Consistent import paths
   - Clearer dependency structure
   - Easier to maintain

4. **Better for Smaller Features**
   - Less directory nesting
   - Quicker to create new features
   - Easier to maintain

## When to Use Flat Architecture

1. **Small to Medium Features**

   - When the feature has few files
   - When the feature is self-contained
   - When there's little shared functionality

2. **Shared Utilities**

   - When multiple features use the same utilities
   - When you want to maintain a single source of truth
   - When you want to avoid duplication

3. **Quick Development**
   - When you need to prototype quickly
   - When the feature is experimental
   - When the structure might change

## When to Use Feature-Based Architecture

1. **Large Features**

   - When the feature has many files
   - When the feature is complex
   - When there's significant shared functionality

2. **Independent Features**

   - When features are truly independent
   - When features have different requirements
   - When features need different versions of utilities

3. **Team Organization**
   - When different teams work on different features
   - When features have different release cycles
   - When features need different testing strategies

## Best Practices for Flat Architecture

1. **Naming Conventions**

   - Prefix files with feature name
   - Use consistent naming patterns
   - Make names self-documenting

2. **File Organization**

   - Group related files together
   - Use clear file names
   - Keep files focused

3. **Import Management**

   - Use absolute imports
   - Keep imports clean
   - Avoid circular dependencies

4. **Code Splitting**
   - Split large files
   - Keep related code together
   - Use proper exports

## Example Feature Creation

To create a new feature called "Widget":

1. Replace all instances of `[FeatureName]` with `Widget`
2. Replace all instances of `[feature-name]` with `widget`
3. Replace all instances of `[FEATURE_NAME]` with `WIDGET`
4. Create files in the appropriate directories
5. Update imports to use the new structure
6. Update the routing configuration
7. Add the feature to the navigation menu

Remember to:

- Use consistent naming
- Keep files focused
- Maintain clean imports
- Follow established patterns
- Test thoroughly
