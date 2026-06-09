import * as React from 'react';
import { cn } from '@/lib/utils';
import Label from '../Label';
import { sizes, SizeVariant } from '@/lib/sizing';

type InputVariant = 'text' | 'number' | 'formatted-number' | 'integer';

interface NumberFormatOptions {
	allowNegative?: boolean;
	allowDecimals?: boolean;
	thousandSeparator: string;
	decimalSeparator: string;
}

const DEFAULT_FORMAT_OPTIONS: NumberFormatOptions = {
	allowNegative: false,
	allowDecimals: true,
	thousandSeparator: ',',
	decimalSeparator: '.',
};

export const formatAmount = (amount: string, options: NumberFormatOptions = DEFAULT_FORMAT_OPTIONS): string => {
	if (!amount) return '';

	const { allowNegative, allowDecimals, thousandSeparator, decimalSeparator } = {
		...DEFAULT_FORMAT_OPTIONS,
		...options,
	};

	// Handle negative numbers
	const isNegative = allowNegative && amount.startsWith('-');
	const absAmount = isNegative ? amount.slice(1) : amount;

	const parts = absAmount.split(decimalSeparator);
	const integerPart = parts[0] || '';
	const decimalPart = parts[1];

	// Format integer part with separators
	const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, thousandSeparator);

	// Combine parts
	let result = formattedInteger;
	if (allowDecimals && decimalPart !== undefined) {
		result += decimalSeparator + decimalPart;
	}

	return isNegative ? '-' + result : result;
};

export const removeFormatting = (amount: string, options: NumberFormatOptions = DEFAULT_FORMAT_OPTIONS): string => {
	const { thousandSeparator } = { ...DEFAULT_FORMAT_OPTIONS, ...options };
	const escapedSeparator = thousandSeparator.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	return amount.replace(new RegExp(escapedSeparator, 'g'), '');
};

/** Printable ASCII + Basic Arabic (U+0600–U+06FF). */
const ENGLISH_ARABIC_REGEX = /[^\x20-\x7E\u0600-\u06FF]/g;

export const sanitizeEnglishOnly = (value: string): string => value.replace(ENGLISH_ARABIC_REGEX, '');

const getInputPattern = (variant: InputVariant, options: NumberFormatOptions = DEFAULT_FORMAT_OPTIONS): RegExp => {
	const { allowNegative, allowDecimals, decimalSeparator } = { ...DEFAULT_FORMAT_OPTIONS, ...options };

	switch (variant) {
		case 'integer':
			return allowNegative ? /^-?\d*$/ : /^\d*$/;
		case 'number':
		case 'formatted-number':
			return allowNegative
				? new RegExp(`^-?\\d*${allowDecimals ? `\\${decimalSeparator}?\\d*` : ''}$`)
				: new RegExp(`^\\d*${allowDecimals ? `\\${decimalSeparator}?\\d*` : ''}$`);
		default:
			return /.*/;
	}
};

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'size'> {
	label?: string;
	description?: React.ReactNode;
	error?: string;
	type?: React.HTMLInputTypeAttribute;
	onChange?: (value: string) => void;
	disabled?: boolean;
	suffix?: React.ReactNode;
	className?: string;
	placeholder?: string;
	id?: string;
	inputPrefix?: React.ReactNode;
	labelClassName?: string;
	variant?: InputVariant;
	formatOptions?: NumberFormatOptions;
	size?: SizeVariant;
	/**
	 * Restrict to printable ASCII and Basic Arabic.
	 * Defaults to true for `variant="text"`; set `englishOnly={false}` to allow other scripts.
	 */
	englishOnly?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
	(
		{
			className,
			type,
			label,
			description,
			error,
			onChange,
			disabled,
			placeholder,
			suffix,
			id,
			value,
			inputPrefix,
			labelClassName,
			variant = 'text',
			size = 'default',
			formatOptions = DEFAULT_FORMAT_OPTIONS,
			englishOnly = true,
			onBeforeInput: onBeforeInputProp,
			onPaste: onPasteProp,
			onCompositionEnd: onCompositionEndProp,
			...props
		},
		ref,
	) => {
		const inputRef = React.useRef<HTMLInputElement | null>(null);
		const [cursorPosition, setCursorPosition] = React.useState<number | null>(null);

		const enforceEnglishOnly = englishOnly ?? variant === 'text';
		const isFormattedVariant = variant === 'formatted-number' || variant === 'integer';
		const pattern = React.useMemo(() => getInputPattern(variant, formatOptions), [variant, formatOptions]);

		const applyEnglishOnly = React.useCallback(
			(raw: string) => (enforceEnglishOnly ? sanitizeEnglishOnly(raw) : raw),
			[enforceEnglishOnly],
		);

		const supportsSelectionRange = (element: HTMLInputElement) =>
			typeof element.setSelectionRange === 'function' && ['text', 'search', 'url', 'tel', 'password', ''].includes(element.type ?? '');

		// Handle cursor position after formatting
		React.useEffect(() => {
			if (cursorPosition !== null && inputRef.current) {
				if (supportsSelectionRange(inputRef.current)) {
					inputRef.current.setSelectionRange(cursorPosition, cursorPosition);
				}
				setCursorPosition(null);
			}
		}, [cursorPosition]);

		const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
			let newValue = e.target.value;
			const oldValue = (value as string) || '';
			const currentCursorPosition = e.target.selectionStart || 0;

			newValue = applyEnglishOnly(newValue);
			if (enforceEnglishOnly && newValue !== e.target.value) {
				const sanitizedBeforeCursor = sanitizeEnglishOnly(e.target.value.slice(0, currentCursorPosition));
				setCursorPosition(sanitizedBeforeCursor.length);
			}

			// For number variants, validate and format
			if (variant !== 'text') {
				// Remove formatting before validation
				if (isFormattedVariant) {
					newValue = removeFormatting(newValue, formatOptions);
				}

				// Validate against pattern
				if (!pattern.test(newValue)) {
					return;
				}

				// Handle cursor position for formatted variants
				if (isFormattedVariant) {
					const oldFormatCharCount = (oldValue.slice(0, currentCursorPosition).match(/,/g) || []).length;
					const newFormatCharCount = (formatAmount(newValue, formatOptions).slice(0, currentCursorPosition).match(/,/g) || []).length;
					const cursorAdjustment = newFormatCharCount - oldFormatCharCount;
					setCursorPosition(currentCursorPosition + cursorAdjustment);
				}
			}

			if (onChange) {
				onChange(newValue);
			}
		};

		const getValue = () => {
			let displayValue = value;
			if (enforceEnglishOnly && typeof displayValue === 'string') {
				displayValue = sanitizeEnglishOnly(displayValue);
			}
			if (isFormattedVariant && displayValue) {
				return formatAmount(displayValue as string, {
					...formatOptions,
					allowDecimals: variant !== 'integer',
				});
			}
			return displayValue;
		};

		return (
			<div className='space-y-1 w-full flex flex-col'>
				{/* Label */}
				{label && <Label label={label} disabled={disabled} labelClassName={labelClassName} htmlFor={id} />}
				{/* Input */}
				<div
					className={cn(
						sizes[size].height,
						sizes[size].padding,
						sizes[size].text,
						sizes[size].display,
						'w-full flex group items-center rounded-[6px] border bg-background ring-offset-background placeholder:text-muted-foreground disabled:opacity-50 disabled:cursor-not-allowed',
						error ? 'border-destructive' : 'border-input focus-within:ring-ring focus-within:ring-offset-2',
						'focus-within:border-border',
						className,
					)}>
					{inputPrefix && <div className='me-2'>{inputPrefix}</div>}
					<input
						{...props}
						id={id}
						type={type}
						value={getValue()}
						disabled={disabled}
						placeholder={placeholder}
						className={cn(
							'peer relative min-h-0 min-w-0 flex-1 bg-transparent outline-none ring-0 focus:outline-none placeholder:text-muted-foreground',
							disabled && 'text-muted-foreground',
							className,
						)}
						onChange={handleChange}
						ref={(element) => {
							inputRef.current = element;
							if (typeof ref === 'function') {
								ref(element);
							} else if (ref) {
								ref.current = element;
							}
						}}
					/>
					{suffix && (
						<div className='ms-2 flex shrink-0 items-center self-stretch ps-2 text-sm tabular-nums leading-none text-muted-foreground'>
							{suffix}
						</div>
					)}
				</div>
				{/* Description */}
				{description && <p className={cn('text-sm', disabled ? 'text-muted-foreground' : 'text-muted-foreground')}>{description}</p>}
				{/* Error Message */}
				{error && <p className='text-sm text-destructive'>{error}</p>}
			</div>
		);
	},
);

Input.displayName = 'Input';

export default Input;
