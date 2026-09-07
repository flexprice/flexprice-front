import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * The glyph badge that sits before a section title.
 *
 * Defined once and shared by the portal's own sections and by the widget package's
 * self-built headers. Those cannot import from the portal directory — the package
 * ships to external consumers — so without a neutral home the same badge would be
 * written out six times and drift.
 */
const SectionIcon = ({ children, className }: { children: ReactNode; className?: string }) => (
	<span
		aria-hidden='true'
		className={cn(
			'flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-surface-subtle text-content-secondary [&>svg]:h-3.5 [&>svg]:w-3.5',
			className,
		)}>
		{children}
	</span>
);

export default SectionIcon;
