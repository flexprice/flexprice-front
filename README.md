<div align="center">
  <img src="./assets/flexprice_logo.png" height="120" alt="Flexprice Logo"/>
  
  <h1>⚡️ Flexprice Frontend</h1>
  
  <p><strong>Usage-based metering & billing for developers</strong></p>
  
  <p>Build usage-based, credit-based, or hybrid pricing models with full control. Flexprice handles metering, pricing, and invoicing so you can focus on building, not billing.</p>

  <p>
    <a href="https://docs.flexprice.io">Documentation</a> •
    <a href="https://www.loom.com/share/60d8308781254fe0bc5be341501f9fd5">Demo</a> •
    <a href="https://flexprice.io/">Website</a> •
    <a href="https://www.linkedin.com/company/flexpriceio">LinkedIn</a>
  </p>

  <p>
    <a href="https://pkg.go.dev/github.com/flexprice/go-sdk">
      <img src="https://img.shields.io/badge/go-%2300ADD8.svg?style=for-the-badge&logo=go&logoColor=white" alt="Go SDK"/>
    </a>
    <a href="https://pypi.org/project/flexprice">
      <img src="https://img.shields.io/badge/python-3670A0?style=for-the-badge&logo=python&logoColor=ffdd54" alt="Python SDK"/>
    </a>
    <a href="https://www.npmjs.com/package/@flexprice/sdk">
      <img src="https://img.shields.io/badge/javascript-%23323330.svg?style=for-the-badge&logo=javascript&logoColor=%23F7DF1E" alt="JavaScript SDK"/>
    </a>
  </p>

  <p>
    <a href="https://github.com/flexprice/flexprice-front/releases">
      <img src="https://img.shields.io/github/v/release/flexprice/flexprice-front?style=flat-square" alt="Latest Release"/>
    </a>
    <a href="https://github.com/flexprice/flexprice-front/issues">
      <img src="https://img.shields.io/github/issues/flexprice/flexprice-front?style=flat-square" alt="GitHub Issues"/>
    </a>
    <a href="https://github.com/flexprice/flexprice-front/stargazers">
      <img src="https://img.shields.io/github/stars/flexprice/flexprice-front?style=flat-square" alt="GitHub Stars"/>
    </a>
    <a href="https://github.com/flexprice/flexprice-front/network">
      <img src="https://img.shields.io/github/forks/flexprice/flexprice-front?style=flat-square" alt="GitHub Forks"/>
    </a>
    <a href="https://github.com/flexprice/flexprice-front/blob/main/LICENSE">
      <img src="https://img.shields.io/github/license/flexprice/flexprice-front?style=flat-square" alt="License"/>
    </a>
  </p>
</div>

<h5 align="center">

[Documentation](https://docs.flexprice.io) • [Demo](https://www.loom.com/share/60d8308781254fe0bc5be341501f9fd5) • [Website](https://flexprice.io/) • [LinkedIn](https://www.linkedin.com/company/flexpriceio)

[![Go](https://img.shields.io/badge/go-%2300ADD8.svg?style=for-the-badge&logo=go&logoColor=white)](https://pkg.go.dev/github.com/flexprice/go-sdk) [![Python](https://img.shields.io/badge/python-3670A0?style=for-the-badge&logo=python&logoColor=ffdd54)](https://pypi.org/project/flexprice) [![JavaScript](https://img.shields.io/badge/javascript-%23323330.svg?style=for-the-badge&logo=javascript&logoColor=%23F7DF1E)](https://www.npmjs.com/package/@flexprice/sdk) 

## 📋 Table of Contents

- [🏗️ Open Architecture](#-open-architecture)
- [🚀 Quick Setup](#-quick-setup-one-click-development)
- [🛠️ Manual Development Setup](#️-manual-development-setup)
- [🏗️ Project Structure](#️-project-structure)
- [🌐 Self-Hosting Guide](#-self-hosting-guide)
- [📚 Available Scripts](#-available-scripts)
- [🔧 Common Development Tasks](#-common-development-tasks)
- [🔍 Troubleshooting](#-troubleshooting)
- [📚 Documentation](#-documentation)
- [🚀 Latest Releases](#-latest-releases)
- [👨🏻‍💻 Let's Build Together!](#-lets-build-together-)
- [🤝 Contributing](#-contributing)
- [🆘 Need Help?](#-need-help)
- [🔒 Security](#-security)
- [📝 Changelog](#-changelog)
- [📄 License](#-license)

---

## 🏗️ Open Architecture
The Flexprice core (metering, credits, pricing, billing) has an open and composable design.

<p align="center">
  <img align="center" src="./assets/open-arch.jpg" alt="open architechture"/>
</p>

Your application, whether it's running backend APIs, AI agents, or custom workflows, can send usage data to Flexprice. You can directly stream data from data warehouses or analytics pipelines as well.

At the core, Flexprice processes this data in real time. We handle everything that usually ends up as custom logic built by developers. Our platform calculates pricing based on the customer’s plan, applies any prepaid or promotional credits, enforces feature limits, and generates accurate invoices automatically. Whether you're using seat-based subscriptions, usage-based pricing, or prepaid credit bundles, you can set up and iterate on your pricing model without writing billing infrastructure from scratch.

After billing is computed, our platform connects to your existing tools for payments, CPQ, CRM, and accounting, ensuring billing information flows into the systems your business already uses. It can sync invoices to your payment processor, update customer data in your CRM, and push revenue numbers to your accounting tools.

With this architecture, you get full control over how billing works inside your product, while saving your team from the complexity of maintaining it all.

## ✨ Features

- 🎯 **Usage Metering** - Real-time tracking of custom usage events
- 💳 **Credit Management** - Prepaid and promotional credit systems
- 📊 **Flexible Pricing** - Support for usage-based, subscription, and hybrid models
- 🔧 **Feature Management** - Entitlements and usage limits per plan
- 📄 **Automated Invoicing** - Clear, accurate invoices with real-time data
- 🔌 **Easy Integration** - Simple SDKs for Go, Python, and JavaScript
- 🏗️ **Self-Hostable** - Open source with full control over your infrastructure
- 📈 **Real-time Analytics** - Comprehensive usage and billing insights

## 🚀 Quick Setup (One-Click Development)

[![Latest Release](https://img.shields.io/github/v/release/flexprice/flexprice-front?style=flat-square&label=Current%20Version)](https://github.com/flexprice/flexprice-front/releases)

### Prerequisites

- **Node.js** 16+ and npm/yarn
- **Git** for version control
- **VS Code** (recommended) or any modern editor
- **Docker** (optional, for containerized development)

### One-Click Setup Script

```bash
# Clone the flexprice frontend repository
git clone https://github.com/flexprice/flexprice-front
cd flexprice-front

# Run the automated setup script
./setup
```

### Alternative: Install Latest Release

```bash
# Download and install the latest release
curl -s https://api.github.com/repos/flexprice/flexprice-front/releases/latest | grep "browser_download_url.*tar.gz" | cut -d '"' -f 4 | wget -qi -
tar -xzf flexprice-front-*.tar.gz
cd flexprice-front-*
./setup
```

The setup script will automatically:

1. ✅ Set up environment variables
2. ✅ Install all dependencies
3. ✅ Build Docker image (if Docker is available)
4. ✅ Start the development server
5. ✅ Open your browser to `http://localhost:3000`

## 🛠 Manual Development Setup

1. **Clone & Install**

```bash
git clone https://github.com/flexprice/flexprice-front
cd flexprice-front
npm install
```

2. **Environment Setup**

```bash
# Copy environment template
cp .env.example .env

# Configure these variables in .env.local:
VITE_SUPABASE_URL=your-supabase-utl

VITE_SUPABASE_ANON_KEY=your-supabse-anon-key

VITE_API_URL=http://localhost:8080/v1 or <your-backend-url>

VITE_ENVIRONMENT=development

```

3. **Start Development**

```bash
npm run dev
```

Visit `http://localhost:3000` to see your app running!

## 🏗 Project Structure

```
src/
├── components/          # UI Components
│   ├── atoms/          # Basic UI elements
│   │   ├── Button/
│   │   ├── Input/
│   │   └── Card/
│   ├── molecules/      # Composite components
│   │   ├── Forms/
│   │   ├── Charts/
│   │   └── Tables/
│   └── organisms/      # Complex UI sections
│       ├── Dashboard/
│       ├── Billing/
│       └── Analytics/
├── pages/              # Route components
├── hooks/              # Custom React hooks
├── store/              # State management
├── utils/              # Helper functions
├── models/             # TypeScript types
└── core/              # Core business logic
```

## 🌐 Self-Hosting Guide

### Docker Deployment

1. **Build the Docker image**

```bash
docker build -t flexprice-frontend .
```

2. **Run the container**

```bash
docker run -p 80:80 \
  -e VITE_API_URL=your-api-url \
  -e VITE_AUTH_DOMAIN=your-auth-domain \
  flexprice-frontend
```

### Manual Deployment

1. **Build the application**

```bash
npm run build
```

2. **Serve the static files**

```bash
# Using nginx
cp nginx.conf /etc/nginx/conf.d/flexprice.conf
nginx -s reload

# Or using serve
npx serve -s dist
```

## 📚 Available Scripts

```bash
# Development
npm run dev           # Start development server
npm run build        # Build for production
npm run preview      # Preview production build

# Code Quality
npm run lint        # Run ESLint
npm run lint:fix    # Fix ESLint errors
npm run format      # Format with Prettier
```

## 🔧 Common Development Tasks

### Adding New Features

1. Create a feature branch:

```bash
git checkout -b feat/new-feature
```

2. Create component structure:

```bash
mkdir -p src/components/organisms/NewFeature
touch src/components/organisms/NewFeature/index.tsx
touch src/components/organisms/NewFeature/NewFeature.test.tsx
```

3. Add route (if needed):

```tsx
// src/core/routes/Routes.tsx
import NewFeature from '@/components/organisms/NewFeature'

// Add to routes array
{
  path: '/new-feature',
  element: <NewFeature />
}
```

### Styling Components

We use Tailwind CSS with custom configurations:

```tsx
// Example component with Tailwind
const Button = ({ children }) => <button className='px-4 py-2 bg-primary hover:bg-primary-dark rounded-md'>{children}</button>;
```

## 🔍 Troubleshooting

### Common Issues

1. **Build Failures**

```bash
# Clear dependencies and cache
rm -rf node_modules
rm -rf .vite
npm install
```

2. **Stale Development Server**

```bash
# Reset development server
rm -rf node_modules
rm -rf .vite
npm install
npm run dev
```

## 📚 Documentation

Our comprehensive documentation covers all aspects of the FlexPrice frontend:

### Getting Started

- [Getting Started Guide](docs/getting-started.md) - Quick setup and first steps
- [Project Structure](docs/project-structure.md) - Understanding the codebase organization
- [Conventions](docs/conventions.md) - Coding standards and best practices

### Development Guides

- [Component Guidelines](docs/component-guidelines.md) - Building and maintaining UI components
- [State Management](docs/state-management.md) - Managing application state with Zustand and Context
- [API Integration](docs/api-integration.md) - Working with the backend API
- [Onboarding Guide](docs/onboarding.md) - New developer onboarding process

### Additional Resources

<!-- - [FAQ](docs/FAQ.md) - Common questions and answers -->

- [Flexprice Docs](https://docs.flexprice.io) - Documenttation for Flexprice sdk and Apis
- [Contributing Guide](docs/getting-started.md) - How to contribute to the project

## 🚀 Latest Releases

<div align="center">
  <a href="https://github.com/flexprice/flexprice-front/releases">
    <img src="https://img.shields.io/github/v/release/flexprice/flexprice-front?include_prereleases&style=for-the-badge&label=Latest%20Release" alt="Latest Release"/>
  </a>
  <a href="https://github.com/flexprice/flexprice-front/releases">
    <img src="https://img.shields.io/github/release-date/flexprice/flexprice-front?style=for-the-badge&label=Release%20Date" alt="Release Date"/>
  </a>
</div>

### 📦 Download Latest Release

```bash
# Download the latest release
curl -s https://api.github.com/repos/flexprice/flexprice-front/releases/latest | grep "browser_download_url.*tar.gz" | cut -d '"' -f 4 | wget -qi -

# Or clone the latest release
git clone --depth 1 --branch $(curl -s https://api.github.com/repos/flexprice/flexprice-front/releases/latest | grep "tag_name" | cut -d '"' -f 4) https://github.com/flexprice/flexprice-front.git
```

### 🔄 Release History

[![GitHub Release](https://img.shields.io/github/release-date/flexprice/flexprice-front?style=flat-square)](https://github.com/flexprice/flexprice-front/releases)
[![GitHub Releases](https://img.shields.io/github/downloads/flexprice/flexprice-front/total?style=flat-square)](https://github.com/flexprice/flexprice-front/releases)
[![GitHub All Releases](https://img.shields.io/github/downloads/flexprice/flexprice-front/total?style=flat-square&label=Total%20Downloads)](https://github.com/flexprice/flexprice-front/releases)

## 👨🏻‍💻 Let's Build Together! 👩🏻‍💻

Whether you're a newbie coder or a wizard 🧙‍♀️, your perspective is golden. Take a peek at our:

📜 [Contribution Guidelines](CONTRIBUTING.md)

🏗️ [Local Development Setup](docs/getting-started.md)

❤️ [Code of Conduct](code_of_conduct.md)

## Contributors

<a href="https://github.com/flexprice/flexprice-front/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=flexprice/flexprice-front" />
</a>

<!-- ## Repo Activity -->

<!-- ![Alt](https://repobeats.axiom.co/api/embed/4d6e208eab20ff0615787615c4fa022591adfa6b.svg 'Repobeats analytics image') -->

## 🤝 Contributing

We welcome contributions from the community! Here's how you can help:

### 🚀 Quick Start

1. **Fork** the repository
2. **Clone** your fork: `git clone https://github.com/flexprice/flexprice-front.git`
3. **Create** a feature branch: `git checkout -b feat/amazing-feature`
4. **Make** your changes
5. **Commit** with a clear message: `git commit -m "Add amazing feature"`
6. **Push** to your branch: `git push origin feat/amazing-feature`
7. **Open** a Pull Request

### 📋 Contribution Types

- 🐛 **Bug fixes** - Help us squash bugs
- ✨ **New features** - Add functionality that others can use
- 📚 **Documentation** - Improve our docs and guides
- 🎨 **UI/UX improvements** - Make the interface better
- ⚡ **Performance** - Optimize code and improve speed
- 🧪 **Tests** - Add or improve test coverage

### 🔍 Before You Start

- Check existing [issues](https://github.com/flexprice/flexprice-front/issues) and [discussions](https://github.com/flexprice/flexprice-front/discussions)
- Read our [Contributing Guide](CONTRIBUTING.md) for detailed guidelines
- Follow our [Code of Conduct](code_of_conduct.md)
- Ensure your code follows our [coding standards](docs/conventions.md)

### 💡 Need Help?

- 💬 Join our [Discussions](https://github.com/flexprice/flexprice-front/discussions)
- 📧 Email us at dev@flexprice.io
- 🐛 Report issues via [GitHub Issues](https://github.com/flexprice/flexprice-front/issues)

## 🆘 Need Help?

<!-- - Join our [Discord Community](https://discord.gg/flexprice) -->

- 📧 Email: support@flexprice.io
- 🐛 [Report Issues](https://github.com/flexprice/flexprice-front/issues)
- 💬 [Discussions](https://github.com/flexprice/flexprice-front/discussions)
<!-- - Check our [FAQ](docs/FAQ.md) -->

## 🔒 Security

We take security seriously. If you discover a security vulnerability, please follow these steps:

1. **Do not** open a public issue
2. Email us at security@flexprice.io
3. Include a detailed description of the vulnerability
4. We'll respond within 48 hours

For more information, see our [Security Policy](SECURITY.md).

## 📝 Changelog

We maintain a detailed changelog of all notable changes to this project. See our [CHANGELOG.md](CHANGELOG.md) for the complete history.

### 🔄 Dynamic Release Information

<div align="center">
  <a href="https://github.com/flexprice/flexprice-front/releases">
    <img src="https://img.shields.io/github/v/release/flexprice/flexprice-front?include_prereleases&style=for-the-badge&label=Latest%20Release" alt="Latest Release"/>
  </a>
  <a href="https://github.com/flexprice/flexprice-front/releases">
    <img src="https://img.shields.io/github/release-date/flexprice/flexprice-front?style=for-the-badge&label=Released" alt="Release Date"/>
  </a>
</div>

### 📋 Recent Updates

```bash
# Get latest release info
curl -s https://api.github.com/repos/flexprice/flexprice-front/releases/latest | jq '.tag_name, .published_at, .body'
```

### 🏷️ All Releases

[![GitHub Releases](https://img.shields.io/github/release-date/flexprice/flexprice-front?style=flat-square)](https://github.com/flexprice/flexprice-front/releases)
[![GitHub All Releases](https://img.shields.io/github/downloads/flexprice/flexprice-front/total?style=flat-square&label=Total%20Downloads)](https://github.com/flexprice/flexprice-front/releases)

---

## 📖 Storybook Component Library

This branch adds a full **Storybook component library** for the FlexPrice frontend — stories across Atoms, Molecules, and Organisms, plus unit tests.

### Approach

**Read first, write second.** Every story was written by reading the actual component source — prop names, variant values, and color tokens come directly from the code, not guessed.

Three categories of work:

| Category | What was done |
|---|---|
| **Stories for existing components** | Button, Chip, Input, Select, Tooltip, Spinner, DateRangePicker, MetricCard, AppSidebar, EmptyPage |
| **New components built + storied** | DataTable (`@tanstack/react-table` + virtualisation), InvoiceStatusBadge, MeterProgress, SearchBar, MonthRangePicker, QueryBuilder/SortDropdown, PricingTierTable |
| **Utilities + tests** | `createQueryConfig`, `formatNumber`, `getCurrencySymbol`, Button, InvoiceStatusBadge tests |

### Component List

#### Atoms
| Story | Path |
|---|---|
| `Atoms/Button` | `src/components/atoms/Button/Button.stories.tsx` |
| `Atoms/Chip` | `src/components/atoms/Chip/Chip.stories.tsx` |
| `Atoms/Input` | `src/components/atoms/Input/Input.stories.tsx` |
| `Atoms/Select` | `src/components/atoms/Select/Select.stories.tsx` |
| `Atoms/Tooltip` | `src/components/atoms/Tooltip/Tooltip.stories.tsx` |
| `Atoms/Spinner` | `src/components/atoms/Spinner/Spinner.stories.tsx` |
| `Atoms/DateRangePicker` | `src/components/atoms/DateRangePicker/DateRangePicker.stories.tsx` |

#### Molecules
| Story | Path |
|---|---|
| `Molecules/MetricCard` | `src/components/molecules/MetricCard.stories.tsx` |
| `Molecules/DataTable` | `src/components/molecules/DataTable/DataTable.stories.tsx` |
| `Molecules/InvoiceStatusBadge` | `src/components/molecules/InvoiceStatusBadge/InvoiceStatusBadge.stories.tsx` |
| `Molecules/MeterProgress` | `src/components/molecules/MeterProgress/MeterProgress.stories.tsx` |
| `Molecules/SearchBar` | `src/components/molecules/SearchBar/SearchBar.stories.tsx` |
| `Molecules/MonthRangePicker` | `src/components/molecules/MonthRangePicker/MonthRangePicker.stories.tsx` |
| `Molecules/QueryBuilder/SortDropdown` | `src/components/molecules/QueryBuilder/SortDropdown.stories.tsx` |

#### Organisms
| Story | Path |
|---|---|
| `Organisms/SidebarNav` | `src/components/molecules/Sidebar/Sidebar.stories.tsx` |
| `Organisms/PricingTierTable` | `src/components/organisms/PricingTierTable/PricingTierTable.stories.tsx` |
| `Organisms/EmptyState` | `src/components/organisms/EmptyPage/EmptyPage.stories.tsx` |

### Key Technical Decisions

#### Storybook Infrastructure
- **Global CSS variables** — `src/index.css` is imported in `.storybook/preview.ts` alongside `tailwindcss/tailwind.css`. Without this, all components using Tailwind's CSS-variable-backed colours (`bg-popover`, `bg-background`, `border-border`, etc.) render transparent.
- **`ReactQueryProvider` global decorator** — wraps every story so that `useQuery` calls (used deep in `useUser`, `useEnvironment`, `useGlobalLoading`, `ApiDocsContent`) don't throw "No QueryClient set". Queries that need a live API simply stay in loading/error state without crashing.
- **Supabase mock when URL is absent** — `src/core/services/supbase/config.ts` now uses the mock client when `VITE_SUPABASE_URL` is empty (Storybook env), preventing `supabaseUrl is required` crashes at module initialisation.
- **No nested `<Router>`** — Sidebar stories previously stacked a meta-level MemoryRouter on top of a story-level one. Fixed by removing the meta decorator entirely and giving each story (`Default`, `WithActivePath`) its own self-contained `withSidebarLayout(route)` decorator.

#### Components
- **`DateRangePicker` redesign** — replaced the single wide popover with a compact two-part trigger (`[📅 start date]  [📄 to  end date 📄]`). Each half opens its own independent single-month calendar. Calendar header is a clickable `"Month Year ▼"` that toggles a scrollable year/month picker. "Clear" and "Today" shortcuts at the bottom. No OK button — selection applies immediately on day click.
- **`@tanstack/react-table` DataTable** — generic `DataTable<T>` with sorting, skeleton loading (preserves table shape), pagination footer, and optional row virtualisation via `@tanstack/react-virtual` for 10 000+ rows.
- **`MonthRangePicker`** — custom component with scrollable year list + 3×4 month grid; solves the "navigate to March last year" problem without clicking through individual months.
- **`createQueryConfig`** (`src/lib/queryConfig.ts`) — structured override for TanStack Query's global `staleTime: 0` with `REALTIME`, `DEFAULT`, and `STATIC` presets.
- **Tooltip `avoidCollisions={false}`** — added prop so `AllSides` story can demonstrate true directional positioning without Radix auto-flipping to top.

### Running Storybook

```bash
npm install
npm run storybook        # dev server at localhost:6006
npm run build-storybook  # production build → storybook-static/
npm test                 # unit tests (vitest)
```

---

## 📄 License

This project is licensed under the [AGPLv3 License](LICENSE) - see the [LICENSE](LICENSE) file for details.

Flexprice follows an "Open Core" model where the core technology is fully open source, while some enterprise features may require a commercial license.

---

<div align="center">
  <p>Made with ❤️ by the <a href="https://flexprice.io">FlexPrice Team</a></p>
  <p>
    <a href="https://github.com/flexprice/flexprice-front/stargazers">⭐ Star us on GitHub</a> •
    <a href="https://twitter.com/flexpriceio">🐦 Follow us on Twitter</a> •
    <a href="https://www.linkedin.com/company/flexpriceio">💼 Connect on LinkedIn</a>
  </p>
</div>
