/** Bump when shipping a new What's New modal — each id shows at most once per user. */
export const WHATS_NEW_RELEASE_ID = 'ui-revamp-2026-08';

/** Survives logout so a dismissed modal never reappears on the next login. */
export const WHATS_NEW_DISMISSALS_STORAGE_KEY = 'fp-whats-new-dismissals';

type WhatsNewDismissals = Record<string, Record<string, true>>;

function readDismissals(): WhatsNewDismissals {
	try {
		const raw = localStorage.getItem(WHATS_NEW_DISMISSALS_STORAGE_KEY);
		if (!raw) return {};
		const parsed = JSON.parse(raw) as WhatsNewDismissals;
		return parsed && typeof parsed === 'object' ? parsed : {};
	} catch {
		return {};
	}
}

function writeDismissals(dismissals: WhatsNewDismissals): void {
	try {
		localStorage.setItem(WHATS_NEW_DISMISSALS_STORAGE_KEY, JSON.stringify(dismissals));
	} catch {
		// ignore quota / private mode
	}
}

export function hasSeenWhatsNew(userId: string, releaseId: string = WHATS_NEW_RELEASE_ID): boolean {
	if (!userId) return false;
	return readDismissals()[userId]?.[releaseId] === true;
}

export function markWhatsNewSeen(userId: string, releaseId: string = WHATS_NEW_RELEASE_ID): void {
	if (!userId) return;
	const dismissals = readDismissals();
	dismissals[userId] = { ...dismissals[userId], [releaseId]: true };
	writeDismissals(dismissals);
}

/** Dev preview — open without auto-show on login. Dismiss still marks seen. */
export const WHATS_NEW_PREVIEW_EVENT = 'flexprice:preview-whats-new';

export function clearWhatsNewSeen(userId: string, releaseId: string = WHATS_NEW_RELEASE_ID): void {
	if (!userId) return;
	const dismissals = readDismissals();
	if (!dismissals[userId]?.[releaseId]) return;
	const { [releaseId]: _removed, ...restRelease } = dismissals[userId];
	if (Object.keys(restRelease).length === 0) {
		const { [userId]: _user, ...restUsers } = dismissals;
		writeDismissals(restUsers);
		return;
	}
	writeDismissals({ ...dismissals, [userId]: restRelease });
}
