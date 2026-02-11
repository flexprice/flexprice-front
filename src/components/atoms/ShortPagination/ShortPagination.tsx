import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import usePagination, { PAGINATION_PREFIX } from '@/hooks/usePagination';

interface ShortPaginationProps {
	totalItems: number; // Changed to required
	pageSize?: number;
	showPages?: boolean;
	unit?: string;
	prefix?: PAGINATION_PREFIX;
	/** When provided, pagination is controlled by parent (single source of truth); otherwise uses internal usePagination */
	currentPage?: number;
	onPageChange?: (page: number) => void;
}

const ShortPagination = ({
	totalItems,
	pageSize,
	unit = 'items',
	showPages = false,
	prefix,
	currentPage,
	onPageChange,
	// Keep these for backward compatibility
}: ShortPaginationProps) => {
	const internalPagination = usePagination({
		initialLimit: pageSize,
		prefix,
	});

	// Controlled: use props; uncontrolled: use internal hook
	const page = currentPage ?? internalPagination.page;
	const setPage = onPageChange ?? internalPagination.setPage;
	const limit = internalPagination.limit;

	// Use limit from hook if pageSize not provided, otherwise use pageSize
	const effectivePageSize = pageSize || limit;

	// Calculate actual total pages from totalItems and effectivePageSize (avoid div by zero)
	const calculatedTotalPages = effectivePageSize > 0 && totalItems > 0 ? Math.ceil(totalItems / effectivePageSize) : 0;
	const totalPages = calculatedTotalPages || 1;

	const handlePageChange = (newPage: number) => {
		if (newPage < 1 || newPage > totalPages) return;
		setPage(newPage);
	};

	// Show pagination when there are multiple pages or when we have items (so "Showing 1 to X of Y" is visible)
	if (totalItems === 0 && totalPages <= 1) return null;

	const startItem = (page - 1) * effectivePageSize + 1;
	const endItem = Math.min(page * effectivePageSize, totalItems);

	return (
		<div className='flex items-center justify-between py-4'>
			<div className='text-sm text-gray-500 font-light'>
				Showing <span className='font-normal'>{startItem}</span> to <span className='font-normal'>{endItem}</span> of{' '}
				<span className='font-normal'>{totalItems}</span> {unit}
			</div>
			<div className='flex items-center space-x-2'>
				<Button
					variant='outline'
					size='icon'
					onClick={() => handlePageChange(page - 1)}
					disabled={page === 1}
					className={cn('size-8', page === 1 && 'text-gray-300 cursor-not-allowed')}>
					<ChevronLeft className='h-4 w-4' />
				</Button>
				{showPages && (
					<div className='text-sm font-light text-gray-500'>
						Page {page} of {totalPages}
					</div>
				)}
				<Button
					variant='outline'
					size='icon'
					onClick={() => handlePageChange(page + 1)}
					disabled={page === totalPages}
					className={cn('size-8', page === totalPages && 'text-gray-300 cursor-not-allowed')}>
					<ChevronRight className='h-4 w-4' />
				</Button>
			</div>
		</div>
	);
};

export default ShortPagination;
