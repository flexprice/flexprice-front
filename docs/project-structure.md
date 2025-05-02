# FlexPrice Frontend Project Structure

## Directory Overview

```
src/
├── components/          # UI Components
│   ├── atoms/          # Basic UI elements
│   ├── molecules/      # Composite components
│   └── organisms/      # Complex UI sections
├── core/               # Core application logic
│   ├── axios/          # API client configuration
│   ├── routes/         # Route definitions
│   └── tanstack/       # Query client setup
├── hooks/              # Custom React hooks
├── lib/                # Third-party configurations
├── models/             # TypeScript interfaces
├── pages/              # Route components
├── store/              # Global state management
└── utils/              # Helper functions
    ├── api_requests/   # API integration
    └── common/         # Shared utilities
```

## Key Directories Explained

### 1. Components (`src/components/`)

#### Atoms

- Basic building blocks
- Single responsibility
- No business logic
- Examples: Button, Input, Checkbox

```typescript
// src/components/atoms/Button/Button.tsx
interface ButtonProps {
	variant: 'primary' | 'secondary';
	onClick: () => void;
	children: React.ReactNode;
}
```

#### Molecules

- Combinations of atoms
- Limited business logic
- Examples: Forms, Cards

```typescript
// src/components/molecules/SearchBar/SearchBar.tsx
interface SearchBarProps {
	onSearch: (term: string) => void;
	placeholder?: string;
}
```

#### Organisms

- Complex UI sections
- May contain business logic
- Examples: Header, Sidebar

### 2. Core (`src/core/`)

Contains essential application setup:

- API client configuration
- Route definitions
- Query client setup

### 3. Models (`src/models/`)

TypeScript interfaces for data structures:

```typescript
// src/models/Customer.ts
interface Customer {
	id: string;
	name: string;
	email: string;
	created_at: string;
}
```

### 4. Pages (`src/pages/`)

Route-level components:

```
pages/
├── Customers/
│   ├── CustomerList.tsx
│   └── CustomerDetail.tsx
├── Products/
└── Settings/
```

### 5. Utils (`src/utils/`)

#### API Requests

```typescript
// src/utils/api_requests/CustomerApi.ts
class CustomerApi {
	private static baseUrl = '/customers';

	public static async getAll() {
		return await AxiosClient.get(this.baseUrl);
	}
}
```

#### Common Utilities

```typescript
// src/utils/common/date_helpers.ts
export const formatDate = (date: string) => {
	return new Date(date).toLocaleDateString();
};
```

## File Naming Conventions

1. **Components**

- PascalCase for component files
- index.ts for exports

```
Button/
├── Button.tsx
├── Button.test.tsx
└── index.ts
```

2. **Utilities**

- camelCase for utility files
- Descriptive names

```
utils/
├── formatDate.ts
└── validateInput.ts
```

3. **Pages**

- PascalCase
- Suffix with Page

```
pages/
├── CustomerListPage.tsx
└── CustomerDetailPage.tsx
```

## Import Conventions

```typescript
// External imports
import React from 'react';
import { useQuery } from '@tanstack/react-query';

// Internal imports
import { Button } from '@/components/atoms';
import { CustomerApi } from '@/api';
import { formatDate } from '@/utils/common';

// Types
import type { Customer } from '@/models/Customer';
```

## State Management

1. **Local State**

```typescript
const [isOpen, setIsOpen] = useState(false);
```

2. **Server State**

```typescript
const { data, isLoading } = useQuery({
	queryKey: ['customers'],
	queryFn: CustomerApi.getAll,
});
```

3. **Global State**

```typescript
const { user, setUser } = useUserStore();
```

## Testing Structure

```
__tests__/
├── components/
│   └── atoms/
│       └── Button.test.tsx
├── utils/
│   └── formatDate.test.tsx
└── pages/
    └── CustomerList.test.tsx
```

Remember: This structure is a guideline. Adapt it based on specific project needs while maintaining consistency.
