import { useEffect, useRef, useState } from 'react';
import { SearchIcon, XIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import Spinner from '@/components/atoms/Spinner/Spinner';

interface SearchBarProps {
	placeholder?: string;
	value?: string;
	onChange?: (value: string) => void;
	debounceMs?: number;
	isLoading?: boolean;
	onClear?: () => void;
	className?: string;
}

/**
 * Debounced search input with loading indicator and clear button.
 * Uses internal debounce — calls `onChange` only after the user stops typing.
 */
const SearchBar: React.FC<SearchBarProps> = ({
	placeholder = 'Search…',
	value: externalValue,
	onChange,
	debounceMs = 300,
	isLoading = false,
	onClear,
	className,
}) => {
	const [inputValue, setInputValue] = useState(externalValue ?? '');
	const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	// Sync external value changes
	useEffect(() => {
		if (externalValue !== undefined) {
			setInputValue(externalValue);
		}
	}, [externalValue]);

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const newValue = e.target.value;
		setInputValue(newValue);

		if (timerRef.current) clearTimeout(timerRef.current);
		timerRef.current = setTimeout(() => {
			onChange?.(newValue);
		}, debounceMs);
	};

	const handleClear = () => {
		setInputValue('');
		if (timerRef.current) clearTimeout(timerRef.current);
		onChange?.('');
		onClear?.();
	};

	return (
		<div
			className={cn(
				'flex items-center gap-2 px-3 h-9 rounded-[6px] border border-input bg-background focus-within:border-black focus-within:ring-1 focus-within:ring-ring transition-colors',
				className,
			)}>
			<SearchIcon size={16} className='text-muted-foreground shrink-0' />
			<input
				type='text'
				value={inputValue}
				onChange={handleChange}
				placeholder={placeholder}
				className='flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground min-w-0'
			/>
			{isLoading && <Spinner size={14} className='text-muted-foreground shrink-0' />}
			{!isLoading && inputValue && (
				<button
					onClick={handleClear}
					className='text-muted-foreground hover:text-foreground transition-colors shrink-0'
					aria-label='Clear search'>
					<XIcon size={14} />
				</button>
			)}
		</div>
	);
};

export default SearchBar;
