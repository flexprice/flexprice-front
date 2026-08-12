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
}

export const ShortPaginationControls = ({
	page,
	onPageChange,
	totalItems,
	pageSize,
	unit: unitProp,
	showPages = false,
}: ShortPaginationControlsProps) => {
	const t = usePaginationT();
	const unit = unitProp ?? t('pagination.unitItems');

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

	if (totalPages <= 1 && clampedPage <= 1) return null;

	const startItem = (clampedPage - 1) * effectivePageSize + 1;
	const endItem = Math.min(clampedPage * effectivePageSize, totalItems);

	return (
		<div className='flex items-center justify-between py-4'>
			<div className='text-sm font-light text-content-muted'>
				{t('pagination.showingRange', { start: startItem, end: endItem, total: totalItems, unit })}
			</div>
			<div className='flex items-center space-x-2'>
				<Button
					type='button'
					variant='outline'
					size='icon'
					aria-label={t('pagination.previous')}
					onClick={() => handlePageChange(clampedPage - 1)}
					disabled={clampedPage === 1}
					className={cn('size-8', clampedPage === 1 && 'cursor-not-allowed text-content-disabled')}>
					<ChevronLeft className='h-4 w-4' />
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
					className={cn('size-8', clampedPage === totalPages && 'cursor-not-allowed text-content-disabled')}>
					<ChevronRight className='h-4 w-4' />
				</Button>
			</div>
		</div>
	);
};
