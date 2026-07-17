import type { ReactNode } from 'react';
import { InfoIcon } from '@/components/atoms';
import { cn } from '@/lib/utils';
import { getTypographyClass } from '@/lib/typography';

export interface SettingsCardHeaderProps {
	title: string;
	titleClassName?: string;
	className?: string;
	cta?: ReactNode;
	infoDescription?: string;
	infoAriaLabel?: string;
}

const SettingsCardHeader = ({ title, titleClassName, className, cta, infoDescription, infoAriaLabel }: SettingsCardHeaderProps) => (
	<div className={cn('mb-4', className)}>
		<div className='flex items-center justify-between gap-4'>
			<div className='flex min-w-0 items-center gap-1.5'>
				<h3 className={cn(getTypographyClass('card-header'), titleClassName)}>{title}</h3>
				{infoDescription ? <InfoIcon description={infoDescription} ariaLabel={infoAriaLabel ?? title} /> : null}
			</div>
			{cta ? <div className='shrink-0'>{cta}</div> : null}
		</div>
	</div>
);

export default SettingsCardHeader;
