import * as React from 'react';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { cn } from '@/lib/utils';
import { ButtonProps, buttonVariants } from '@/components/ui/button';

const Pagination = ({ className, ...props }: React.ComponentProps<'nav'>) => {
	const { t } = useTranslation('common');
	return (
		<nav
			role='navigation'
			aria-label={t('pagination.ariaNav')}
			className={cn('mx-auto flex w-full justify-center', className)}
			{...props}
		/>
	);
};
Pagination.displayName = 'Pagination';

const PaginationContent = React.forwardRef<HTMLUListElement, React.ComponentProps<'ul'>>(({ className, ...props }, ref) => (
	<ul ref={ref} className={cn('flex flex-row items-center gap-1', className)} {...props} />
));
PaginationContent.displayName = 'PaginationContent';

const PaginationItem = React.forwardRef<HTMLLIElement, React.ComponentProps<'li'>>(({ className, ...props }, ref) => (
	<li ref={ref} className={cn('!font-normal !text-gray-500', className)} {...props} />
));
PaginationItem.displayName = 'PaginationItem';

type PaginationLinkProps = {
	isActive?: boolean;
	disabled?: boolean;
} & Pick<ButtonProps, 'size'> &
	React.ComponentProps<'a'>;

const PaginationLink = ({ className, isActive, disabled, size = 'icon', ...props }: PaginationLinkProps) => (
	<a
		aria-disabled={disabled}
		aria-current={isActive ? 'page' : undefined}
		className={cn(
			buttonVariants({
				variant: isActive ? 'outline' : 'ghost',
				size,
			}),
			disabled ? 'cursor-not-allowed' : 'cursor-pointer',
			className,
		)}
		{...props}
	/>
);
PaginationLink.displayName = 'PaginationLink';

const PaginationPrevious = ({ className, ...props }: React.ComponentProps<typeof PaginationLink>) => {
	const { t } = useTranslation('common');
	return (
		<PaginationLink
			disabled={props.disabled}
			aria-label={t('pagination.ariaPreviousPage')}
			size='default'
			className={cn('gap-1 ps-2.5', className)}
			{...props}>
			<ChevronLeft className='h-4 w-4' />
			{/* <span>Previous</span> */}
		</PaginationLink>
	);
};
PaginationPrevious.displayName = 'PaginationPrevious';

const PaginationNext = ({ className, ...props }: React.ComponentProps<typeof PaginationLink>) => {
	const { t } = useTranslation('common');
	return (
		<PaginationLink aria-label={t('pagination.ariaNextPage')} size='default' className={cn('gap-1 pe-2.5', className)} {...props}>
			{/* <span>Next</span> */}
			<ChevronRight className='h-4 w-4' />
		</PaginationLink>
	);
};
PaginationNext.displayName = 'PaginationNext';

const PaginationEllipsis = ({ className, ...props }: React.ComponentProps<'span'>) => {
	const { t } = useTranslation('common');
	return (
		<span aria-hidden className={cn('flex h-9 w-9 items-center justify-center', className)} {...props}>
			<MoreHorizontal className='h-4 w-4' />
			<span className='sr-only'>{t('pagination.morePagesSrOnly')}</span>
		</span>
	);
};
PaginationEllipsis.displayName = 'PaginationEllipsis';

export { Pagination, PaginationContent, PaginationLink, PaginationItem, PaginationPrevious, PaginationNext, PaginationEllipsis };
