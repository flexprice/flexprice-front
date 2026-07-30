import * as React from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange'> {
	label?: string;
	description?: string;
	error?: string;
	onChange?: (value: string) => void;
	disabled?: boolean;
	suffix?: React.ReactNode;
	className?: string;
	placeholder?: string;
	textAreaClassName?: string;
	id?: string;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, InputProps>(
	({ className, label, description, error, value, onChange, disabled, placeholder, suffix, id, textAreaClassName }, ref) => {
		return (
			<div className='space-y-1 w-full flex flex-col'>
				{/* Label */}
				{label && <label className={cn(' block text-sm font-medium', disabled ? 'text-zinc-500' : 'text-zinc-950')}>{label}</label>}

				{/* Input */}
				<div
					className={cn(
						'w-full flex items-center group  rounded-md border bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
						error ? 'border-destructive ring-destructive' : 'border-input focus-within:ring-ring focus-within:ring-offset-2',
						error ? 'border-destructive' : 'border-input focus-within:ring-ring focus-within:ring-offset-2',
						'focus-within:border-black',
						className,
					)}>
					<textarea
						id={id}
						value={value}
						disabled={disabled}
						placeholder={placeholder}
						className={cn(
							'peer text-start m-0 px-0  flex-1 bg-transparent outline-none ring-0 focus:outline-none w-full',
							'min-h-[100px] w-full text-base focus-visible:outline-none focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
							textAreaClassName,
						)}
						onChange={(e) => {
							if (onChange) {
								onChange(e.target.value);
							}
						}}
						ref={ref}
					/>
					{suffix && <div className='ms-2'>{suffix}</div>}
				</div>

				{/* Description */}
				{description && <p className={cn('text-sm', disabled ? 'text-zinc-500' : 'text-muted-foreground')}>{description}</p>}

				{/* Error Message */}
				{error && <p className='text-sm text-destructive'>{error}</p>}
			</div>
		);
	},
);

Textarea.displayName = 'Textarea';

export default Textarea;
