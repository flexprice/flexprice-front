import { cn } from '@/lib/utils';
import React from 'react';

interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
	label: string;
	disabled?: boolean;
	labelClassName?: string;
	children?: React.ReactNode;
}

const Label = ({ label, disabled, labelClassName, children, htmlFor, ...props }: LabelProps) => {
	return (
		<label
			{...props}
			htmlFor={htmlFor}
			className={cn(' block text-sm font-medium', disabled ? 'text-zinc-500' : 'text-zinc-950', labelClassName)}>
			{label ? label : children}
		</label>
	);
};

export default Label;
