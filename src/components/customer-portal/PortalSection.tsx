import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import SectionIcon from '@/components/atoms/SectionIcon/SectionIcon';

interface PortalSectionProps {
	/** A small glyph before the title, badged like every other section's. */
	icon?: ReactNode;
	title?: ReactNode;
	/** Supporting line under the title. Smaller than the title, never the same size. */
	description?: ReactNode;
	/** The section's one primary action, right-aligned in the header. */
	action?: ReactNode;
	/** Right-aligned metadata — a count, a status. Sits before the action. */
	meta?: ReactNode;
	/** Body padding is the section's to decide; a list of rows opts out with `flush`. */
	flush?: boolean;
	className?: string;
	children: ReactNode;
}

/**
 * The card every portal section renders through.
 *
 * Sections used to build their own card, header and padding by hand, which is why
 * the wallet was `p-5`, subscriptions `p-6`, and payment methods something else
 * again — seven padding values doing one job. Geometry lives here now, so header
 * alignment and internal spacing are correct by construction rather than by
 * agreement.
 *
 * Colour comes from utility classes, not inline styles: the tenant theme is
 * bridged onto the app's tokens in portalTheme, so `bg-surface` and `border-line`
 * already resolve to the tenant's palette when there is one.
 */
const PortalSection = ({ icon, title, description, action, meta, flush = false, className, children }: PortalSectionProps) => {
	const hasHeader = Boolean(title || description || action || meta);

	return (
		<section className={cn('rounded-xl border border-line bg-surface overflow-hidden', className)}>
			{hasHeader && (
				<div className='flex items-start justify-between gap-4 border-b border-line px-5 py-4'>
					<div className='flex min-w-0 items-center gap-2.5'>
						{icon && <SectionIcon>{icon}</SectionIcon>}
						<div className='min-w-0'>
							{title && <h3 className='text-sm font-medium text-content'>{title}</h3>}
							{description && <p className='mt-0.5 text-xs text-content-tertiary'>{description}</p>}
						</div>
					</div>
					{(meta || action) && (
						<div className='flex shrink-0 items-center gap-3'>
							{meta && <span className='text-xs text-content-tertiary'>{meta}</span>}
							{action}
						</div>
					)}
				</div>
			)}
			<div className={flush ? undefined : 'px-5 py-4'}>{children}</div>
		</section>
	);
};

export default PortalSection;
