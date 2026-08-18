/**
 * Pylon chat widget adapter.
 *
 * Docs: https://docs.usepylon.com/pylon-docs/chat-widget/chat-setup
 *       https://docs.usepylon.com/pylon-docs/chat-widget/javascript-api
 *
 * Emulates the same behaviour as the Intercom adapter: launcher hidden, opened
 * programmatically from the header Help button and the command palette, and
 * visibility reported to the hook. Unlike Intercom, Pylon exposes native
 * onShow/onHide callbacks, so no polling is needed.
 */
import { DocumentReadyState } from '@/types/enums/dom';
import type { SupportChatAdapter, SupportChatUser, SupportChatVisibilityHandlers } from '../SupportChatAdapter';

/** Pylon JS API commands. See the javascript-api doc linked above. */
enum PylonCommand {
	Show = 'show',
	Hide = 'hide',
	OnShow = 'onShow',
	OnHide = 'onHide',
	HideChatBubble = 'hideChatBubble',
}

const PYLON_WIDGET_BASE_URL = 'https://widget.usepylon.com/widget';

/**
 * App ids are opaque tokens from the Pylon dashboard. Validating before
 * interpolating into a <script src> stops a mis-set env var from becoming
 * URL injection.
 */
const PYLON_APP_ID_PATTERN = /^[A-Za-z0-9_-]+$/;

type PylonFn = ((...args: unknown[]) => void) & { q?: unknown[] };

interface PylonWindow {
	Pylon?: PylonFn;
	pylon?: { chat_settings: Record<string, unknown> };
}

/** One in-flight/settled load promise per app id, so repeated inits inject one script. */
const scriptLoads = new Map<string, Promise<void>>();

/** @internal Test-only: clears the module-level injection cache between tests. */
export function __resetPylonLoaderForTests(): void {
	scriptLoads.clear();
}

function pylonWindow(): PylonWindow {
	return window as unknown as PylonWindow;
}

/**
 * Reimplements Pylon's own queue stub: calls made before the widget script loads
 * are pushed onto `Pylon.q` and replayed by the widget once it initialises.
 */
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
	return load;
}

export function createPylonAdapter(appId: string): SupportChatAdapter {
	let disposed = false;
	let handlers: SupportChatVisibilityHandlers | null = null;
	let registered = false;

	return {
		async init(user: SupportChatUser): Promise<void> {
			if (typeof window === 'undefined') return;
			if (!PYLON_APP_ID_PATTERN.test(appId)) {
				throw new Error('Invalid Pylon app id: expected only letters, digits, hyphens and underscores');
			}

			const target = pylonWindow();
			// Settings must exist before the widget boots, per the Pylon setup docs.
			target.pylon = {
				chat_settings: {
					app_id: appId,
					email: user.email ?? '',
					name: user.name ?? '',
				},
			};
			installQueueStub(target);

			// Insert synchronously when the document is already complete, so callers can
			// observe the script element immediately. Only defer when it genuinely is not.
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
				// subscribe() may run before init(); make sure the queue exists either way.
				installQueueStub(target);
				registered = true;
				// Pylon documents no way to UNregister these, so route through a mutable
				// ref and gate on `disposed` instead.
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
