import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { InfoIcon } from '../InfoIcon';

export interface FieldWithInfoProps {
	label: string;
	description: string;
	infoAriaLabel: string;
	disabled?: boolean;
	className?: string;
	children: ReactNode;
}

const FieldWithInfo = ({ label, description, infoAriaLabel, disabled, className, children }: FieldWithInfoProps) => (
	<div className={cn('space-y-1', className)}>
		<div className='flex items-center gap-1.5'>
			<span className={disabled ? 'text-sm font-medium text-content-zinc-muted' : 'text-sm font-medium text-content-zinc'}>{label}</span>
			<InfoIcon description={description} ariaLabel={infoAriaLabel} disabled={disabled} />
		</div>
		{children}
	</div>
);

export default FieldWithInfo;
