/**
 * Pylon chat widget adapter. Unlike Intercom it has native onShow/onHide, so no polling.
 * Docs: https://docs.usepylon.com/pylon-docs/chat-widget/chat-setup
 */
import { DocumentReadyState } from '@/types/enums/dom';
import type { SupportChatAdapter, SupportChatUser, SupportChatVisibilityHandlers } from '../SupportChatAdapter';

/** Pylon JS API commands. */
enum PylonCommand {
	Show = 'show',
	Hide = 'hide',
	OnShow = 'onShow',
	OnHide = 'onHide',
	HideChatBubble = 'hideChatBubble',
}

const PYLON_WIDGET_BASE_URL = 'https://widget.usepylon.com/widget';

/** Validated before interpolation into a <script src>, so a mis-set env var cannot inject a URL. */
const PYLON_APP_ID_PATTERN = /^[A-Za-z0-9_-]+$/;

/** Shared with `isPylonProviderConfigured` so config resolution and init() agree. */
export function isValidPylonAppId(appId: string): boolean {
	return PYLON_APP_ID_PATTERN.test(appId);
}

type PylonFn = ((...args: unknown[]) => void) & { q?: unknown[] };

interface PylonWindow {
	Pylon?: PylonFn;
	pylon?: { chat_settings: Record<string, unknown> };
}

/** One load promise per app id, so repeated inits inject a single script. */
const scriptLoads = new Map<string, Promise<void>>();

/** @internal Test-only: clears the module-level injection cache between tests. */
export function __resetPylonLoaderForTests(): void {
	scriptLoads.clear();
}

function pylonWindow(): PylonWindow {
	return window as unknown as PylonWindow;
}

/** Pylon's own queue stub: calls made before the script loads are replayed by the widget. */
function installQueueStub(target: PylonWindow): void {
	if (target.Pylon) return;

	const queue: unknown[] = [];
	const stub = ((...args: unknown[]) => {
		queue.push(args);
	}) as PylonFn;
	stub.q = queue;
	target.Pylon = stub;
}

function whenDocumentReady(): Promise<void> {
	return new Promise((resolve) => {
		window.addEventListener('load', () => resolve(), { once: true });
	});
}

function loadWidgetScript(appId: string): Promise<void> {
	const existing = scriptLoads.get(appId);
	if (existing) return existing;

	const load = new Promise<void>((resolve, reject) => {
		const script = document.createElement('script');
		script.type = 'text/javascript';
		script.async = true;
		script.crossOrigin = 'anonymous';
		script.referrerPolicy = 'strict-origin-when-cross-origin';
		script.src = `${PYLON_WIDGET_BASE_URL}/${appId}`;
		script.addEventListener('load', () => resolve(), { once: true });
		script.addEventListener('error', () => reject(new Error(`Failed to load Pylon widget script for app id ${appId}`)), {
			once: true,
		});
		document.head.appendChild(script);
	});

	scriptLoads.set(appId, load);
	// Evict on failure so a later init() can retry instead of replaying the same rejection.
	load.catch(() => {
		if (scriptLoads.get(appId) === load) scriptLoads.delete(appId);
	});
	return load;
}

export type FetchPylonEmailHash = () => Promise<string>;

export function createPylonAdapter(appId: string, fetchEmailHash?: FetchPylonEmailHash): SupportChatAdapter {
	let disposed = false;
	let handlers: SupportChatVisibilityHandlers | null = null;
	let registered = false;

	return {
		async init(user: SupportChatUser): Promise<void> {
			if (typeof window === 'undefined') return;
			if (!isValidPylonAppId(appId)) {
				throw new Error('Invalid Pylon app id: expected only letters, digits, hyphens and underscores');
			}

			const emailHash = fetchEmailHash ? await fetchEmailHash() : undefined;
			const target = pylonWindow();

			const chatSettings: Record<string, unknown> = {
				app_id: appId,
				email: user.email ?? '',
				name: user.name ?? '',
				contact_external_id: user.id,
				...(emailHash !== undefined ? { email_hash: emailHash } : {}),
			};
			// Pylon documents no re-identify call, so updating this after the widget has
			// already loaded is best-effort: it is confirmed to apply on first boot only.
			target.pylon = { chat_settings: chatSettings };
			installQueueStub(target);

			// Insert synchronously when the document is already complete; only defer if not.
			if (document.readyState !== DocumentReadyState.Complete) {
				await whenDocumentReady();
			}
			await loadWidgetScript(appId);

			if (disposed) return;
			target.Pylon?.(PylonCommand.HideChatBubble);
		},

		show(): void {
			if (disposed || typeof window === 'undefined') return;
			pylonWindow().Pylon?.(PylonCommand.Show);
		},

		subscribe(next: SupportChatVisibilityHandlers): () => void {
			handlers = next;

			if (!registered && typeof window !== 'undefined') {
				const target = pylonWindow();
				// subscribe() may run before init(), so ensure the queue exists.
				installQueueStub(target);
				registered = true;
				// Pylon cannot unregister these, so gate on `disposed` instead.
				target.Pylon?.(PylonCommand.OnShow, () => {
					if (!disposed) handlers?.onShow();
				});
				target.Pylon?.(PylonCommand.OnHide, () => {
					if (!disposed) handlers?.onHide();
				});
			}

			return () => {
				handlers = null;
			};
		},

		dispose(): void {
			disposed = true;
			handlers = null;
		},
	};
}
