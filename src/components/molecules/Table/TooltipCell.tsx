import { copyToClipboard } from '@/utils/common/helper_functions';
import { Copy } from 'lucide-react';
import { CSSProperties, FC, ReactNode, MouseEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface Props {
	tooltipContent: ReactNode;
	tooltipText: string;
	maxChars?: number;
	/**
	 * Hide the copy button until the surrounding `group` (a table row) is hovered or the button
	 * is keyboard-focused. Opt-in: `WorkflowDetailsPage` renders this inside a DetailsCard with
	 * no row to hover, where an always-hidden icon would be unreachable.
	 */
	revealOnHover?: boolean;
}

const TooltipCell: FC<Props> = ({ tooltipContent, tooltipText, maxChars, revealOnHover = false }) => {
	const { t } = useTranslation('common');
	const value = tooltipText.trim();

	const handleCopy = (event: MouseEvent<HTMLButtonElement>) => {
		event.stopPropagation();
		if (!value) return;
		void copyToClipboard(value, t('toast.copySuccess'));
	};

	if (!value) {
		return <span className='text-content-zinc-subtle'>{t('labels.na')}</span>;
	}

	const visible = maxChars && value.length > maxChars ? `${value.slice(0, maxChars)}…` : tooltipContent || value;
	// `ch` is the width of "0", which is wider than most email glyphs, so a 20ch
	// box left a hole before the icon. 0.5em tracks this UI font more closely.
	const textStyle: CSSProperties | undefined = maxChars ? { width: `${maxChars * 0.5}em` } : undefined;

	return (
		<div className='inline-flex max-w-full items-center gap-[3px]'>
			<TooltipProvider>
				<Tooltip>
					<TooltipTrigger asChild>
						<span className='truncate' style={textStyle}>
							{visible}
						</span>
					</TooltipTrigger>
					<TooltipContent>
						<p className='max-w-xs break-all'>{value}</p>
					</TooltipContent>
				</Tooltip>
			</TooltipProvider>
			<button
				type='button'
				data-interactive='true'
				onClick={handleCopy}
				title={t('labels.copyToClipboard')}
				aria-label={t('labels.copyToClipboard')}
				className={cn(
					'inline-flex shrink-0 items-center justify-center text-content-muted hover:text-foreground',
					revealOnHover &&
						'opacity-0 transition-opacity duration-150 focus-visible:opacity-100 group-hover:opacity-100 motion-reduce:transition-none',
				)}>
				<Copy className='size-3.5' />
			</button>
		</div>
	);
};

export default TooltipCell;
