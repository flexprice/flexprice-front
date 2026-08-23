import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SupportChatProvider } from '@/models/SupportChat';
import { SUPPORT_CHAT_FLOW } from '@/config/support-chat';
import type { SupportChatUser } from '../SupportChatAdapter';

vi.mock('@intercom/messenger-js-sdk', () => ({ default: vi.fn() }));
vi.mock('../../intercom/index.css', () => ({}));

const pylonConfig = vi.hoisted(() => ({
	enabled: true,
	appId: 'app-123',
	identityVerificationEnabled: false,
}));

const getIdentityToken = vi.hoisted(() => vi.fn());

vi.mock('@/config/config', async (importOriginal) => {
	const actual = await importOriginal<typeof import('@/config/config')>();
	return {
		...actual,
		config: {
			...actual.config,
			get pylon() {
				return pylonConfig;
			},
		},
	};
});

vi.mock('@/api/SupportChatApi', () => ({
	default: {
		getIdentityToken,
	},
}));

const USER: SupportChatUser = {
	id: 'user_1',
	email: 'ada@example.com',
	name: 'Ada Tenant',
	createdAt: 1_700_000_000_000,
	tenantId: 'tenant_1',
};

type PylonGlobals = {
	Pylon?: ((...args: unknown[]) => void) & { q?: unknown[] };
	pylon?: { chat_settings: Record<string, unknown> };
};

function globals(): PylonGlobals {
	return window as unknown as PylonGlobals;
}

function completeScriptLoad(): void {
	const scripts = document.querySelectorAll<HTMLScriptElement>('script[src*="widget.usepylon.com"]');
	scripts[scripts.length - 1]?.dispatchEvent(new Event('load'));
}

describe('createSupportChatAdapter (Pylon identity verification)', () => {
	beforeEach(async () => {
		const { __resetPylonLoaderForTests } = await import('./pylon');
		__resetPylonLoaderForTests();
		document.head.innerHTML = '';
		delete globals().Pylon;
		delete globals().pylon;
		getIdentityToken.mockReset();
		pylonConfig.identityVerificationEnabled = false;
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('does not fetch or send email_hash when identity verification is disabled', async () => {
		const { createSupportChatAdapter } = await import('./index');
		const adapter = createSupportChatAdapter(SupportChatProvider.Pylon, SUPPORT_CHAT_FLOW[SupportChatProvider.Pylon]);
		const pending = adapter.init(USER);
		await vi.waitFor(() => expect(globals().pylon?.chat_settings).toBeDefined());

		expect(getIdentityToken).not.toHaveBeenCalled();
		expect(globals().pylon?.chat_settings).not.toHaveProperty('email_hash');

		completeScriptLoad();
		await pending;
	});

	it('fetches and sends email_hash when identity verification is enabled', async () => {
		pylonConfig.identityVerificationEnabled = true;
		getIdentityToken.mockResolvedValue({ token: 'hashed-email', expires_at: '2099-01-01' });

		const { createSupportChatAdapter } = await import('./index');
		const adapter = createSupportChatAdapter(SupportChatProvider.Pylon, SUPPORT_CHAT_FLOW[SupportChatProvider.Pylon]);
		const pending = adapter.init(USER);
		await vi.waitFor(() => expect(globals().pylon?.chat_settings).toHaveProperty('email_hash'));

		expect(getIdentityToken).toHaveBeenCalledOnce();
		expect(globals().pylon?.chat_settings?.email_hash).toBe('hashed-email');

		completeScriptLoad();
		await pending;
	});
});
