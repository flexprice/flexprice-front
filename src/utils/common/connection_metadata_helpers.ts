/**
 * Merges updates into a connection's metadata map.
 *
 * The connections API replaces `metadata` wholesale rather than merging it, so any PUT
 * carrying metadata must send the complete map or the omitted keys are dropped. Callers
 * are expected to read the current map, pass it here, and PUT the result.
 *
 * A blank or undefined update removes its key instead of storing an empty string, since
 * an empty string is a value: providers read it as "redirect to nowhere" rather than
 * falling back to their unset behaviour.
 */
export const mergeConnectionMetadata = (
	existing: Record<string, string> | undefined,
	updates: Record<string, string | undefined>,
): Record<string, string> => {
	const merged: Record<string, string> = { ...existing };

	for (const [key, value] of Object.entries(updates)) {
		const trimmed = value?.trim();
		if (trimmed) {
			merged[key] = trimmed;
		} else {
			delete merged[key];
		}
	}

	return merged;
};
