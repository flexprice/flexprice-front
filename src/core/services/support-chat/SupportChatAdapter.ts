/** The subset of the authenticated user a support-chat provider needs to identify them. */
export interface SupportChatUser {
	id: string;
	email?: string;
	name?: string;
	/** Epoch milliseconds. */
	createdAt?: number;
	tenantId?: string;
}

export interface SupportChatVisibilityHandlers {
	onShow: () => void;
	onHide: () => void;
}

/**
 * The only thing `useSupportChat` knows about a provider.
 *
 * Lifecycle ownership is deliberately non-overlapping:
 * - the function returned by `subscribe()` removes everything `subscribe()` registered;
 * - `dispose()` marks the adapter dead so no late callback fires, and releases
 *   anything `init()` created. It is idempotent and safe to call after unsubscribe.
 *
 * `init()` and `subscribe()` may be called in either order.
 */
export interface SupportChatAdapter {
	/**
	 * Load the SDK and identify the user.
	 *
	 * Async by design: this is the seam where a signed identity token is fetched
	 * once a backend endpoint exists (`chat_settings.jwt = await fetchIdentityToken()`).
	 *
	 * Rejects when the SDK cannot be loaded or the provider is misconfigured.
	 */
	init(user: SupportChatUser): Promise<void>;

	/** Open the messenger. Never throws — a no-op if init failed or has not completed. */
	show(): void;

	/** Register visibility handlers. The returned function removes them. */
	subscribe(handlers: SupportChatVisibilityHandlers): () => void;

	/** Tear down this adapter instance. Called exactly once, on unmount. Idempotent. */
	dispose(): void;
}
