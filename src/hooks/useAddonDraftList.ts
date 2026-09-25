import { useCallback, useRef, useState } from 'react';
import { AddonDraft, createAddonDraft, isAddonDraftMissingCustomDate } from '@/utils/subscription/buildAddonBulkModifyRequest';

const withoutKey = (set: Set<string>, key: string): Set<string> => {
	if (!set.has(key)) return set;
	const next = new Set(set);
	next.delete(key);
	return next;
};

/**
 * Staged addons in a multi-addon dialog: the drafts themselves, which cards are expanded, and
 * which fail validation. Shared by the subscription modify dialog and the create-subscription
 * addon modal so both stage, collapse and validate addons the same way.
 */
export const useAddonDraftList = () => {
	const [drafts, setDrafts] = useState<AddonDraft[]>([]);
	const [openKeys, setOpenKeys] = useState<Set<string>>(new Set());
	const [invalidKeys, setInvalidKeys] = useState<Set<string>>(new Set());
	const nextKeyRef = useRef(0);

	const nextKey = useCallback(() => `draft_${nextKeyRef.current++}`, []);

	/** Replace the list (empty on open, or one prefilled draft when editing); every draft starts expanded. */
	const reset = useCallback((initial: AddonDraft[] = []) => {
		setDrafts(initial);
		setOpenKeys(new Set(initial.map((draft) => draft.key)));
		setInvalidKeys(new Set());
	}, []);

	const stage = useCallback(
		(addonId: string) => {
			const key = nextKey();
			setDrafts((prev) => [...prev, createAddonDraft(addonId, key)]);
			// Keep focus on the addon just picked; earlier ones collapse to their summary row.
			setOpenKeys(new Set([key]));
		},
		[nextKey],
	);

	const update = useCallback((key: string, patch: Partial<AddonDraft>) => {
		setDrafts((prev) => prev.map((draft) => (draft.key === key ? { ...draft, ...patch } : draft)));
		setInvalidKeys((prev) => withoutKey(prev, key));
	}, []);

	const remove = useCallback((key: string) => {
		setDrafts((prev) => prev.filter((draft) => draft.key !== key));
	}, []);

	const setOpen = useCallback((key: string, open: boolean) => {
		setOpenKeys((prev) => (open ? new Set([...prev, key]) : withoutKey(prev, key)));
	}, []);

	/** Flags and expands drafts missing a required custom date; returns true when all are valid. */
	const validate = useCallback((): boolean => {
		const invalid = new Set(drafts.filter(isAddonDraftMissingCustomDate).map((draft) => draft.key));
		setInvalidKeys(invalid);
		if (invalid.size > 0) setOpenKeys((prev) => new Set([...prev, ...invalid]));
		return invalid.size === 0;
	}, [drafts]);

	return { drafts, openKeys, invalidKeys, nextKey, reset, stage, update, remove, setOpen, validate };
};
