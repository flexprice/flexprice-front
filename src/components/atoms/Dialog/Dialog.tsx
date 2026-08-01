import { Dialog as ShadcnDialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { hasRegisteredOpenModals, hasOpenOverlayInDom, registerModalOpen } from '@/lib/modal-scroll-lock';
import React, { FC, ReactNode, useEffect } from 'react';

interface Props {
	isOpen: boolean;
	onOpenChange: (isOpen: boolean) => void;
	title: string | ReactNode;
	description?: string | ReactNode;
	children?: ReactNode;
	className?: string;
	titleClassName?: string;
	descriptionClassName?: string;
	showCloseButton?: boolean;
	/**
	 * Opt-in for dialogs rendered inside interactive table rows. Radix portals the content to
	 * <body>, but React synthetic clicks still bubble through the React tree to those rows'
	 * onClick handlers (which often navigate). When true, the content is marked data-interactive
	 * (so Table's isInteractiveElement check short-circuits) and stops click propagation, so
	 * in-dialog clicks never trigger the row behind it. Default off — no effect on other dialogs.
	 */
	interactiveContent?: boolean;
}

const Dialog: FC<Props> = ({
	className,
	isOpen,
	onOpenChange,
	title,
	description,
	children,
	titleClassName,
	descriptionClassName,
	showCloseButton = true,
	interactiveContent = false,
}) => {
	// Register while open so the safety net below (and every other Dialog/Sheet instance) knows
	// not to clear the shared body lock while this one is still legitimately open.
	useEffect(() => {
		if (!isOpen) return;
		return registerModalOpen();
	}, [isOpen]);

	// Radix's scroll lock (react-remove-scroll) is expected to release document.body's
	// overflow/pointer-events once this dialog's close transition finishes. When this Dialog
	// closes while nested inside another modal (e.g. opened from a page that also has a Select or
	// another Dialog open), that release can race and get skipped — the lock stays stuck even
	// though nothing is visibly open, leaving the rest of the page unscrollable. As a safety net,
	// once we transition to closed, verify nothing else is still holding a lock and clear it.
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
		<ShadcnDialog open={isOpen} onOpenChange={onOpenChange}>
			<DialogContent
				className={cn('bg-surface rounded-[10px] max-h-[80vh] overflow-y-auto', className)}
				showCloseButton={showCloseButton}
				data-interactive={interactiveContent ? 'true' : undefined}
				onClick={interactiveContent ? (e: React.MouseEvent) => e.stopPropagation() : undefined}>
				<DialogHeader className=''>
					<DialogTitle className={cn('font-medium text-xl', titleClassName)}>
						{typeof title === 'string' ? title : <>{title}</>}
					</DialogTitle>
					{description && <DialogDescription className={cn('mt-6', descriptionClassName)}>{description}</DialogDescription>}
				</DialogHeader>
				<div className='mt-4 w-full min-w-0'>{children}</div>
			</DialogContent>
		</ShadcnDialog>
	);
};

export default Dialog;
