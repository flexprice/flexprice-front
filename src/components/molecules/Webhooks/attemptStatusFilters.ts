import { MessageStatus } from 'svix';

export const ATTEMPT_STATUS_FILTERS = [
	{ key: 'all', status: undefined },
	{ key: 'succeeded', status: MessageStatus.Success },
	{ key: 'failed', status: MessageStatus.Fail },
] as const;

export type AttemptStatusFilterKey = (typeof ATTEMPT_STATUS_FILTERS)[number]['key'];
