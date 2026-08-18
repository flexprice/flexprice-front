import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { SupportChatUser } from '../SupportChatAdapter';

const { intercomSdk } = vi.hoisted(() => ({ intercomSdk: vi.fn() }));

vi.mock('@intercom/messenger-js-sdk', () => ({ default: intercomSdk }));
vi.mock('../../intercom/index.css', () => ({}));

const USER: SupportChatUser = {
	id: 'user_1',
	email: 'ada@example.com',
	name: 'Ada Tenant',
	createdAt: 1_700_000_000_000,
	tenantId: 'tenant_1',
};

type IntercomGlobals = { Intercom?: (command: string) => unknown };

function globals(): IntercomGlobals {
	return window as unknown as IntercomGlobals;
}

describe('intercom adapter', () => {
	beforeEach(() => {
		vi.useFakeTimers();
		intercomSdk.mockClear();
		delete globals().Intercom;
	});

	afterEach(() => {
		vi.useRealTimers();
		vi.restoreAllMocks();
	});

	it('boots the SDK with the identified user and a hidden launcher', async () => {
		const { createIntercomAdapter } = await import('./intercom');
		const adapter = createIntercomAdapter('abc123', 1000, true);

		await adapter.init(USER);

		expect(intercomSdk).toHaveBeenCalledWith({
			app_id: 'abc123',
			user_id: 'user_1',
			name: 'Ada Tenant',
			email: 'ada@example.com',
			created_at: 1_700_000_000, // Unix seconds, not the epoch-ms USER.createdAt
			hide_default_launcher: true,
		});
	});

	it('opens the messenger via the SDK show command', async () => {
		const intercom = vi.fn();
		globals().Intercom = intercom;
		const { createIntercomAdapter } = await import('./intercom');
		const adapter = createIntercomAdapter('abc123', 1000, true);

		await adapter.init(USER);
		adapter.show();

		expect(intercom).toHaveBeenCalledWith('show');
	});

	it('synthesises onShow and onHide by polling isVisible', async () => {
		let visible = false;
		globals().Intercom = vi.fn((command: string) => (command === 'isVisible' ? visible : undefined));
		const { createIntercomAdapter } = await import('./intercom');
		const adapter = createIntercomAdapter('abc123', 1000, true);
		const onShow = vi.fn();
		const onHide = vi.fn();

		await adapter.init(USER);
		adapter.subscribe({ onShow, onHide });

		visible = true;
		vi.advanceTimersByTime(1000);
		expect(onShow).toHaveBeenCalledOnce();
		expect(onHide).not.toHaveBeenCalled();

		visible = false;
		vi.advanceTimersByTime(1000);
		expect(onHide).toHaveBeenCalledOnce();
	});

	it('does not re-fire while visibility is unchanged', async () => {
		globals().Intercom = vi.fn((command: string) => (command === 'isVisible' ? true : undefined));
		const { createIntercomAdapter } = await import('./intercom');
		const adapter = createIntercomAdapter('abc123', 1000, true);
		const onShow = vi.fn();
		const onHide = vi.fn();

		await adapter.init(USER);
		adapter.subscribe({ onShow, onHide });
		vi.advanceTimersByTime(5000);

		expect(onShow).toHaveBeenCalledOnce();
	});

	it('does not fire a close before the messenger has ever been seen open', async () => {
		globals().Intercom = vi.fn(() => false);
		const { createIntercomAdapter } = await import('./intercom');
		const adapter = createIntercomAdapter('abc123', 1000, true);
		const onHide = vi.fn();

		await adapter.init(USER);
		adapter.subscribe({ onShow: vi.fn(), onHide });
		vi.advanceTimersByTime(5000);

		expect(onHide).not.toHaveBeenCalled();
	});

	it('maps postMessage events to handlers', async () => {
		globals().Intercom = vi.fn(() => false);
		const { createIntercomAdapter } = await import('./intercom');
		const adapter = createIntercomAdapter('abc123', 1000, true);
		const onShow = vi.fn();
		const onHide = vi.fn();

		await adapter.init(USER);
		adapter.subscribe({ onShow, onHide });

		window.dispatchEvent(new MessageEvent('message', { data: { type: 'intercom:show' }, origin: 'https://widget.intercom.io' }));
		window.dispatchEvent(new MessageEvent('message', { data: { type: 'intercom:hide' }, origin: 'https://widget.intercom.io' }));

		expect(onShow).toHaveBeenCalledOnce();
		expect(onHide).toHaveBeenCalledOnce();
	});

	it('ignores postMessage events from an untrusted origin', async () => {
		globals().Intercom = vi.fn(() => false);
		const { createIntercomAdapter } = await import('./intercom');
		const adapter = createIntercomAdapter('abc123', 1000, true);
		const onShow = vi.fn();
		const onHide = vi.fn();

		await adapter.init(USER);
		adapter.subscribe({ onShow, onHide });

		window.dispatchEvent(new MessageEvent('message', { data: { type: 'intercom:show' }, origin: 'https://evil.example.com' }));
		window.dispatchEvent(new MessageEvent('message', { data: { type: 'intercom:show' }, origin: 'https://notintercom.io.evil.com' }));

		expect(onShow).not.toHaveBeenCalled();
		expect(onHide).not.toHaveBeenCalled();
	});

	it('trusts any subdomain of intercom.io', async () => {
		globals().Intercom = vi.fn(() => false);
		const { createIntercomAdapter } = await import('./intercom');
		const adapter = createIntercomAdapter('abc123', 1000, true);
		const onShow = vi.fn();

		await adapter.init(USER);
		adapter.subscribe({ onShow, onHide: vi.fn() });

		window.dispatchEvent(new MessageEvent('message', { data: { type: 'intercom:show' }, origin: 'https://api-iam.eu.intercom.io' }));

		expect(onShow).toHaveBeenCalledOnce();
	});

	it('stops polling after unsubscribe', async () => {
		let visible = false;
		globals().Intercom = vi.fn((command: string) => (command === 'isVisible' ? visible : undefined));
		const { createIntercomAdapter } = await import('./intercom');
		const adapter = createIntercomAdapter('abc123', 1000, true);
		const onShow = vi.fn();

		await adapter.init(USER);
		const unsubscribe = adapter.subscribe({ onShow, onHide: vi.fn() });
		unsubscribe();

		visible = true;
		vi.advanceTimersByTime(5000);

		expect(onShow).not.toHaveBeenCalled();
	});

	it('swallows SDK errors raised while polling', async () => {
		globals().Intercom = vi.fn(() => {
			throw new Error('Intercom not ready');
		});
		const { createIntercomAdapter } = await import('./intercom');
		const adapter = createIntercomAdapter('abc123', 1000, true);

		await adapter.init(USER);
		adapter.subscribe({ onShow: vi.fn(), onHide: vi.fn() });

		expect(() => vi.advanceTimersByTime(3000)).not.toThrow();
	});
});
