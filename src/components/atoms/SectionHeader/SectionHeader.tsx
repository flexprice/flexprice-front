import { cn } from '@/lib/utils';
import { getTypographyClass } from '@/lib/typography';
import { FC, ReactNode } from 'react';
import { Button } from '..';
import { IoSearch } from 'react-icons/io5';
import { SlidersHorizontal } from 'lucide-react';

interface Props {
	children?: ReactNode;
	title: ReactNode;
	className?: string;
	showSearch?: boolean;
	onSearch?: (value: string) => void;
	onSearchClick?: () => void;
	variant?: 'form-component-title' | 'sub-header' | 'form-title' | 'default';
	onFilterClick?: () => void;
	showFilter?: boolean;
	showButton?: boolean;
	buttonIcon?: ReactNode;
	buttonText?: string;
	onButtonClick?: () => void;
	optionsClassName?: string;
	subtitle?: string;
	titleClassName?: string;
	titleVariant?: 'form-component-title' | 'sub-header' | 'form-title' | 'default' | 'subtitle' | 'card-title';
}

const SectionHeader: FC<Props> = ({
	children,
	title,
	className,
	onFilterClick,
	onSearchClick,
	showFilter,
	showSearch,
	showButton,
	buttonIcon,
	buttonText,
	onButtonClick,
	optionsClassName,
	titleClassName,
}) => {
	return (
		<div className={cn('w-full py-6  flex items-center justify-between', className)}>
			<p className={cn(getTypographyClass('form-title'), titleClassName)}>{title}</p>
			<div className={cn('flex gap-2 items-center', optionsClassName)}>
				{showSearch && (
					<button onClick={onSearchClick} className='px-2 py-1'>
						<IoSearch className='size-4 font-extralight text-zinc-950' />
					</button>
				)}
				{showFilter && (
					<button onClick={onFilterClick} className='px-2 py-1'>
						<SlidersHorizontal className='size-4 text-zinc-950' />
					</button>
				)}
				{showButton && (
					<Button onClick={onButtonClick}>
						{buttonIcon}
						<span className={cn(getTypographyClass('button-default'))}>{buttonText}</span>
					</Button>
				)}
				{children}
			</div>
		</div>
	);
};

export default SectionHeader;
