import { FC, ReactNode, useRef, useEffect } from 'react';
import { Sheet as ShadcnSheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { hasRegisteredOpenModals, hasOpenOverlayInDom, registerModalOpen, useSheetOutsideDismissGuards } from '@/lib/modal-scroll-lock';
import { useLocaleStore } from '@/store/useLocaleStore';
import { Direction } from '@/config/branding';

interface Props {
	trigger?: ReactNode;
	children?: ReactNode;
	title?: string | ReactNode;
	description?: string | ReactNode;
	isOpen?: boolean;
	onOpenChange?: (isOpen: boolean) => void;
	className?: string;
	size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'full';
}

const Sheet: FC<Props> = ({ children, trigger, description, title, isOpen, onOpenChange, className, size = 'sm' }) => {
	const contentRef = useRef<HTMLDivElement>(null);
	const direction = useLocaleStore((s) => s.direction);
	const side = direction === Direction.RTL ? 'left' : 'right';
	const outsideDismissGuards = useSheetOutsideDismissGuards(!!isOpen);

	useEffect(() => {
		if (!isOpen) return;
		return registerModalOpen();
	}, [isOpen]);

	// Clear stuck body scroll/pointer locks after close when nested overlays race Radix cleanup.
	useEffect(() => {
		if (isOpen) return;
		const timer = window.setTimeout(() => {
			if (hasRegisteredOpenModals()) return;
			if (hasOpenOverlayInDom()) return;
			if (document.body.style.pointerEvents === 'none') document.body.style.pointerEvents = '';
			if (document.body.style.overflow === 'hidden') document.body.style.overflow = '';
		}, 350);
		return () => window.clearTimeout(timer);
	}, [isOpen]);

	return (
		<ShadcnSheet open={isOpen} onOpenChange={onOpenChange} modal={false}>
			{trigger && <SheetTrigger asChild>{trigger}</SheetTrigger>}
			<SheetContent
				ref={contentRef}
				side={side}
				{...outsideDismissGuards}
				className={cn('h-screen overflow-y-auto rounded-[10px]', className, {
					'sm:max-w-sm': size === 'sm',
					'sm:max-w-md': size === 'md',
					'sm:max-w-lg': size === 'lg',
					'sm:max-w-xl': size === 'xl',
					'sm:max-w-2xl': size === '2xl',
					'sm:max-w-3xl': size === '3xl',
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
