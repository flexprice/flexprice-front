import { FC, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface Props {
	left: ReactNode;
	right: ReactNode;
	/** Square the photo's start edge so it meets the form as a straight line. Auth-only. */
	flushStart?: boolean;
}

/**
 * Same shell as MainLayout: canvas + inset padding + a clipped rounded island.
 * The photograph lives inside the island. It is not a sibling layer on top of it.
 */
const SplitIslandLayout: FC<Props> = ({ left, right, flushStart = false }) => {
	return (
		<div className='relative flex h-svh max-h-svh overflow-hidden bg-surface-canvas'>
			<div className='flex min-h-0 w-full min-w-0 flex-col lg:w-[45%]'>{left}</div>
			<div
				className={cn(
					'hidden min-h-0 min-w-0 flex-1 flex-col lg:flex',
					flushStart ? 'py-[var(--fp-shell-inset)] pe-[var(--fp-shell-inset)] ps-0' : 'p-[var(--fp-shell-inset)]',
				)}>
				<div
					data-testid='split-island-photo'
					className={cn(
						'relative flex min-h-0 flex-1 flex-col overflow-hidden shadow-[var(--fp-shell-shadow)]',
						'border border-line-zinc-strong !min-h-0',
						flushStart ? 'rounded-s-none rounded-e-[var(--fp-radius-shell)]' : 'rounded-[var(--fp-radius-shell)]',
					)}>
					{right}
				</div>
			</div>
		</div>
	);
};

export default SplitIslandLayout;
