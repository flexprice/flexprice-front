import { createContext, useContext } from 'react';

/** DOM mount target for list-page filter/sort controls rendered beside Page heading actions. */
export const PageToolbarSlotContext = createContext<HTMLDivElement | null>(null);

export function usePageToolbarSlot() {
	return useContext(PageToolbarSlotContext);
}
