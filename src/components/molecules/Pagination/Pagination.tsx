import { useSearchParams } from 'react-router';
import {
	Pagination,
	PaginationContent,
	PaginationLink,
	PaginationItem,
	PaginationPrevious,
	PaginationNext,
	PaginationEllipsis,
} from '@/components/ui/pagination';
import { Spacer } from '@/components/atoms';
import { cn } from '@/lib/utils';

interface FlexpricePaginationProps {
	totalPages: number;
	maxPagesBeforeTruncate?: number; // New prop to control when to start truncating
	siblingCount?: number; // New prop to control how many siblings to show
}

const FLexpricePagination = ({ totalPages, maxPagesBeforeTruncate = 10, siblingCount = 2 }: FlexpricePaginationProps) => {
	const [searchParams, setSearchParams] = useSearchParams();
	const currentPage = parseInt(searchParams.get('page') || '1', 10);

	const handlePageChange = (page: number) => {
		if (page < 1 || page > totalPages) return;
		setSearchParams({ page: page.toString() });
	};

	if (totalPages <= 1) return null;

	const getPageNumbers = () => {
		const pageNumbers: (number | 'ellipsis')[] = [];

		// Always show first page
		pageNumbers.push(1);

		if (totalPages <= maxPagesBeforeTruncate) {
			// If total pages are less than or equal to maxPagesBeforeTruncate, show all pages
			for (let i = 2; i <= totalPages; i++) {
				pageNumbers.push(i);
			}
		} else {
			// Calculate range of pages to show around current page
			const leftSiblingIndex = Math.max(currentPage - siblingCount, 2);
			const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages - 1);

			// Add left ellipsis if needed
			if (leftSiblingIndex > 2) {
				pageNumbers.push('ellipsis');
			}

			// Add pages around current page
			for (let i = leftSiblingIndex; i <= rightSiblingIndex; i++) {
				pageNumbers.push(i);
			}

			// Add right ellipsis if needed
			if (rightSiblingIndex < totalPages - 1) {
				pageNumbers.push('ellipsis');
			}

			// Always show last page
			if (rightSiblingIndex < totalPages) {
				pageNumbers.push(totalPages);
			}
		}

		return pageNumbers;
	};

	const handleEllipsisClick = (position: 'left' | 'right') => {
		const jumpSize = Math.max(Math.floor(maxPagesBeforeTruncate / 3), 3); // Dynamic jump size based on maxPagesBeforeTruncate
		if (position === 'left') {
			const newPage = Math.max(1, currentPage - jumpSize);
			handlePageChange(newPage);
		} else {
			const newPage = Math.min(totalPages, currentPage + jumpSize);
			handlePageChange(newPage);
		}
	};

	return (
		<div className='!mb-6'>
			<Spacer className='!my-4' />
			<Pagination>
				<PaginationContent>
					{/* Previous Button */}
					<PaginationItem>
						<PaginationPrevious
							onClick={() => handlePageChange(currentPage - 1)}
							className={cn(
								currentPage === 1 && 'text-gray-500 select-none cursor-not-allowed hover:bg-white hover:text-gray-500',
								'!font-normal !text-gray-500',
							)}
							disabled={currentPage === 1}
						/>
					</PaginationItem>

					{/* Pagination Items */}
					{getPageNumbers().map((pageNumber, index) => {
						if (pageNumber === 'ellipsis') {
							return (
								<PaginationItem key={`ellipsis-${index}`}>
									<PaginationEllipsis
										className='cursor-pointer hover:bg-gray-100'
										onClick={() => handleEllipsisClick(index < currentPage ? 'left' : 'right')}
									/>
								</PaginationItem>
							);
						}

						return (
							<PaginationItem className={cn('cursor-pointer')} key={pageNumber}>
								<PaginationLink
									isActive={currentPage === pageNumber}
									onClick={() => handlePageChange(pageNumber)}
									className={cn(currentPage === pageNumber && 'text-gray-500')}>
									{pageNumber}
								</PaginationLink>
							</PaginationItem>
						);
					})}

					{/* Next Button */}
					<PaginationItem>
						<PaginationNext
							onClick={() => handlePageChange(currentPage + 1)}
							className={cn(
								currentPage === totalPages && 'text-gray-500 select-none cursor-not-allowed hover:bg-white hover:text-gray-500',
								'!font-normal !text-gray-500',
							)}
							disabled={currentPage === totalPages}
						/>
					</PaginationItem>
				</PaginationContent>
			</Pagination>
		</div>
	);
};

export default FLexpricePagination;
