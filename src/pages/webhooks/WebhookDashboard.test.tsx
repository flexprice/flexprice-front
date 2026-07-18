import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';

const mockConfig = vi.hoisted(() => ({
	webhooks: {
		provider: 'svix' as 'svix' | 'custom',
		svixUrl: '',
	},
}));

vi.mock('@/config/config', async (importOriginal) => {
	const actual = await importOriginal<typeof import('@/config/config')>();
	return {
		...actual,
		config: {
			...actual.config,
			get webhooks() {
				return mockConfig.webhooks;
			},
		},
	};
});

vi.mock('svix-react', () => ({
	SvixProvider: ({ children }: { children: React.ReactNode }) => <div data-testid='svix-provider'>{children}</div>,
	AppPortal: ({ url }: { url: string }) => <div data-testid='svix-hosted-portal' data-url={url} />,
	useEndpoints: () => ({
		data: [],
		loading: false,
		error: undefined,
		reload: vi.fn(),
		hasPrevPage: false,
		hasNextPage: false,
		prevPage: vi.fn(),
		nextPage: vi.fn(),
	}),
	useNewEndpoint: () => ({
		url: { value: '', setValue: vi.fn() },
		description: { value: '', setValue: vi.fn() },
		eventTypes: { value: [], setValue: vi.fn() },
		rateLimitPerSecond: { value: undefined, setValue: vi.fn() },
		createEndpoint: vi.fn(),
	}),
	useEndpointFunctions: () => ({ deleteEndpoint: vi.fn(), updateEndpoint: vi.fn(), recoverEndpointMessages: vi.fn() }),
	useEndpointSecret: () => ({ data: undefined, loading: false, error: undefined, reload: vi.fn() }),
	useSvix: () => ({ svix: { endpoint: { create: vi.fn(), delete: vi.fn(), getSecret: vi.fn() } }, appId: 'x' }),
}));

vi.mock('react-i18next', () => ({
	useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('@/components/organisms', async (importOriginal) => {
	const actual = await importOriginal<typeof import('@/components/organisms')>();
	return {
		...actual,
		WebhooksPortal: () => <div data-testid='webhooks-portal' />,
		EmptyPage: ({ emptyStateCard }: { emptyStateCard?: { heading: string } }) => (
			<div data-testid='empty-page'>{emptyStateCard?.heading}</div>
		),
	};
});

const mockData = vi.fn();
vi.mock('@tanstack/react-query', async (importOriginal) => {
	const actual = await importOriginal<typeof import('@tanstack/react-query')>();
	return { ...actual, useQuery: () => mockData() };
});
vi.mock('@/hooks/useEnvironment', () => ({ default: () => ({ activeEnvironment: { id: 'env_1' } }) }));
vi.mock('react-hot-toast', () => ({ default: { success: vi.fn(), error: vi.fn() } }));
vi.mock('@/components/molecules/ApiDocs/ApiDocs', () => ({ ApiDocsContent: () => null }));

import WebhookDashboard from './WebhookDashboard';

describe('WebhookDashboard', () => {
	beforeEach(() => {
		mockConfig.webhooks = {
			provider: 'svix',
			svixUrl: '',
		};
	});

	it('renders custom WebhooksPortal when provider is custom with token and app_id', () => {
		mockConfig.webhooks = {
			provider: 'custom',
			svixUrl: 'https://svix.example.com',
		};
		mockData.mockReturnValue({
			data: { svix_enabled: true, url: '', token: 'tok_123', app_id: 'tenant_env' },
			isLoading: false,
			isError: false,
		});
		render(<WebhookDashboard />);
		expect(screen.getByTestId('svix-provider')).toBeInTheDocument();
		expect(screen.getByTestId('webhooks-portal')).toBeInTheDocument();
		expect(screen.queryByTestId('svix-hosted-portal')).not.toBeInTheDocument();
	});

	it('renders custom WebhooksPortal when flexprice provider is set without svixUrl', () => {
		mockConfig.webhooks = {
			provider: 'custom',
			svixUrl: '',
		};
		mockData.mockReturnValue({
			data: { svix_enabled: true, url: '', token: 'tok_123', app_id: 'tenant_env' },
			isLoading: false,
			isError: false,
		});
		render(<WebhookDashboard />);
		expect(screen.getByTestId('webhooks-portal')).toBeInTheDocument();
		expect(screen.queryByTestId('svix-hosted-portal')).not.toBeInTheDocument();
	});

	it('renders hosted AppPortal when provider is svix and a hosted url is returned', () => {
		mockData.mockReturnValue({
			data: { svix_enabled: true, url: 'https://app.svix.com/login#key=abc' },
			isLoading: false,
			isError: false,
		});
		render(<WebhookDashboard />);
		expect(screen.getByTestId('svix-hosted-portal')).toBeInTheDocument();
		expect(screen.queryByTestId('svix-provider')).not.toBeInTheDocument();
	});

	it('prefers custom portal over hosted url when provider is custom', () => {
		mockConfig.webhooks = {
			provider: 'custom',
			svixUrl: 'https://svix.example.com',
		};
		mockData.mockReturnValue({
			data: {
				svix_enabled: true,
				url: 'https://app.svix.com/login#key=abc',
				token: 'tok_123',
				app_id: 'tenant_env',
			},
			isLoading: false,
			isError: false,
		});
		render(<WebhookDashboard />);
		expect(screen.getByTestId('webhooks-portal')).toBeInTheDocument();
		expect(screen.queryByTestId('svix-hosted-portal')).not.toBeInTheDocument();
	});

	it('renders fallback when svix disabled', () => {
		mockData.mockReturnValue({ data: { svix_enabled: false }, isLoading: false, isError: false });
		render(<WebhookDashboard />);
		expect(screen.getByTestId('empty-page')).toBeInTheDocument();
		expect(screen.queryByTestId('svix-provider')).not.toBeInTheDocument();
		expect(screen.queryByTestId('svix-hosted-portal')).not.toBeInTheDocument();
	});
});
