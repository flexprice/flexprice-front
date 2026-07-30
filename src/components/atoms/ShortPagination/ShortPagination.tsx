import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import usePagination, { PAGINATION_PREFIX } from '@/hooks/usePagination';

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
	const { t } = useTranslation('common');
	const unit = unitProp ?? t('pagination.unitItems');

	const effectivePageSize = Math.max(1, pageSize);
	const totalPages = Math.max(1, Math.ceil(totalItems / effectivePageSize));
	const clampedPage = Math.min(Math.max(1, page), totalPages);

	const handlePageChange = (newPage: number) => {
		if (newPage < 1 || newPage > totalPages) return;
		onPageChange(newPage);
	};

	if (totalPages <= 1 && clampedPage <= 1) return null;

	const startItem = (clampedPage - 1) * effectivePageSize + 1;
	const endItem = Math.min(clampedPage * effectivePageSize, totalItems);

	return (
		<div className='flex items-center justify-between py-4'>
			<div className='text-sm font-light text-gray-500'>
				{t('pagination.showingRange', { start: startItem, end: endItem, total: totalItems, unit })}
			</div>
			<div className='flex items-center space-x-2'>
				<Button
					type='button'
					variant='outline'
					size='icon'
					onClick={() => handlePageChange(clampedPage - 1)}
					disabled={clampedPage === 1}
					className={cn('size-8', clampedPage === 1 && 'cursor-not-allowed text-gray-300')}>
					<ChevronLeft className='h-4 w-4' />
				</Button>
				{showPages && (
					<div className='text-sm font-light text-gray-500'>{t('pagination.page', { current: clampedPage, total: totalPages })}</div>
				)}
				<Button
					type='button'
					variant='outline'
					size='icon'
					onClick={() => handlePageChange(clampedPage + 1)}
					disabled={clampedPage === totalPages}
					className={cn('size-8', clampedPage === totalPages && 'cursor-not-allowed text-gray-300')}>
					<ChevronRight className='h-4 w-4' />
				</Button>
			</div>
		</div>
	);
};

interface ShortPaginationProps {
	totalItems: number;
	pageSize?: number;
	showPages?: boolean;
	unit?: string;
	prefix?: PAGINATION_PREFIX | string;
}

const ShortPagination = ({ totalItems, pageSize, unit, showPages = false, prefix }: ShortPaginationProps) => {
	const { page, setPage, limit } = usePagination({
		initialLimit: pageSize,
		prefix,
	});

	const effectivePageSize = pageSize || limit;

	return (
		<ShortPaginationControls
			page={page}
			onPageChange={setPage}
			totalItems={totalItems}
			pageSize={effectivePageSize}
			unit={unit}
			showPages={showPages}
		/>
	);
};

export default ShortPagination;
