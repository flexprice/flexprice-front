export interface MetadataPair {
	key: string;
	value: string;
}

/** Parse metadata JSON from a filter value; returns only non-empty pairs. */
export const parseMetadataPairs = (valueString: string | undefined): MetadataPair[] => {
	if (valueString == null || valueString.trim() === '') return [];
	try {
		const parsed: unknown = JSON.parse(valueString);
		if (!Array.isArray(parsed)) return [];
		return parsed
			.filter((item): item is Record<string, unknown> => item != null && typeof item === 'object')
			.map((item) => ({
				key: typeof item.key === 'string' ? item.key : '',
				value: typeof item.value === 'string' ? item.value : '',
			}))
			.filter((pair) => pair.key.trim() !== '' || pair.value.trim() !== '');
	} catch {
		return [];
	}
};

/** Like {@link parseMetadataPairs} but always returns at least one blank row for the filter popover editor. */
export const parseMetadataPairsForEditor = (valueString: string | undefined): MetadataPair[] => {
	const pairs = parseMetadataPairs(valueString);
	return pairs.length > 0 ? pairs : [{ key: '', value: '' }];
};

export const updateMetadataPairAt = (pairs: MetadataPair[], index: number, field: keyof MetadataPair, val: string): MetadataPair[] =>
	pairs.map((pair, i) => (i === index ? { ...pair, [field]: val } : pair));

export const removeMetadataPairAt = (pairs: MetadataPair[], index: number): MetadataPair[] => {
	const next = pairs.filter((_, i) => i !== index);
	return next.length > 0 ? next : [{ key: '', value: '' }];
};

/** Merge metadata pairs from every `metadata` pseudo-filter; later entries win on duplicate keys. */
export const mergeMetadataPairsFromFilters = (
	filters: { field: string; valueString?: string }[] | undefined,
	metadataField: string,
): MetadataPair[] => {
	const merged = new Map<string, string>();
	for (const filter of filters ?? []) {
		if (filter.field !== metadataField) continue;
		for (const pair of parseMetadataPairs(filter.valueString)) {
			const key = pair.key.trim();
			const value = pair.value.trim();
			if (key && value) merged.set(key, value);
		}
	}
	return Array.from(merged.entries()).map(([key, value]) => ({ key, value }));
};

export const splitMetadataPairsForEditor = (
	valueString: string | undefined,
	reservedMetadataKeys: ReadonlySet<string>,
): { reservedPairs: MetadataPair[]; editablePairs: MetadataPair[] } => {
	const reservedPairs: MetadataPair[] = [];
	const editablePairs: MetadataPair[] = [];

	for (const pair of parseMetadataPairs(valueString)) {
		const key = pair.key.trim();
		if (key && reservedMetadataKeys.has(key)) reservedPairs.push({ key, value: pair.value.trim() });
		else editablePairs.push(pair);
	}

	return {
		reservedPairs,
		editablePairs: editablePairs.length > 0 ? editablePairs : [{ key: '', value: '' }],
	};
};

/** Preserve in-progress rows (key or value partially filled) so metadata inputs remain editable. */
export const mergeReservedAndEditableMetadataPairs = (reservedPairs: MetadataPair[], editablePairs: MetadataPair[]): MetadataPair[] => {
	const editable = editablePairs.filter((pair) => pair.key.trim() !== '' || pair.value.trim() !== '');
	return [...reservedPairs, ...editable];
};
