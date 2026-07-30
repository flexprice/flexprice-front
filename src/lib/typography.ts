import { cn } from '@/lib/utils';

export const typography = {
	// Headings
	h1: 'text-2xl font-bold text-zinc-950',
	h2: 'text-xl font-semibold text-zinc-950',
	h3: 'text-lg font-semibold text-zinc-950',
	h4: 'text-base font-semibold text-zinc-950',

	// Card and Section Headers
	'card-title': 'text-base font-semibold text-zinc-950 mb-4',
	'section-title': 'text-base font-semibold text-zinc-950',
	'form-title': 'text-[20px] font-bold text-zinc-950',
	'subsection-title': 'text-sm font-medium text-zinc-950',

	// Body Text
	'body-large': 'text-base text-zinc-700',
	'body-default': 'text-sm text-zinc-700',
	'body-small': 'text-xs text-zinc-700',

	// Labels and Supporting Text
	'label-default': 'text-sm text-zinc-600 font-normal',
	'label-semibold': 'text-sm text-zinc-600 font-semibold',
	'label-small': 'text-xs text-zinc-600',
	'helper-text': 'text-xs text-zinc-500',

	// Interactive Text
	'button-large': 'text-base font-medium',
	'button-default': 'text-sm font-medium',
	'button-small': 'text-xs font-medium',

	// Status and Metadata
	'status-default': 'text-sm text-zinc-700',
	'status-muted': 'text-sm text-zinc-500',
	metadata: 'text-xs text-zinc-500',

	// Special Cases
	'table-header': 'text-sm font-medium text-zinc-700',
	'table-cell': 'text-sm text-zinc-900',
	'nav-item': 'text-sm font-medium text-zinc-700',
	breadcrumb: 'text-sm text-zinc-600',

	// card styles
	'card-header': 'text-[20px] font-medium text-zinc-950',
	'card-subtitle': 'text-sm text-zinc-500',

	// modal styles
	'modal-title': 'text-2xl font-bold text-zinc-950',
	'modal-subtitle': 'text-sm text-zinc-500',
} as const;

export type TypographyVariant = keyof typeof typography;

export const getTypographyClass = (variant: TypographyVariant, className?: string) => {
	return cn(typography[variant], className);
};

// Example usage:
// <p className={getTypographyClass('card-title', 'custom-class')}>Title</p>
