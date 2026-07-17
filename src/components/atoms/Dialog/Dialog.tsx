import { Dialog as ShadcnDialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import React, { FC, ReactNode } from 'react';

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
	return (
		<ShadcnDialog open={isOpen} onOpenChange={onOpenChange}>
			<DialogContent
				className={cn('bg-white rounded-[10px] max-h-[80vh] overflow-y-auto', className)}
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
