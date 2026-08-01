import { cn } from '@/lib/utils';

export const typography = {
	// Headings
	h1: 'text-2xl font-bold text-content-zinc',
	h2: 'text-xl font-semibold text-content-zinc',
	h3: 'text-lg font-semibold text-content-zinc',
	h4: 'text-base font-semibold text-content-zinc',

	// Card and Section Headers
	'card-title': 'text-base font-semibold text-content-zinc mb-4',
	'section-title': 'text-base font-semibold text-content-zinc',
	'form-title': 'text-[20px] font-bold text-content-zinc',
	'subsection-title': 'text-sm font-medium text-content-zinc',

	// Body Text
	'body-large': 'text-base text-content-zinc-secondary',
	'body-default': 'text-sm text-content-zinc-secondary',
	'body-small': 'text-xs text-content-zinc-secondary',

	// Labels and Supporting Text
	'label-default': 'text-sm text-content-zinc-tertiary font-normal',
	'label-semibold': 'text-sm text-content-zinc-tertiary font-semibold',
	'label-small': 'text-xs text-content-zinc-tertiary',
	'helper-text': 'text-xs text-content-zinc-muted',

	// Interactive Text
	'button-large': 'text-base font-medium',
	'button-default': 'text-sm font-medium',
	'button-small': 'text-xs font-medium',

	// Status and Metadata
	'status-default': 'text-sm text-content-zinc-secondary',
	'status-muted': 'text-sm text-content-zinc-muted',
	metadata: 'text-xs text-content-zinc-muted',

	// Special Cases
	'table-header': 'text-sm font-medium text-content-zinc-secondary',
	'table-cell': 'text-sm text-content-zinc-bold',
	'nav-item': 'text-sm font-medium text-content-zinc-secondary',
	breadcrumb: 'text-sm text-content-zinc-tertiary',

	// card styles
	'card-header': 'text-[20px] font-medium text-content-zinc',
	'card-subtitle': 'text-sm text-content-zinc-muted',

	// modal styles
	'modal-title': 'text-2xl font-bold text-content-zinc',
	'modal-subtitle': 'text-sm text-content-zinc-muted',
} as const;

export type TypographyVariant = keyof typeof typography;

export const getTypographyClass = (variant: TypographyVariant, className?: string) => {
	return cn(typography[variant], className);
};

// Example usage:
// <p className={getTypographyClass('card-title', 'custom-class')}>Title</p>
