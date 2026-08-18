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

type PylonGlobals = {
	Pylon?: ((...args: unknown[]) => void) & { q?: unknown[] };
	pylon?: { chat_settings: Record<string, unknown> };
};

function globals(): PylonGlobals {
	return window as unknown as PylonGlobals;
}

/** Resolve the pending script by firing its onload, mimicking a successful widget fetch. */
function completeScriptLoad(): void {
	const script = document.querySelector<HTMLScriptElement>('script[src*="widget.usepylon.com"]');
	script?.dispatchEvent(new Event('load'));
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
});
