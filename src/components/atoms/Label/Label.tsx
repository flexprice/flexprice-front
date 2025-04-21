import { cn } from '@/lib/utils';

interface LabelProps {
	label: string;
	disabled?: boolean;
	labelClassName?: string;
	children?: React.ReactNode;
}

const Label = ({ label, disabled, labelClassName, children }: LabelProps) => {
	return (
		<label className={cn('font-inter block text-sm font-medium', disabled ? 'text-zinc-500' : 'text-zinc-950', labelClassName)}>
			{label ? label : children}
		</label>
	);
};

export default Label;
