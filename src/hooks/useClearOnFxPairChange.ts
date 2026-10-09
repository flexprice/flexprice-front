import { useEffect, useRef } from 'react';

/**
 * Clears FX rows when the charge → billing pair they were entered for changes, including when the
 * table hides (pair becomes undefined). Read-only rows are never cleared.
 */
export const useClearOnFxPairChange = (pair: string | undefined, editable: boolean, hasRows: boolean, clear: () => void) => {
	const previous = useRef(pair);
	useEffect(() => {
		const changed = previous.current !== pair;
		previous.current = pair;
		if (changed && editable && hasRows) clear();
	}, [pair, editable, hasRows, clear]);
};
