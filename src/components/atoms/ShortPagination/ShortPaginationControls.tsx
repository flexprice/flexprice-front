import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePaginationT } from './ShortPaginationControls.i18n';

export interface ShortPaginationControlsProps {
	page: number;
	onPageChange: (page: number) => void;
	totalItems: number;
	pageSize: number;
	unit?: string;
	showPages?: boolean;
	variant?: 'default' | 'embedded';
}

export const ShortPaginationControls = ({
	page,
	onPageChange,
	totalItems,
	pageSize,
	unit: unitProp,
	showPages = false,
	variant = 'default',
}: ShortPaginationControlsProps) => {
	const t = usePaginationT();
	const unit = unitProp ?? t('pagination.unitItems');
	const isEmbedded = variant === 'embedded';

	const effectivePageSize = Math.max(1, pageSize);
	const totalPages = Math.max(1, Math.ceil(totalItems / effectivePageSize));
	const clampedPage = Math.min(Math.max(1, page), totalPages);

	// The controlled `page` can go stale (e.g. the total shrinks below it after a delete/filter) —
	// resync the parent to the clamped value so it doesn't keep requesting an out-of-range page.
	useEffect(() => {
		if (page !== clampedPage) onPageChange(clampedPage);
	}, [page, clampedPage, onPageChange]);

	const handlePageChange = (newPage: number) => {
		if (newPage < 1 || newPage > totalPages) return;
		onPageChange(newPage);
	};

	if (!isEmbedded && totalPages <= 1 && clampedPage <= 1) return null;

	const startItem = totalItems === 0 ? 0 : (clampedPage - 1) * effectivePageSize + 1;
	const endItem = Math.min(clampedPage * effectivePageSize, totalItems);
	const rangeLabel = isEmbedded
		? t('pagination.showingRangeCompact', { start: startItem, end: endItem, total: totalItems, unit })
		: t('pagination.showingRange', { start: startItem, end: endItem, total: totalItems, unit });

	return (
		<div className={cn('flex items-center justify-between', isEmbedded ? 'h-[var(--fp-table-pager-height)] bg-surface px-4 py-2' : 'py-4')}>
			<div className={cn('text-sm text-content-muted', isEmbedded ? 'font-normal' : 'font-light')}>{rangeLabel}</div>
			<div className={cn('flex items-center', isEmbedded ? 'gap-1.5' : 'space-x-2')}>
				<Button
					type='button'
					variant='outline'
					size='icon'
					aria-label={t('pagination.previous')}
					onClick={() => handlePageChange(clampedPage - 1)}
					disabled={clampedPage === 1}
					className={cn(
						clampedPage === 1 && 'cursor-not-allowed text-content-disabled',
						isEmbedded ? 'size-8 rounded-[var(--fp-radius-md)] border-line-zinc bg-surface shadow-none [&_svg]:size-3.5' : 'size-8',
					)}>
					<ChevronLeft className={isEmbedded ? 'size-3.5' : 'h-4 w-4'} />
				</Button>
				{showPages && (
					<div className='text-sm font-light text-content-muted'>{t('pagination.page', { current: clampedPage, total: totalPages })}</div>
				)}
				<Button
					type='button'
					variant='outline'
					size='icon'
					aria-label={t('pagination.next')}
					onClick={() => handlePageChange(clampedPage + 1)}
					disabled={clampedPage === totalPages}
					className={cn(
						clampedPage === totalPages && 'cursor-not-allowed text-content-disabled',
						isEmbedded ? 'size-8 rounded-[var(--fp-radius-md)] border-line-zinc bg-surface shadow-none [&_svg]:size-3.5' : 'size-8',
					)}>
					<ChevronRight className={isEmbedded ? 'size-3.5' : 'h-4 w-4'} />
				</Button>
			</div>
		</div>
	);
};
