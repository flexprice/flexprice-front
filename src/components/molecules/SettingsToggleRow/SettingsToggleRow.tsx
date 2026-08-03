import { Switch } from '@/components/ui/switch';
import { InfoIcon } from '@/components/atoms';
import { cn } from '@/lib/utils';

export interface SettingsToggleRowProps {
	label: string;
	description?: string;
	infoAriaLabel?: string;
	checked: boolean;
	onCheckedChange: (checked: boolean) => void;
	disabled?: boolean;
	className?: string;
}

const SettingsToggleRow = ({
	label,
	description,
	infoAriaLabel,
	checked,
	onCheckedChange,
	disabled,
	className,
}: SettingsToggleRowProps) => {
	return (
		<div className={cn('flex items-center justify-between gap-4 py-4', className)}>
			<div className='flex min-w-0 items-center gap-1.5'>
				<span className='text-sm font-medium text-content-zinc-bold'>{label}</span>
				{description ? <InfoIcon description={description} ariaLabel={infoAriaLabel ?? label} disabled={disabled} /> : null}
			</div>
			<Switch checked={checked} onCheckedChange={onCheckedChange} disabled={disabled} aria-label={label} />
		</div>
	);
};

export default SettingsToggleRow;
