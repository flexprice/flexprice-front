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
 * The only thing `useSupportChat` knows about a provider. `subscribe()`'s return value
 * undoes `subscribe()`; `dispose()` kills the instance. Either may be called first.
 */
export interface SupportChatAdapter {
	/** Load the SDK and identify the user. Rejects if the SDK cannot load or config is invalid. */
	init(user: SupportChatUser): Promise<void>;

	/** Open the messenger. Never throws — a no-op if init failed or has not completed. */
	show(): void;

	/** Register visibility handlers. The returned function removes them. */
	subscribe(handlers: SupportChatVisibilityHandlers): () => void;

	/** Tear down this adapter instance. Called exactly once, on unmount. Idempotent. */
	dispose(): void;
}
