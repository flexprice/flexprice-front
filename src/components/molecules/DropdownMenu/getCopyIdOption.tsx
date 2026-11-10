import { Copy } from 'lucide-react';
import type { TFunction } from 'i18next';
import { copyToClipboard } from '@/utils/common/helper_functions';
import type { DropdownMenuOption } from './DropdownMenu';

/**
 * Builds a "Copy ID" DropdownMenuOption backed by the shared copyToClipboard util.
 * Pass `entityType` (e.g. "Plan") once labels are ready to move off the generic "Copy ID" text.
 */
export const getCopyIdOption = (id: string, t: TFunction, opts?: { entityType?: string; label?: string }): DropdownMenuOption => ({
	label: opts?.label ?? t('copyId.genericLabel'),
	icon: <Copy className='w-4 h-4' />,
	onSelect: (e: Event) => {
		e.preventDefault();
		void copyToClipboard(id, opts?.entityType ? t('copyId.toastWithType', { type: opts.entityType }) : t('copyId.toastFallback'));
	},
});
