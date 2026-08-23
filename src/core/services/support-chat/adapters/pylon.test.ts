import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { __resetPylonLoaderForTests, createPylonAdapter } from './pylon';
import type { SupportChatUser } from '../SupportChatAdapter';

const USER: SupportChatUser = {
	id: 'user_1',
	email: 'ada@example.com',
	name: 'Ada Tenant',
	createdAt: 1_700_000_000_000,
	tenantId: 'tenant_1',
};

const fetchEmailHash = async () => 'hashed-email';

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
	});

	it('sets chat_settings, including the fetched email_hash, before inserting the widget script', async () => {
		const adapter = createPylonAdapter('app-123', fetchEmailHash);
		const pending = adapter.init(USER);
		await vi.waitFor(() => expect(globals().pylon?.chat_settings).toHaveProperty('email_hash'));

		expect(globals().pylon?.chat_settings).toEqual({
			app_id: 'app-123',
			email_hash: 'hashed-email',
			email: 'ada@example.com',
			name: 'Ada Tenant',
			contact_external_id: 'user_1',
		});

		completeScriptLoad();
		await pending;
	});

	it('omits email_hash when no hash fetcher is provided', async () => {
		const adapter = createPylonAdapter('app-123');
		const pending = adapter.init(USER);
		await vi.waitFor(() => expect(globals().pylon?.chat_settings).toBeDefined());

		expect(globals().pylon?.chat_settings).toEqual({
			app_id: 'app-123',
			email: 'ada@example.com',
			name: 'Ada Tenant',
			contact_external_id: 'user_1',
		});
		expect(globals().pylon?.chat_settings).not.toHaveProperty('email_hash');

		completeScriptLoad();
		await pending;
	});

	it('rejects and never touches the widget when the hash fetch fails', async () => {
		const adapter = createPylonAdapter('app-123', async () => {
			throw new Error('token endpoint unavailable');
		});

		await expect(adapter.init(USER)).rejects.toThrow(/token endpoint unavailable/);
		expect(document.querySelector('script[src*="usepylon"]')).toBeNull();
	});

	it('injects the widget script with hardened attributes', async () => {
		const adapter = createPylonAdapter('app-123', fetchEmailHash);
		const pending = adapter.init(USER);
		await vi.waitFor(() => expect(document.querySelector('script[src*="widget.usepylon.com"]')).not.toBeNull());
		const script = document.querySelector<HTMLScriptElement>('script[src*="widget.usepylon.com"]');

		expect(script?.src).toBe('https://widget.usepylon.com/widget/app-123');
		expect(script?.async).toBe(true);
		expect(script?.crossOrigin).toBe('anonymous');
		expect(script?.referrerPolicy).toBe('strict-origin-when-cross-origin');

		completeScriptLoad();
		await pending;
	});

	it('injects the script only once across repeated inits', async () => {
		const adapter = createPylonAdapter('app-123', fetchEmailHash);
		const first = adapter.init(USER);
		await vi.waitFor(() => expect(document.querySelector('script[src*="widget.usepylon.com"]')).not.toBeNull());
		completeScriptLoad();
		await first;

		await adapter.init(USER);

		expect(document.querySelectorAll('script[src*="widget.usepylon.com"]')).toHaveLength(1);
	});

	it('hides the chat bubble once the widget has loaded', async () => {
		const adapter = createPylonAdapter('app-123', fetchEmailHash);
		const pending = adapter.init(USER);
		await vi.waitFor(() => expect(document.querySelector('script[src*="widget.usepylon.com"]')).not.toBeNull());
		completeScriptLoad();
		await pending;

		expect(globals().Pylon?.q).toContainEqual(['hideChatBubble']);
	});

	it('rejects an app id containing characters outside the allowed set', async () => {
		const adapter = createPylonAdapter('app-123/../evil', fetchEmailHash);

		await expect(adapter.init(USER)).rejects.toThrow(/Invalid Pylon app id/);
		expect(document.querySelector('script[src*="usepylon"]')).toBeNull();
	});

	it('rejects when the widget script fails to load', async () => {
		const adapter = createPylonAdapter('app-123', fetchEmailHash);
		const pending = adapter.init(USER);
		await vi.waitFor(() => expect(document.querySelector('script[src*="widget.usepylon.com"]')).not.toBeNull());
		failScriptLoad();

		await expect(pending).rejects.toThrow(/Failed to load Pylon widget script/);
	});

	it('retries after a failed load instead of replaying the same rejection forever', async () => {
		const first = createPylonAdapter('app-123', fetchEmailHash);
		const firstPending = first.init(USER);
		await vi.waitFor(() => expect(document.querySelector('script[src*="widget.usepylon.com"]')).not.toBeNull());
		failScriptLoad();
		await expect(firstPending).rejects.toThrow(/Failed to load Pylon widget script/);

		const second = createPylonAdapter('app-123', fetchEmailHash);
		const secondPending = second.init(USER);
		await vi.waitFor(() => expect(document.querySelectorAll('script[src*="widget.usepylon.com"]')).toHaveLength(2));
		completeScriptLoad();

		await expect(secondPending).resolves.toBeUndefined();
	});

	it('queues show() through the stub before the widget loads', async () => {
		const adapter = createPylonAdapter('app-123', fetchEmailHash);
		const pending = adapter.init(USER);
		await vi.waitFor(() => expect(globals().Pylon).toBeDefined());
		adapter.show();

		expect(globals().Pylon?.q).toContainEqual(['show']);

		completeScriptLoad();
		await pending;
	});

	it('registers native onShow and onHide callbacks and routes them to handlers', () => {
		const adapter = createPylonAdapter('app-123', fetchEmailHash);
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
		const adapter = createPylonAdapter('app-123', fetchEmailHash);
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
});
