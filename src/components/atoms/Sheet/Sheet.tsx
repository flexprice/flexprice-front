import { FC, ReactNode, useRef, useEffect, useState, cloneElement, isValidElement } from 'react';
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
	const contentRef = useRef<HTMLDivElement>(null);
	const [isScrollable, setIsScrollable] = useState(false);

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
			const className = processedChildren.props?.className;
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
		<ShadcnSheet open={isOpen} onOpenChange={onOpenChange}>
			{trigger && <SheetTrigger asChild>{trigger}</SheetTrigger>}
			<SheetContent
				ref={contentRef}
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
				{processedChildren}
			</SheetContent>
		</ShadcnSheet>
	);
};

export default Sheet;
