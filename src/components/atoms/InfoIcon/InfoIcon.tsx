import { Info } from 'lucide-react';
import Tooltip from '../Tooltip';
import { cn } from '@/lib/utils';

export interface InfoIconProps {
	description: string;
	ariaLabel: string;
	disabled?: boolean;
	className?: string;
}

const InfoIcon = ({ description, ariaLabel, disabled, className }: InfoIconProps) => (
	<Tooltip
		delayDuration={0}
		side='top'
		align='start'
		sideOffset={6}
		className='max-w-xs'
		content={<span className='block max-w-xs text-xs font-normal leading-relaxed'>{description}</span>}>
		<span
			tabIndex={0}
			aria-label={ariaLabel}
			className={cn(
				'inline-flex size-5 shrink-0 items-center justify-center rounded-md text-content-zinc-subtle outline-none transition-colors hover:bg-surface-muted hover:text-content-zinc-tertiary focus-visible:ring-2 focus-visible:ring-line-zinc-bold/40 focus-visible:ring-offset-2 focus-visible:ring-offset-surface',
				disabled && 'opacity-50',
				className,
			)}>
			<Info className='size-3.5' strokeWidth={1.5} aria-hidden />
		</span>
	</Tooltip>
);

export default InfoIcon;
