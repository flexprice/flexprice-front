/**
 * Pylon chat widget adapter. Unlike Intercom it has native onShow/onHide, so no polling.
 * Docs: https://docs.usepylon.com/pylon-docs/chat-widget/chat-setup
 */
import { errorLogger } from '@/core/services/error/ErrorLoggingService';
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
	return load;
}

/** Injected, not imported, so the API module is only reached when the flag is on. */
export type FetchPylonIdentityToken = () => Promise<string>;

export function createPylonAdapter(appId: string, fetchIdentityToken?: FetchPylonIdentityToken): SupportChatAdapter {
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

			// Best-effort: on failure, log and boot unverified so the Help button keeps working.
			let identityToken: string | null = null;
			if (fetchIdentityToken) {
				try {
					identityToken = await fetchIdentityToken();
				} catch (error) {
					errorLogger.logError(error instanceof Error ? error : new Error(String(error)), undefined, {
						scope: 'support-chat',
						action: 'fetch-pylon-identity-token',
					});
				}
			}

			// Pylon requires any identity sent to the widget to match the JWT claims, so the
			// token carries all of it and nothing else ships alongside it.
			const chatSettings: Record<string, unknown> = identityToken
				? { app_id: appId, jwt: identityToken }
				: {
						app_id: appId,
						email: user.email ?? '',
						name: user.name ?? '',
						// Groups a tenant's users under one Pylon account.
						...(user.tenantId ? { account_external_id: user.tenantId } : {}),
					};
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
