import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SupportChatProvider } from '@/models/SupportChat';
import type { SupportChatAdapter, SupportChatUser } from '../SupportChatAdapter';

vi.mock('@intercom/messenger-js-sdk', () => ({ default: vi.fn() }));
vi.mock('../../intercom/index.css', () => ({}));

const USER: SupportChatUser = {
	id: 'user_1',
	email: 'ada@example.com',
	name: 'Ada Tenant',
	createdAt: 1_700_000_000_000,
	tenantId: 'tenant_1',
};

/** Let the Pylon script "load" so its init promise settles; a no-op for Intercom, which never injects one. */
async function settlePendingScript(): Promise<void> {
	try {
		await vi.waitFor(
			() => {
				if (!document.querySelector('script[src*="widget.usepylon.com"]')) throw new Error('not yet injected');
			},
			{ timeout: 100 },
		);
	} catch {
		return;
	}
	document.querySelector<HTMLScriptElement>('script[src*="widget.usepylon.com"]')?.dispatchEvent(new Event('load'));
}

const CASES: ReadonlyArray<{ provider: SupportChatProvider; create: () => Promise<SupportChatAdapter> }> = [
	{
		provider: SupportChatProvider.Intercom,
		create: async () => {
			const { createIntercomAdapter } = await import('./intercom');
			return createIntercomAdapter('abc123', 1000, true);
		},
	},
	{
		provider: SupportChatProvider.Pylon,
		create: async () => {
			const { createPylonAdapter } = await import('./pylon');
			return createPylonAdapter('app-123', async () => 'hashed-email');
		},
	},
];

describe.each(CASES)('$provider adapter conformance', ({ create }) => {
	beforeEach(async () => {
		const { __resetPylonLoaderForTests } = await import('./pylon');
		__resetPylonLoaderForTests();
		document.head.innerHTML = '';
		delete (window as unknown as { Pylon?: unknown }).Pylon;
		delete (window as unknown as { pylon?: unknown }).pylon;
		delete (window as unknown as { Intercom?: unknown }).Intercom;
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('resolves init for a valid configuration', async () => {
		const adapter = await create();
		const pending = adapter.init(USER);
		await settlePendingScript();

		await expect(pending).resolves.toBeUndefined();
	});

	it('does not throw when show() is called before init', async () => {
		const adapter = await create();

		expect(() => adapter.show()).not.toThrow();
	});

	it('does not throw when show() is called after dispose', async () => {
		const adapter = await create();
		const pending = adapter.init(USER);
		await settlePendingScript();
		await pending;
		adapter.dispose();

		expect(() => adapter.show()).not.toThrow();
	});

	it('accepts subscribe before init', async () => {
		const adapter = await create();

		expect(() => adapter.subscribe({ onShow: vi.fn(), onHide: vi.fn() })).not.toThrow();

		const pending = adapter.init(USER);
		await settlePendingScript();
		await expect(pending).resolves.toBeUndefined();
	});

	it('returns an unsubscribe function that is safe to call twice', async () => {
		const adapter = await create();
		const unsubscribe = adapter.subscribe({ onShow: vi.fn(), onHide: vi.fn() });

		expect(() => {
			unsubscribe();
			unsubscribe();
		}).not.toThrow();
	});

	it('has an idempotent dispose', async () => {
		const adapter = await create();
		const pending = adapter.init(USER);
		await settlePendingScript();
		await pending;

		expect(() => {
			adapter.dispose();
			adapter.dispose();
		}).not.toThrow();
	});

	it('tolerates dispose without a prior init or subscribe', async () => {
		const adapter = await create();

		expect(() => adapter.dispose()).not.toThrow();
	});
});
