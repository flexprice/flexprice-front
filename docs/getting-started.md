# Getting Started with FlexPrice Frontend

## Initial Setup

### Prerequisites

- Node.js 16+
- npm/yarn
- Git
- Code editor (VS Code recommended)

### Required VS Code Extensions

1. **Essential Extensions**
```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "dsznajder.es7-react-js-snippets",
    "christian-kohler.path-intellisense"
  ]
}
```

2. **Recommended Settings**
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  }
}
```

### Environment Setup

1. **Clone Repository**
```bash
git clone https://github.com/flexprice/flexprice-frontend
cd flexprice-frontend
```

2. **Install Dependencies**
```bash
npm install
```

3. **Environment Configuration**
```bash
# Copy environment template
cp .env.example .env.local

# Required environment variables
VITE_API_URL=https://api.flexprice.io/v1
VITE_ENVIRONMENT=development
```

4. **Start Development Server**
```bash
npm run dev
```

## Development Tools

### 1. React Developer Tools
- Install Chrome/Firefox extension
- Use Components tab for debugging
- Monitor re-renders and performance

### 2. TanStack Query DevTools
- Available in development mode
- Monitor API requests and cache
- Debug query states and data

### 3. TypeScript Configuration
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  }
}
```

## Common Development Tasks

### 1. Creating New Components
```bash
# Create component directory
mkdir src/components/atoms/NewComponent

# Create component files
touch src/components/atoms/NewComponent/NewComponent.tsx
touch src/components/atoms/NewComponent/index.ts
```

### 2. Adding New Routes
1. Create page component in `src/pages/`
2. Add route in `src/core/routes/Routes.tsx`

### 3. Adding API Integration
1. Create new file in `src/utils/api_requests/`
2. Follow existing API class patterns

## Development Workflow

1. **Start New Feature**
```bash
git checkout -b feat/feature-name
```

2. **Make Changes**
- Follow conventions
- Write tests
- Update documentation

3. **Commit Changes**
```bash
git add .
git commit -m "feat: description of changes"
```

4. **Create Pull Request**
- Use PR template
- Add description
- Request review

## Common Issues & Solutions

### 1. Build Errors
```bash
# Clear node modules and reinstall
rm -rf node_modules
npm install

# Clear build cache
npm run clean
```

### 2. Environment Issues
- Verify .env.local exists
- Check API endpoint configuration
- Validate environment variables

### 3. TypeScript Errors
- Check import paths
- Verify type definitions
- Update type declarations

## Next Steps

1. Review [Project Structure](./project-structure.md)
2. Read [Coding Conventions](./conventions.md)
3. Explore [Component Guidelines](./component-guidelines.md) 