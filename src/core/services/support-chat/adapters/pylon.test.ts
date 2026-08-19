import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { mockLogError } = vi.hoisted(() => ({ mockLogError: vi.fn() }));
vi.mock('@/core/services/error/ErrorLoggingService', () => ({
	default: { logError: mockLogError },
	errorLogger: { logError: mockLogError },
}));

import { __resetPylonLoaderForTests, createPylonAdapter } from './pylon';
import type { SupportChatUser } from '../SupportChatAdapter';

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

/** Resolve the pending script by firing its onload, mimicking a successful widget fetch. */
function completeScriptLoad(): void {
	const scripts = document.querySelectorAll<HTMLScriptElement>('script[src*="widget.usepylon.com"]');
	scripts[scripts.length - 1]?.dispatchEvent(new Event('load'));
}

function failScriptLoad(): void {
	const script = document.querySelector<HTMLScriptElement>('script[src*="widget.usepylon.com"]');
	script?.dispatchEvent(new Event('error'));
}

describe('pylon adapter', () => {
	beforeEach(() => {
		__resetPylonLoaderForTests();
		document.head.innerHTML = '';
		delete globals().Pylon;
		delete globals().pylon;
	});

	afterEach(() => {
		vi.restoreAllMocks();
		mockLogError.mockClear();
	});

	it('sets chat_settings before inserting the widget script', async () => {
		const adapter = createPylonAdapter('app-123');
		const pending = adapter.init(USER);

		expect(globals().pylon?.chat_settings).toEqual({
			app_id: 'app-123',
			email: 'ada@example.com',
			name: 'Ada Tenant',
			account_external_id: 'tenant_1',
		});

		completeScriptLoad();
		await pending;
	});

	it('omits account_external_id when the user has no tenant', async () => {
		const adapter = createPylonAdapter('app-123');
		const pending = adapter.init({ id: 'user_1', email: 'ada@example.com', name: 'Ada' });

		expect(globals().pylon?.chat_settings).not.toHaveProperty('account_external_id');

		completeScriptLoad();
		await pending;
	});

	it('never sends contact_external_id, which Pylon accepts only as a JWT claim', async () => {
		const adapter = createPylonAdapter('app-123');
		const pending = adapter.init(USER);

		expect(globals().pylon?.chat_settings).not.toHaveProperty('contact_external_id');
		expect(globals().pylon?.chat_settings).not.toHaveProperty('contact_id');

		completeScriptLoad();
		await pending;
	});

	it('injects the widget script with hardened attributes', async () => {
		const adapter = createPylonAdapter('app-123');
		const pending = adapter.init(USER);
		const script = document.querySelector<HTMLScriptElement>('script[src*="widget.usepylon.com"]');

		expect(script).not.toBeNull();
		expect(script?.src).toBe('https://widget.usepylon.com/widget/app-123');
		expect(script?.async).toBe(true);
		expect(script?.crossOrigin).toBe('anonymous');
		expect(script?.referrerPolicy).toBe('strict-origin-when-cross-origin');

		completeScriptLoad();
		await pending;
	});

	it('injects the script only once across repeated inits', async () => {
		const adapter = createPylonAdapter('app-123');
		const first = adapter.init(USER);
		completeScriptLoad();
		await first;

		await adapter.init(USER);

		expect(document.querySelectorAll('script[src*="widget.usepylon.com"]')).toHaveLength(1);
	});

	it('hides the chat bubble once the widget has loaded', async () => {
		const adapter = createPylonAdapter('app-123');
		const pending = adapter.init(USER);
		completeScriptLoad();
		await pending;

		expect(globals().Pylon?.q).toContainEqual(['hideChatBubble']);
	});

	it('rejects an app id containing characters outside the allowed set', async () => {
		const adapter = createPylonAdapter('app-123/../evil');

		await expect(adapter.init(USER)).rejects.toThrow(/Invalid Pylon app id/);
		expect(document.querySelector('script[src*="usepylon"]')).toBeNull();
	});

	it('rejects when the widget script fails to load', async () => {
		const adapter = createPylonAdapter('app-123');
		const pending = adapter.init(USER);
		failScriptLoad();

		await expect(pending).rejects.toThrow(/Failed to load Pylon widget script/);
	});

	it('retries after a failed load instead of replaying the same rejection forever', async () => {
		const first = createPylonAdapter('app-123');
		const firstPending = first.init(USER);
		failScriptLoad();
		await expect(firstPending).rejects.toThrow(/Failed to load Pylon widget script/);

		const second = createPylonAdapter('app-123');
		const secondPending = second.init(USER);
		completeScriptLoad();

		await expect(secondPending).resolves.toBeUndefined();
		expect(document.querySelectorAll('script[src*="widget.usepylon.com"]')).toHaveLength(2);
	});

	it('queues show() through the stub before the widget loads', () => {
		const adapter = createPylonAdapter('app-123');
		void adapter.init(USER);
		adapter.show();

		expect(globals().Pylon?.q).toContainEqual(['show']);
	});

	it('registers native onShow and onHide callbacks and routes them to handlers', async () => {
		const adapter = createPylonAdapter('app-123');
		const onShow = vi.fn();
		const onHide = vi.fn();
		adapter.subscribe({ onShow, onHide });

		const calls = globals().Pylon?.q ?? [];
		const showRegistration = calls.find((call) => (call as unknown[])[0] === 'onShow') as [string, () => void];
		const hideRegistration = calls.find((call) => (call as unknown[])[0] === 'onHide') as [string, () => void];

		expect(showRegistration).toBeDefined();
		expect(hideRegistration).toBeDefined();

		showRegistration[1]();
		hideRegistration[1]();

		expect(onShow).toHaveBeenCalledOnce();
		expect(onHide).toHaveBeenCalledOnce();
	});

	it('drops callbacks that arrive after dispose', () => {
		const adapter = createPylonAdapter('app-123');
		const onShow = vi.fn();
		const onHide = vi.fn();
		adapter.subscribe({ onShow, onHide });

		const calls = globals().Pylon?.q ?? [];
		const showRegistration = calls.find((call) => (call as unknown[])[0] === 'onShow') as [string, () => void];

		adapter.dispose();
		showRegistration[1]();

		expect(onShow).not.toHaveBeenCalled();
		expect(onHide).not.toHaveBeenCalled();
	});

	describe('identity verification', () => {
		it('sends identity fields mirroring exactly what the backend signs into the JWT', async () => {
			const adapter = createPylonAdapter('app-123', async () => 'signed.jwt.token');
			const pending = adapter.init(USER);
			await vi.waitFor(() => expect(globals().pylon?.chat_settings).toHaveProperty('jwt'));

			// The shipped widget (a) gates rendering on chat_settings.email/name being present
			// regardless of JWT mode, and (b) forwards account_external_id/contact_external_id
			// to Pylon's jwt-auth endpoint verbatim — any mismatch against the JWT's own claims
			// gets the auth call rejected. These must mirror userService.CreateSupportChatToken.
			expect(globals().pylon?.chat_settings).toEqual({
				app_id: 'app-123',
				jwt: 'signed.jwt.token',
				email: 'ada@example.com',
				name: 'Ada Tenant',
				contact_external_id: 'user_1',
				account_external_id: 'tenant_1',
			});

			completeScriptLoad();
			await pending;
		});

		it('omits account_external_id alongside a jwt when the user has no tenant', async () => {
			const adapter = createPylonAdapter('app-123', async () => 'signed.jwt.token');
			const pending = adapter.init({ id: 'user_1', email: 'ada@example.com', name: 'Ada' });
			await vi.waitFor(() => expect(globals().pylon?.chat_settings).toHaveProperty('jwt'));

			const settings = globals().pylon?.chat_settings ?? {};
			expect(settings).not.toHaveProperty('account_external_id');
			expect(settings).not.toHaveProperty('email_hash');
			expect(settings).toHaveProperty('contact_external_id', 'user_1');

			completeScriptLoad();
			await pending;
		});

		it('falls back to an unverified session and logs when the token fetch fails', async () => {
			const adapter = createPylonAdapter('app-123', async () => {
				throw new Error('token endpoint unavailable');
			});
			const pending = adapter.init(USER);
			await vi.waitFor(() => expect(globals().pylon?.chat_settings).toHaveProperty('email'));

			expect(globals().pylon?.chat_settings).toEqual({
				app_id: 'app-123',
				email: 'ada@example.com',
				name: 'Ada Tenant',
				account_external_id: 'tenant_1',
			});
			expect(mockLogError).toHaveBeenCalledOnce();
			expect(mockLogError.mock.calls[0][2]).toMatchObject({ action: 'fetch-pylon-identity-token' });

			completeScriptLoad();
			await pending;
		});

		it('still boots the widget when the token fetch fails', async () => {
			const adapter = createPylonAdapter('app-123', async () => {
				throw new Error('token endpoint unavailable');
			});
			const pending = adapter.init(USER);
			await vi.waitFor(() => expect(document.querySelector('script[src*="widget.usepylon.com"]')).not.toBeNull());
			completeScriptLoad();

			await expect(pending).resolves.toBeUndefined();
		});

		it('makes no token request at all when no fetcher is injected', async () => {
			const adapter = createPylonAdapter('app-123');
			const pending = adapter.init(USER);

			expect(globals().pylon?.chat_settings).not.toHaveProperty('jwt');
			expect(mockLogError).not.toHaveBeenCalled();

			completeScriptLoad();
			await pending;
		});
	});
});
