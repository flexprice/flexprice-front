/**
 * @deprecated Use `@/core/services/support-chat/SupportChat`.
 *
 * Backward-compatibility shim. Contains a re-export only — no logic. The default
 * export still renders the header Help button and drives whichever support-chat
 * provider is configured. Remove once no in-repo imports remain.
 */
export { default } from '../support-chat/SupportChat';
