import { cn } from '@/lib/utils';
import { X } from 'lucide-react';
import { FC, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '../Button';

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
				<Button
					variant={'ghost'}
					className='absolute top-4 right-4 z-[60]'
					onClick={(e) => {
						e.stopPropagation();
						onOpenChange(false);
					}}>
					<X className='size-4 cursor-pointer' />
				</Button>
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
