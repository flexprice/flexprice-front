import { cn } from '@/lib/utils';
import { FC, ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface ModalProps {
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	children?: ReactNode;
	className?: string;
	showOverlay?: boolean;
}

const Modal: FC<ModalProps> = ({ isOpen, onOpenChange, children, className, showOverlay = true }) => {
	if (!isOpen) return null;

	const modalContent = (
		<div
			className={cn('fixed inset-0 z-50 flex items-center justify-center', showOverlay ? 'bg-black bg-opacity-50' : '')}
			onClick={() => onOpenChange(false)}>
			<div className={cn('relative', className)} onClick={(e) => e.stopPropagation()}>
				{children}
			</div>
		</div>
	);

	// Render into portal
	const modalRoot = document.getElementById('modal-root');
	if (!modalRoot) return null;

	return createPortal(modalContent, modalRoot);
};

export default Modal;
