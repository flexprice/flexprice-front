import { FC, ReactNode, useRef, useEffect, useState, useCallback, cloneElement, isValidElement } from 'react';
import { Sheet as ShadcnSheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { hasRegisteredOpenModals, registerModalOpen } from '@/lib/modal-scroll-lock';
import { useLocaleStore } from '@/store/useLocaleStore';
import { Direction } from '@/config/branding';

/**
 * Modal sheets set body `pointer-events: none`, and Radix Popover-based comboboxes
 * (SearchableSelect, AsyncSearchableSelect, and anything built on them, e.g. SelectGroup,
 * SelectFeature) portal their option list outside the sheet's DOM subtree, so their options
 * become unclickable — clicks fall through to the overlay instead of the option. Rendering
 * the sheet as non-modal and ignoring "outside" interactions that originate inside a
 * portaled popper avoids this for every consumer of this atom.
 */
export const isPortaledSelectTarget = (target: EventTarget | null) =>
	target instanceof Element && !!target.closest('[data-radix-popper-content-wrapper]');

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
	const [isScrollable, setIsScrollable] = useState(false);

	const preventPortaledSelectDismiss = useCallback((event: Event) => {
		if (isPortaledSelectTarget(event.target)) {
			event.preventDefault();
		}
	}, []);

	// Non-modal dialogs get no default protection against focus-outside dismissal (Radix only
	// applies that to modal dialogs). Without it, a sheet opened from a menu item/action button
	// closes itself the instant that trigger reclaims focus after its own menu finishes closing.
	// Focus moving elsewhere should never by itself close the sheet — only an explicit outside
	// click or the close button should.
	const preventFocusOutsideDismiss = useCallback((event: Event) => {
		event.preventDefault();
	}, []);

	useEffect(() => {
		if (isOpen && contentRef.current) {
			// Check if content is scrollable after a short delay to ensure DOM is fully rendered
			const checkScrollability = () => {
				if (contentRef.current) {
					const isScrollableContent = contentRef.current.scrollHeight > contentRef.current.clientHeight;
					setIsScrollable(isScrollableContent);
				}
			};

			// Check immediately and after a short delay
			checkScrollability();
			const timeoutId = setTimeout(checkScrollability, 100);
			const resizeObserver = new ResizeObserver(checkScrollability);
			resizeObserver.observe(contentRef.current);

			return () => {
				clearTimeout(timeoutId);
				resizeObserver.disconnect();
			};
		} else {
			setIsScrollable(false);
		}
	}, [isOpen, children]);

	// Register while open so the safety net below (and every other Dialog/Sheet instance) knows
	// not to clear the shared body lock while this one is still legitimately open.
	useEffect(() => {
		if (!isOpen) return;
		return registerModalOpen();
	}, [isOpen]);

	// Radix's scroll lock (react-remove-scroll) is expected to release document.body's
	// overflow/pointer-events once this sheet's close transition finishes. When this Sheet closes
	// while nested inside/alongside another modal (a Dialog, Select, or Popover opened from within
	// it), that release can race and get skipped — the lock stays stuck even though nothing is
	// visibly open, leaving the rest of the page unscrollable. As a safety net, once we transition
	// to closed, verify nothing else is still holding a lock and clear it.
	useEffect(() => {
		if (isOpen) return;
		const timer = window.setTimeout(() => {
			if (hasRegisteredOpenModals()) return;
			const anyOverlayOpen = document.querySelector('[role="dialog"][data-state="open"], [data-radix-popper-content-wrapper]');
			if (anyOverlayOpen) return;
			if (document.body.style.pointerEvents === 'none') document.body.style.pointerEvents = '';
			if (document.body.style.overflow === 'hidden') document.body.style.overflow = '';
		}, 350);
		return () => window.clearTimeout(timer);
	}, [isOpen]);

	// Process children to replace mt-4 with mt-9 if scrollable, or wrap in div with mt-9
	const processChildren = (node: ReactNode): ReactNode => {
		if (!isScrollable) {
			return node;
		}

		if (!isValidElement(node)) {
			return node;
		}

		const props = node.props as any;
		if (props?.className) {
			// Convert className to string to check for mt-4
			const classNameStr = typeof props.className === 'string' ? props.className : cn(props.className);

			if (classNameStr && classNameStr.includes('mt-4')) {
				// Replace mt-4 with mt-9, handling both standalone and in class strings
				const newClassName = cn(props.className).replace(/\bmt-4\b/g, 'mt-9');
				return cloneElement(node, {
					...props,
					className: newClassName,
				});
			}
		}

		// Recursively process children if it's a fragment or has children
		if (props?.children) {
			return cloneElement(node, {
				...props,
				children: Array.isArray(props.children) ? props.children.map(processChildren) : processChildren(props.children),
			});
		}

		return node;
	};

	// Check if first child has mt-4, if not and scrollable, wrap children in div with mt-9
	let processedChildren = processChildren(children);

	if (isScrollable) {
		// Check if we already processed a child with mt-4/mt-9
		let hasMarginTop = false;

		if (isValidElement(processedChildren)) {
			const className = (processedChildren.props as any)?.className;
			if (className) {
				const classNameStr = typeof className === 'string' ? className : cn(className);
				hasMarginTop = classNameStr.includes('mt-');
			}
		} else if (Array.isArray(processedChildren)) {
			// Check first child in array
			const firstChild = processedChildren[0];
			if (isValidElement(firstChild)) {
				const props = firstChild.props as any;
				const className = props?.className;
				if (className) {
					const classNameStr = typeof className === 'string' ? className : cn(className);
					hasMarginTop = classNameStr.includes('mt-');
				}
			}
		}

		// If no margin-top found and scrollable, wrap in div with mt-9
		if (!hasMarginTop) {
			processedChildren = <div className='mt-9'>{processedChildren}</div>;
		}
	}

	return (
		<ShadcnSheet open={isOpen} onOpenChange={onOpenChange} modal={false}>
			{trigger && <SheetTrigger asChild>{trigger}</SheetTrigger>}
			<SheetContent
				ref={contentRef}
				side={side}
				onPointerDownOutside={preventPortaledSelectDismiss}
				onInteractOutside={preventPortaledSelectDismiss}
				onFocusOutside={preventFocusOutsideDismiss}
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
				{processedChildren}
			</SheetContent>
		</ShadcnSheet>
	);
};

export default Sheet;
