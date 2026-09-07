import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PortalRowProps {
	/** A small glyph, optically centred against the whole row rather than the title. */
	icon?: ReactNode;
	title: ReactNode;
	/** One line. Facts are joined with · rather than given an icon and a column each. */
	meta?: ReactNode;
	/** Chips and menus, right-aligned. */
	trailing?: ReactNode;
	className?: string;
}

/**
 * One item in a portal list.
 *
 * Subscriptions and payment methods each used to render their items as bordered
 * boxes inside the section's own card — a second level of hierarchy the content
 * does not have, and most of the page's excess height. Rows are separated by the
 * divider on their container instead, so nothing inside a section body carries a
 * border of its own.
 */
const PortalRow = ({ icon, title, meta, trailing, className }: PortalRowProps) => (
	<div className={cn('flex items-center justify-between gap-4 px-5 py-3.5', className)}>
		<div className='flex min-w-0 items-center gap-3'>
			{icon && (
				<span
					aria-hidden='true'
					className='flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-subtle text-content-secondary [&>svg]:h-4 [&>svg]:w-4'>
					{icon}
				</span>
			)}
			<div className='min-w-0'>
				<p className='truncate text-sm font-medium text-content'>{title}</p>
				{meta && <p className='mt-0.5 truncate text-xs text-content-tertiary'>{meta}</p>}
			</div>
		</div>
		{trailing && <div className='flex shrink-0 items-center gap-2'>{trailing}</div>}
	</div>
);

/** The container that separates rows, so no row has to carry a border itself. */
export const PortalRows = ({ children, className }: { children: ReactNode; className?: string }) => (
	<div className={cn('divide-y divide-line', className)}>{children}</div>
);

export default PortalRow;
