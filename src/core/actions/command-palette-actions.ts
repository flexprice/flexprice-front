/**
 * Centralized system for command-palette executable actions.
 * Use this for actions that run logic (fire events, open consumers, docs, contact, etc.) instead of or in addition to navigation.
 *
 * - Add new action IDs here and in @/config/command-palette.
 * - Consumers (e.g. DebugMenu) subscribe to the event bus for the action IDs they handle.
 * - Built-in handlers (e.g. open URL) run immediately when dispatching; no subscriber needed.
 */

export const COMMAND_PALETTE_ACTION_EVENT_PREFIX = 'command-palette:action:';

/** URLs and mailto used by built-in developer-help actions. */
export const COMMAND_PALETTE_ACTION_URLS = {
	documentation: 'https://docs.flexprice.io',
	contactEmail: 'mailto:support@flexprice.io',
	bookCall: 'https://calendly.com/nikhil-flexprice/30min',
	slackCommunity: 'https://join.slack.com/t/flexpricecommunity/shared_invite/zt-39uat51l0-n8JmSikHZP~bHJNXladeaQ',
} as const;

/** All executable action IDs. Add new ones here and keep in sync with command config. */
export const CommandPaletteActionId = {
	// Developer / help (built-in: open URL or mailto)
	OpenDocumentation: 'open-documentation',
	ContactUs: 'contact-us',
	BookCall: 'book-call',
	JoinSlackCommunity: 'join-slack-community',
	/** Open the support-chat messenger. Value stays `open-intercom` for backward compatibility. */
	OpenIntercom: 'open-intercom',
	/** Log out (SidebarFooter subscribes). */
	Logout: 'logout',
	/** Show keyboard shortcuts hint toast (CommandPalette subscribes). */
	ShowKeyboardShortcutsHint: 'show-keyboard-shortcuts-hint',
	// Debug / tools (subscribers handle these)
	DebugSimulateIngestEvents: 'debug-simulate-ingest-events',
	EventsConsumer: 'events-consumer',
} as const;

export type CommandPaletteActionIdType = (typeof CommandPaletteActionId)[keyof typeof CommandPaletteActionId];

/** Metadata for visibility and tooling. Used by CommandPalette to filter (e.g. dev-only). */
export const COMMAND_PALETTE_ACTION_META: Record<
	CommandPaletteActionIdType,
	{
		/** Only show this action when isDevelopment is true. */
		devOnly?: boolean;
	}
> = {
	[CommandPaletteActionId.OpenDocumentation]: {},
	[CommandPaletteActionId.ContactUs]: {},
	[CommandPaletteActionId.BookCall]: {},
	[CommandPaletteActionId.JoinSlackCommunity]: {},
	[CommandPaletteActionId.OpenIntercom]: {},
	[CommandPaletteActionId.Logout]: {},
	[CommandPaletteActionId.ShowKeyboardShortcutsHint]: {},
	[CommandPaletteActionId.DebugSimulateIngestEvents]: { devOnly: true },
	[CommandPaletteActionId.EventsConsumer]: { devOnly: true },
};

export function getCommandPaletteActionEventName(actionId: string): string {
	return `${COMMAND_PALETTE_ACTION_EVENT_PREFIX}${actionId}`;
}

function runBuiltInHandler(actionId: string): void {
	switch (actionId) {
		case CommandPaletteActionId.OpenDocumentation:
			window.open(COMMAND_PALETTE_ACTION_URLS.documentation, '_blank', 'noopener,noreferrer');
			break;
		case CommandPaletteActionId.ContactUs:
			window.open(COMMAND_PALETTE_ACTION_URLS.contactEmail, '_blank', 'noopener,noreferrer');
			break;
		case CommandPaletteActionId.BookCall:
			window.open(COMMAND_PALETTE_ACTION_URLS.bookCall, '_blank', 'noopener,noreferrer');
			break;
		case CommandPaletteActionId.JoinSlackCommunity:
			window.open(COMMAND_PALETTE_ACTION_URLS.slackCommunity, '_blank', 'noopener,noreferrer');
			break;
		default:
			break;
	}
}

/**
 * Dispatch an action from the command palette. Call this when the user selects a command with an actionId.
 * Runs any built-in handler (e.g. open docs, contact) then dispatches the event for subscribers (e.g. DebugMenu).
 */
export function dispatchCommandPaletteAction(actionId: string): void {
	runBuiltInHandler(actionId);
	window.dispatchEvent(new CustomEvent(getCommandPaletteActionEventName(actionId)));
}

/** Check if an action should be hidden when not in development. */
export function isCommandPaletteActionDevOnly(actionId: string): boolean {
	return COMMAND_PALETTE_ACTION_META[actionId as CommandPaletteActionIdType]?.devOnly ?? false;
}
