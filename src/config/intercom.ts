/**
 * @deprecated Use `@/config/support-chat`.
 *
 * Backward-compatibility shim. Contains re-exports only — no logic — so there is
 * nothing here to drift from the real implementation. Remove once no in-repo
 * imports remain.
 */
import { SupportChatProvider } from '@/models/SupportChat';
import { SUPPORT_CHAT_FLOW, type SupportChatFlowConfig } from './support-chat';

/**
 * @deprecated Use `isSupportChatAvailable()` from `@/config/support-chat` to gate
 * provider-agnostic UI. This retains its original meaning — Intercom specifically
 * is configured — and returns false when Pylon is the active provider.
 */
export { isIntercomProviderConfigured as isIntercomMessengerAvailable } from './support-chat';

/** @deprecated Use `SupportChatFlowConfig` from `@/config/support-chat`. */
export type IntercomMessengerFlowConfig = SupportChatFlowConfig;

/** @deprecated Use `SUPPORT_CHAT_FLOW[SupportChatProvider.Intercom]` from `@/config/support-chat`. */
export const INTERCOM_MESSENGER_FLOW: SupportChatFlowConfig = SUPPORT_CHAT_FLOW[SupportChatProvider.Intercom];
