import { FC, ReactNode } from 'react';
import { Sheet as ShadcnSheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

interface Props {
	trigger?: ReactNode;
	children?: ReactNode;
	title?: string | ReactNode;
	description?: string | ReactNode;
	isOpen?: boolean;
	onOpenChange?: (isOpen: boolean) => void;
	className?: string;
	size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
}

const Sheet: FC<Props> = ({ children, trigger, description, title, isOpen, onOpenChange, className, size = 'sm' }) => {
	return (
		<ShadcnSheet open={isOpen} onOpenChange={onOpenChange}>
			{trigger && <SheetTrigger asChild>{trigger}</SheetTrigger>}
			<SheetContent
				className={cn('h-screen overflow-y-auto !rounded-xl', className, {
					'sm:max-w-sm': size === 'sm',
					'sm:max-w-md': size === 'md',
					'sm:max-w-lg': size === 'lg',
					'sm:max-w-xl': size === 'xl',
					'sm:max-w-2xl': size === '2xl',
					'sm:max-w-full': size === 'full',
				})}>
				{(title || description) && (
					<SheetHeader>
						{title && <SheetTitle>{title}</SheetTitle>}
						{description && <SheetDescription>{description}</SheetDescription>}
					</SheetHeader>
				)}
				{children}
			</SheetContent>
		</ShadcnSheet>
	);
};

export default Sheet;
