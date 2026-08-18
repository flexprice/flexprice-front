/** @deprecated Use `@/config/support-chat`. Re-exports only; remove once no in-repo imports remain. */
import { SupportChatProvider } from '@/models/SupportChat';
import { SUPPORT_CHAT_FLOW, type SupportChatFlowConfig } from './support-chat';

/** @deprecated Use `isSupportChatAvailable()`. Keeps its original meaning: Intercom specifically is configured. */
export { isIntercomProviderConfigured as isIntercomMessengerAvailable } from './support-chat';

/** @deprecated Use `SupportChatFlowConfig` from `@/config/support-chat`. */
export type IntercomMessengerFlowConfig = SupportChatFlowConfig;

/** @deprecated Use `SUPPORT_CHAT_FLOW[SupportChatProvider.Intercom]` from `@/config/support-chat`. */
export const INTERCOM_MESSENGER_FLOW: SupportChatFlowConfig = SUPPORT_CHAT_FLOW[SupportChatProvider.Intercom];
